<?php

namespace App\Services\Payment\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;

class ZarinPalGateway implements PaymentGatewayInterface
{
    protected PaymentGateway $gateway;
    protected string $merchantId;
    protected bool $sandbox;

    // ZarinPal API endpoints
    protected const REQUEST_URL = 'https://api.zarinpal.com/pg/v4/payment/request.json';
    protected const VERIFY_URL = 'https://api.zarinpal.com/pg/v4/payment/verify.json';
    protected const PAYMENT_URL = 'https://www.zarinpal.com/pg/StartPay/';

    public function __construct(PaymentGateway $gateway)
    {
        $this->gateway = $gateway;
        $this->merchantId = $gateway->getConfig('merchant_id', env('ZARINPAL_MERCHANT_ID', ''));
        $this->sandbox = $gateway->getConfig('sandbox', env('ZARINPAL_SANDBOX', true));
    }

    /**
     * Initialize payment with ZarinPal
     */
    public function initiate(PaymentTransaction $transaction, array $additionalData = []): array
    {
        try {
            // In sandbox mode, merchant_id is not required (we use test merchant)
            if (!$this->sandbox && empty($this->merchantId)) {
                return [
                    'success' => false,
                    'redirect_url' => null,
                    'form_data' => null,
                    'message' => 'Merchant ID تنظیم نشده است',
                ];
            }

            $callbackUrl = $additionalData['callback_url'] ?? route('payment.callback', ['gateway' => 'zarinpal']);
            $reservation = $transaction->reservation;
            $description = $additionalData['description'] ?? "پرداخت رزرو شماره {$transaction->id}";

            // Convert Toman to Rials (ZarinPal uses Rials)
            $amount = $transaction->amount * 10;

            $requestData = [
                'merchant_id' => $this->merchantId,
                'amount' => $amount,
                'description' => $description,
                'callback_url' => $callbackUrl,
                'metadata' => [
                    'transaction_id' => $transaction->id,
                    'reservation_id' => $reservation->id ?? null,
                ],
            ];

            // In sandbox mode, use test merchant
            if ($this->sandbox) {
                $requestData['merchant_id'] = 'eaa46b01-819e-42ef-8a67-ba2bb7f69a32'; // Test merchant ID
            }

            $url = self::REQUEST_URL;

            $response = Http::timeout(30)->post($url, $requestData);

            if (!$response->successful()) {
                Log::error('ZarinPal request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'transaction_id' => $transaction->id,
                ]);

                return [
                    'success' => false,
                    'redirect_url' => null,
                    'form_data' => null,
                    'message' => 'خطا در ارتباط با درگاه پرداخت',
                ];
            }

            $responseData = $response->json();

            if ($responseData['data']['code'] == 100) {
                $authority = $responseData['data']['authority'];
                $paymentUrl = self::PAYMENT_URL . $authority;

                return [
                    'success' => true,
                    'redirect_url' => $paymentUrl,
                    'form_data' => [
                        'authority' => $authority,
                    ],
                    'message' => 'در حال انتقال به درگاه پرداخت...',
                ];
            } else {
                $errorMessage = $this->getErrorMessage($responseData['data']['code']);

                return [
                    'success' => false,
                    'redirect_url' => null,
                    'form_data' => null,
                    'message' => $errorMessage,
                ];
            }
        } catch (\Exception $e) {
            Log::error('ZarinPal initiate error', [
                'error' => $e->getMessage(),
                'transaction_id' => $transaction->id,
            ]);

            return [
                'success' => false,
                'redirect_url' => null,
                'form_data' => null,
                'message' => 'خطا در ارتباط با درگاه پرداخت: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify payment transaction
     */
    public function verify(PaymentTransaction $transaction, array $callbackData = []): array
    {
        try {
            // In sandbox mode, merchant_id is not required (we use test merchant)
            if (!$this->sandbox && empty($this->merchantId)) {
                return [
                    'success' => false,
                    'verified' => false,
                    'message' => 'Merchant ID تنظیم نشده است',
                    'data' => [],
                ];
            }

            $authority = $callbackData['Authority'] ?? $transaction->gateway_transaction_id;

            if (empty($authority)) {
                return [
                    'success' => false,
                    'verified' => false,
                    'message' => 'کد Authority یافت نشد',
                    'data' => [],
                ];
            }

            // Convert Toman to Rials (ZarinPal uses Rials)
            $amount = $transaction->amount * 10;

            $requestData = [
                'merchant_id' => $this->merchantId,
                'authority' => $authority,
                'amount' => $amount,
            ];

            // In sandbox mode, use test merchant
            if ($this->sandbox) {
                $requestData['merchant_id'] = 'eaa46b01-819e-42ef-8a67-ba2bb7f69a32'; // Test merchant ID
            }

            $url = self::VERIFY_URL;

            $response = Http::timeout(30)->post($url, $requestData);

            if (!$response->successful()) {
                Log::error('ZarinPal verify failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'transaction_id' => $transaction->id,
                ]);

                return [
                    'success' => false,
                    'verified' => false,
                    'message' => 'خطا در تایید پرداخت',
                    'data' => [],
                ];
            }

            $responseData = $response->json();

            if ($responseData['data']['code'] == 100 || $responseData['data']['code'] == 101) {
                return [
                    'success' => true,
                    'verified' => true,
                    'message' => 'پرداخت با موفقیت تایید شد',
                    'data' => [
                        'ref_id' => $responseData['data']['ref_id'] ?? null,
                        'card_hash' => $responseData['data']['card_hash'] ?? null,
                        'card_pan' => $responseData['data']['card_pan'] ?? null,
                    ],
                ];
            } else {
                $errorMessage = $this->getErrorMessage($responseData['data']['code']);

                return [
                    'success' => false,
                    'verified' => false,
                    'message' => $errorMessage,
                    'data' => [],
                ];
            }
        } catch (\Exception $e) {
            Log::error('ZarinPal verify error', [
                'error' => $e->getMessage(),
                'transaction_id' => $transaction->id,
            ]);

            return [
                'success' => false,
                'verified' => false,
                'message' => 'خطا در تایید پرداخت: ' . $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Handle callback from ZarinPal
     */
    public function callback(array $callbackData): array
    {
        try {
            $status = $callbackData['Status'] ?? null;
            $authority = $callbackData['Authority'] ?? null;

            if ($status !== 'OK' || empty($authority)) {
                return [
                    'success' => false,
                    'transaction_id' => null,
                    'verified' => false,
                    'message' => 'پرداخت انجام نشد یا توسط کاربر لغو شد',
                ];
            }

            // Find transaction by authority
            $transaction = PaymentTransaction::where('gateway_transaction_id', $authority)
                ->where('gateway_id', $this->gateway->id)
                ->first();

            if (!$transaction) {
                return [
                    'success' => false,
                    'transaction_id' => null,
                    'verified' => false,
                    'message' => 'تراکنش یافت نشد',
                ];
            }

            // Verify the payment
            $verifyResult = $this->verify($transaction, $callbackData);

            return [
                'success' => $verifyResult['success'],
                'transaction_id' => $transaction->id,
                'verified' => $verifyResult['verified'],
                'message' => $verifyResult['message'],
            ];
        } catch (\Exception $e) {
            Log::error('ZarinPal callback error', [
                'error' => $e->getMessage(),
                'callback_data' => $callbackData,
            ]);

            return [
                'success' => false,
                'transaction_id' => null,
                'verified' => false,
                'message' => 'خطا در پردازش callback: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get gateway display name
     */
    public function getDisplayName(): string
    {
        return $this->gateway->display_name ?? 'زرین‌پال';
    }

    /**
     * Check if gateway is available
     */
    public function isAvailable(): bool
    {
        if (!$this->gateway->is_active) {
            return false;
        }

        // In sandbox mode, merchant is always test merchant, so we don't need to check merchant_id
        if ($this->sandbox) {
            return true;
        }

        // In production mode, merchant_id must be set
        return !empty($this->merchantId);
    }

    /**
     * Get error message by code
     */
    protected function getErrorMessage(int $code): string
    {
        $messages = [
            -9 => 'خطای اعتبارسنجی',
            -10 => 'IP یا مرچنت کد پذیرنده صحیح نیست',
            -11 => 'مرچنت کد پذیرنده فعال نیست',
            -12 => 'تلاش بیش از حد در یک بازه زمانی کوتاه',
            -15 => 'ترمینال شما به حالت تعلیق در آمده است',
            -16 => 'سطح تایید پذیرنده پایین تر از سطح نقره ای است',
            -30 => 'اجازه دسترسی به تسویه اشتراکی شناور ندارید',
            -31 => 'حساب بانکی تسویه را به پنل اضافه کنید',
            -32 => 'مبلغ از حد مجاز بیشتر است',
            -33 => 'درخواست تکراری است',
            -34 => 'درخواست یافت نشد',
            -35 => 'امکان ویرایش درخواست وجود ندارد',
            -40 => 'پارامترهای ارسالی صحیح نیست',
            -50 => 'مبلغ پرداخت شده با مبلغ درخواست شده مطابقت ندارد',
            -51 => 'پرداخت ناموفق بوده است',
            -52 => 'خطای غیر منتظره',
            -53 => 'اتصالات به درگاه بانکی برقرار نشد',
            -54 => 'عملیات ناموفق بوده است',
            -55 => 'خطای غیر منتظره',
            -56 => 'خطای غیر منتظره',
            -57 => 'مبلغ از حد مجاز بیشتر است',
            -58 => 'خطای غیر منتظره',
            -59 => 'خطای غیر منتظره',
            100 => 'عملیات موفق',
            101 => 'عملیات تایید شده',
        ];

        return $messages[$code] ?? "خطای نامشخص (کد: {$code})";
    }
}

