<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use App\Services\Payment\PaymentGatewayFactory;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Get active payment gateways
     */
    public function gateways(): JsonResponse
    {
        // Cache payment gateways for 30 minutes as they rarely change
        // Note: We don't cache the gateway instance used in initiate() - that's always fresh from DB
        $gateways = Cache::remember('payment_gateways_active', 1800, function () {
            return PaymentGateway::where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $gateways,
        ]);
    }

    /**
     * Initiate payment for a transaction
     */
    public function initiate(Request $request, PaymentTransaction $paymentTransaction): JsonResponse
    {
        $request->validate([
            'gateway_id' => 'required|exists:payment_gateways,id',
        ]);

        try {
            // Check authorization - user must own the reservation
            if ($request->user() && $paymentTransaction->reservation && 
                $paymentTransaction->reservation->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما دسترسی به این تراکنش ندارید',
                ], 403);
            }

            // Check if transaction is already paid
            if ($paymentTransaction->status->value === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'این تراکنش قبلاً پرداخت شده است',
                ], 400);
            }

            $gateway = PaymentGateway::findOrFail($request->gateway_id);

            if (!$gateway->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'این درگاه پرداخت فعال نیست',
                ], 400);
            }

            $gatewayInstance = PaymentGatewayFactory::create($gateway);

            if (!$gatewayInstance->isAvailable()) {
                return response()->json([
                    'success' => false,
                    'message' => 'درگاه پرداخت در دسترس نیست',
                ], 400);
            }

            // Update transaction with gateway
            $paymentTransaction->update([
                'gateway_id' => $gateway->id,
                'gateway' => $gateway->type,
            ]);

            // Build callback URL - ensure it's absolute for production
            $callbackUrl = route('payment.callback', ['gateway' => $gateway->type], true);
            
            Log::info('Payment initiate - callback URL', [
                'callback_url' => $callbackUrl,
                'gateway_type' => $gateway->type,
                'transaction_id' => $paymentTransaction->id,
            ]);

            // Initiate payment
            $result = $gatewayInstance->initiate($paymentTransaction, [
                'callback_url' => $callbackUrl,
            ]);

            if (!$result['success']) {
                $this->paymentService->updateTransactionStatus(
                    $paymentTransaction,
                    \App\Enums\PaymentStatus::FAILED
                );

                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'خطا در شروع پرداخت',
                ], 400);
            }

            // Update transaction with gateway transaction ID (authority for ZarinPal, trackId for Zibal)
            if (isset($result['form_data']['authority'])) {
                $paymentTransaction->update([
                    'gateway_transaction_id' => $result['form_data']['authority'],
                ]);
            } elseif (isset($result['form_data']['trackId'])) {
                $paymentTransaction->update([
                    'gateway_transaction_id' => $result['form_data']['trackId'],
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'transaction_id' => $paymentTransaction->id,
                    'redirect_url' => $result['redirect_url'],
                    'form_data' => $result['form_data'],
                ],
                'message' => $result['message'],
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'تراکنش یا درگاه پرداخت یافت نشد',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Payment initiate error', [
                'error' => $e->getMessage(),
                'transaction_id' => $paymentTransaction->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'خطا در پردازش درخواست: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle callback from payment gateway
     */
    public function callback(Request $request, string $gateway)
    {
        $callbackData = $request->all();

        try {
            $gatewayModel = PaymentGateway::where('type', $gateway)->first();

            if (!$gatewayModel) {
                Log::error('Payment gateway not found for callback', [
                    'gateway' => $gateway,
                    'callback_data' => $callbackData,
                ]);

                return redirect('/payment/error?message=' . urlencode('درگاه پرداخت یافت نشد'));
            }

            $gatewayInstance = PaymentGatewayFactory::create($gatewayModel);
            $result = $gatewayInstance->callback($callbackData);

            if (!$result['success'] || !$result['transaction_id']) {
                Log::warning('Payment callback failed', [
                    'gateway' => $gateway,
                    'result' => $result,
                ]);

                $errorMessage = $result['message'] ?? 'پرداخت انجام نشد یا توسط کاربر لغو شد';
                return redirect('/payment/error?message=' . urlencode($errorMessage));
            }

            $transaction = PaymentTransaction::findOrFail($result['transaction_id']);

            // Check idempotency - if already paid, just redirect to success
            if ($transaction->status->value === 'paid') {
                return redirect('/payment/success?transaction_id=' . $transaction->id)
                    ->with('success', 'پرداخت قبلاً با موفقیت انجام شده است');
            }

            // Get gateway transaction ID from callback data (Authority for ZarinPal, trackId for Zibal)
            $gatewayTransactionId = $callbackData['Authority'] ?? $callbackData['trackId'] ?? $transaction->gateway_transaction_id;

            // Verify payment
            $verifyResult = $gatewayInstance->verify($transaction, $callbackData);

            if ($verifyResult['verified']) {
                // Update transaction status
                $this->paymentService->updateTransactionStatus(
                    $transaction,
                    \App\Enums\PaymentStatus::PAID,
                    $gatewayTransactionId,
                    $verifyResult['data'] ?? null
                );

                // Redirect to success page
                return redirect('/payment/success?transaction_id=' . $transaction->id)
                    ->with('success', 'پرداخت با موفقیت انجام شد');
            } else {
                // Update transaction status to failed
                $this->paymentService->updateTransactionStatus(
                    $transaction,
                    \App\Enums\PaymentStatus::FAILED,
                    null,
                    $verifyResult
                );

                $errorMessage = $verifyResult['message'] ?? 'پرداخت تایید نشد';
                return redirect('/payment/error?message=' . urlencode($errorMessage));
            }

        } catch (ModelNotFoundException $e) {
            Log::error('Payment callback model not found', [
                'gateway' => $gateway,
                'callback_data' => $callbackData,
                'error' => $e->getMessage(),
            ]);

            return redirect('/payment/error?message=' . urlencode('اطلاعات پرداخت یافت نشد'));
        } catch (\Exception $e) {
            Log::error('Payment callback unexpected error', [
                'gateway' => $gateway,
                'callback_data' => $callbackData,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect('/payment/error?message=' . urlencode('خطا در پردازش پرداخت'));
        }
    }

    /**
     * Get payment status
     */
    public function status(Request $request, PaymentTransaction $paymentTransaction): JsonResponse
    {
        try {
            // Check authorization
            if ($request->user() && $paymentTransaction->reservation && 
                $paymentTransaction->reservation->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما دسترسی به این تراکنش ندارید',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $paymentTransaction->id,
                    'status' => $paymentTransaction->status->value,
                    'amount' => $paymentTransaction->amount,
                    'gateway' => $paymentTransaction->gateway,
                    'gateway_transaction_id' => $paymentTransaction->gateway_transaction_id,
                    'reservation_id' => $paymentTransaction->reservation_id,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'تراکنش یافت نشد',
            ], 404);
        }
    }
}

