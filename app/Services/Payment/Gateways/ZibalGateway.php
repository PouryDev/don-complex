<?php

namespace App\Services\Payment\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ZibalGateway implements PaymentGatewayInterface
{
    protected PaymentGateway $gateway;
    protected string $merchantId;
    protected bool $sandbox;

    // Zibal API endpoints
    protected const REQUEST_URL = 'https://gateway.zibal.ir/v1/request';
    protected const VERIFY_URL = 'https://gateway.zibal.ir/v1/verify';
    protected const PAYMENT_URL = 'https://gateway.zibal.ir/start/';

    public function __construct(PaymentGateway $gateway)
    {
        $this->gateway = $gateway;
        $this->merchantId = $gateway->getConfig('merchant_id', env('ZIBAL_MERCHANT_ID', ''));
        $this->sandbox = $gateway->getConfig('sandbox', env('ZIBAL_SANDBOX', false));
    }

    /**
     * Initialize payment with Zibal
     */
    public function initiate(PaymentTransaction $transaction, array $additionalData = []): array
    {
        try {
            if (empty($this->merchantId)) {
                return [
                    'success' => false,
                    'redirect_url' => null,
                    'form_data' => null,
                    'message' => 'Merchant ID تنظیم نشده است',
                ];
            }

            $callbackUrl = $additionalData['callback_url'] ?? route('payment.callback', ['gateway' => 'zibal']);
            $reservation = $transaction->reservation;
            $description = $additionalData['description'] ?? "پرداخت رزرو شماره {$transaction->id}";

            // Convert Toman to Rials (Zibal uses Rials)
            $amount = $transaction->amount * 10;

            $requestData = [
                'merchant' => $this->merchantId,
                'amount' => $amount,
                'description' => $description,
                'callbackUrl' => $callbackUrl,
            ];

            // In sandbox mode, use test merchant
            if ($this->sandbox) {
                $requestData['merchant'] = 'zibal'; // Test merchant ID
            }

            $response = Http::timeout(30)->post(self::REQUEST_URL, $requestData);

            if (!$response->successful()) {
                Log::error('Zibal request failed', [
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

            if (isset($responseData['result']) && $responseData['result'] == 100 && isset($responseData['trackId'])) {
                $trackId = $responseData['trackId'];
                $paymentUrl = self::PAYMENT_URL . $trackId;

                return [
                    'success' => true,
                    'redirect_url' => $paymentUrl,
                    'form_data' => [
                        'trackId' => $trackId,
                    ],
                    'message' => 'در حال انتقال به درگاه پرداخت...',
                ];
            } else {
                $errorMessage = $this->getErrorMessage($responseData['result'] ?? 0);

                return [
                    'success' => false,
                    'redirect_url' => null,
                    'form_data' => null,
                    'message' => $errorMessage,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Zibal initiate error', [
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
            if (empty($this->merchantId)) {
                return [
                    'success' => false,
                    'verified' => false,
                    'message' => 'Merchant ID تنظیم نشده است',
                    'data' => [],
                ];
            }

            $trackId = $callbackData['trackId'] ?? $transaction->gateway_transaction_id;

            if (empty($trackId)) {
                return [
                    'success' => false,
                    'verified' => false,
                    'message' => 'کد TrackId یافت نشد',
                    'data' => [],
                ];
            }

            // Convert Toman to Rials (Zibal uses Rials)
            $amount = $transaction->amount * 10;

            $requestData = [
                'merchant' => $this->merchantId,
                'trackId' => $trackId,
            ];

            // In sandbox mode, use test merchant
            if ($this->sandbox) {
                $requestData['merchant'] = 'zibal';
            }

            $response = Http::timeout(30)->post(self::VERIFY_URL, $requestData);

            if (!$response->successful()) {
                Log::error('Zibal verify failed', [
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

            // Check if result is 100 (success) or 201 (previously verified)
            // Status: 1 = paid, 2 = paid (already verified), 3 = failed, 4 = cancelled
            // Result: 100 = success, 201 = previously verified (also success)
            $result = $responseData['result'] ?? 0;
            
            if ($result == 100 || $result == 201) {
                // 201 means payment was already verified (successful duplicate verification)
                if ($result == 201) {
                    return [
                        'success' => true,
                        'verified' => true,
                        'message' => 'پرداخت قبلاً تایید شده است',
                        'data' => [
                            'refNumber' => $responseData['refNumber'] ?? null,
                            'cardNumber' => $responseData['cardNumber'] ?? null,
                            'status' => $responseData['status'] ?? null,
                        ],
                    ];
                }
                
                // Result is 100, check status if exists
                $status = $responseData['status'] ?? null;
                
                // If status exists, check it (1 or 2 means successful)
                // If status doesn't exist, result == 100 is enough
                if ($status === null || $status == 1 || $status == 2) {
                    return [
                        'success' => true,
                        'verified' => true,
                        'message' => 'پرداخت با موفقیت تایید شد',
                        'data' => [
                            'refNumber' => $responseData['refNumber'] ?? null,
                            'cardNumber' => $responseData['cardNumber'] ?? null,
                            'status' => $status,
                        ],
                    ];
                } else {
                    // Payment was not successful based on status
                    return [
                        'success' => false,
                        'verified' => false,
                        'message' => 'پرداخت انجام نشده است (وضعیت: ' . $status . ')',
                        'data' => [],
                    ];
                }
            } else {
                $errorMessage = $this->getErrorMessage($result);

                return [
                    'success' => false,
                    'verified' => false,
                    'message' => $errorMessage,
                    'data' => [],
                ];
            }
        } catch (\Exception $e) {
            Log::error('Zibal verify error', [
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
     * Handle callback from Zibal
     */
    public function callback(array $callbackData): array
    {
        try {
            // Zibal sends success as string "1" or "0" in GET parameters
            $success = $callbackData['success'] ?? null;
            $trackId = $callbackData['trackId'] ?? null;

            // Check if payment was successful (success can be "1", 1, true, or "true")
            $isSuccess = $success === '1' || $success === 1 || $success === true || $success === 'true';

            if (!$isSuccess || empty($trackId)) {
                return [
                    'success' => false,
                    'transaction_id' => null,
                    'verified' => false,
                    'message' => 'پرداخت انجام نشد یا توسط کاربر لغو شد',
                ];
            }

            // Find transaction by trackId
            $transaction = PaymentTransaction::where('gateway_transaction_id', $trackId)
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
            Log::error('Zibal callback error', [
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
        return $this->gateway->display_name ?? 'زیبال';
    }

    /**
     * Check if gateway is available
     */
    public function isAvailable(): bool
    {
        if (!$this->gateway->is_active) {
            return false;
        }

        // In sandbox mode, merchant is always "zibal", so we don't need to check merchant_id
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
            100 => 'عملیات موفق',
            102 => 'merchant یافت نشد',
            103 => 'merchant غیرفعال',
            104 => 'merchant نامعتبر',
            105 => 'amount بایستی بزرگتر از 1,000 ریال باشد',
            106 => 'callbackUrl نامعتبر می‌باشد (شروع با http و یا https)',
            113 => 'amount مبلغ تراکنش از سقف میزان تراکنش بیشتر است',
            201 => 'قبلا تایید شده',
            202 => 'سفارش پرداخت نشده یا ناموفق بوده است',
            203 => 'trackId نامعتبر می‌باشد',
            401 => 'شماره سفارش `orderId` تکراری می‌باشد',
            402 => 'زمان مجاز برای پرداخت به پایان رسیده است',
            403 => 'یک یا چند پارامتر ارسالی نامعتبر است',
            404 => 'درگاه پرداختی برای این merchant یافت نشد',
            405 => 'تایید پرداخت امکان پذیر نیست',
            406 => 'یک یا چند پارامتر تایید پرداخت نامعتبر است',
            501 => 'امکان ایجاد درخواست برای این merchant وجود ندارد',
            502 => 'امکان ایجاد درخواست برای این merchant وجود ندارد',
            503 => 'امکان ایجاد درخواست برای این merchant وجود ندارد',
        ];

        return $messages[$code] ?? "خطای نامشخص (کد: {$code})";
    }
}

