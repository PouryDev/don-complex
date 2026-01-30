<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\CoinRewardRule;
use App\Models\PaymentTransaction;
use App\Models\Reservation;
use App\Services\CoinService;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    protected ReservationService $reservationService;
    protected CoinService $coinService;

    public function __construct(ReservationService $reservationService, CoinService $coinService)
    {
        $this->reservationService = $reservationService;
        $this->coinService = $coinService;
    }

    /**
     * Create a payment transaction for a reservation
     */
    public function createTransaction(
        Reservation $reservation,
        float $amount,
        ?string $gateway = null
    ): PaymentTransaction {
        return DB::transaction(function () use ($reservation, $amount, $gateway) {
            $transaction = PaymentTransaction::create([
                'reservation_id' => $reservation->id,
                'amount' => $amount,
                'gateway' => $gateway,
                'status' => PaymentStatus::PENDING,
            ]);

            // Update reservation with payment transaction id
            $reservation->update([
                'payment_transaction_id' => $transaction->id,
            ]);

            return $transaction;
        });
    }

    /**
     * Update payment transaction status
     */
    public function updateTransactionStatus(
        PaymentTransaction $transaction,
        PaymentStatus $status,
        ?string $gatewayTransactionId = null,
        ?array $metadata = null
    ): void {
        $transaction->update([
            'status' => $status,
            'gateway_transaction_id' => $gatewayTransactionId ?? $transaction->gateway_transaction_id,
            'metadata' => $metadata ?? $transaction->metadata,
        ]);

        // Update reservation payment status and confirm payment if successful
        if ($transaction->reservation) {
            $reservation = $transaction->reservation;
            $wasPending = $reservation->payment_status === PaymentStatus::PENDING;
            
            $reservation->update([
                'payment_status' => $status,
            ]);

            // If payment is successful and was previously pending, confirm the reservation
            if ($status === PaymentStatus::PAID && $wasPending) {
                $this->reservationService->confirmPayment($reservation);
                
                // Award coins for successful reservation payment
                $coins = CoinRewardRule::getCoinsFor($reservation);
                if ($coins) {
                    // Check if user already received coins for this reservation
                    $existingTransaction = \App\Models\CoinTransaction::where('user_id', $reservation->user_id)
                        ->where('source', 'reservation')
                        ->where('related_type', get_class($reservation))
                        ->where('related_id', $reservation->id)
                        ->first();

                    if (!$existingTransaction) {
                        $this->coinService->awardCoins($reservation->user, $coins, 'reservation', $reservation);
                    }
                }
            }
        }
    }

    /**
     * Recalculate transaction amount based on reservation and orders
     */
    public function recalculateTransactionAmount(Reservation $reservation): void
    {
        // Only recalculate if payment is still pending
        if ($reservation->payment_status !== PaymentStatus::PENDING) {
            throw new \Exception('نمی‌توان مبلغ تراکنش پرداخت شده را تغییر داد.');
        }

        $transaction = $reservation->paymentTransaction;
        if (!$transaction) {
            throw new \Exception('تراکنش پرداخت یافت نشد.');
        }

        // Calculate new total amount
        $newAmount = $reservation->getTotalAmount();

        // Update transaction amount
        DB::transaction(function () use ($transaction, $newAmount) {
            $transaction->update([
                'amount' => $newAmount,
            ]);
        });
    }

    /**
     * Handle payment gateway callback (placeholder for actual gateway integration)
     */
    public function handleGatewayCallback(
        PaymentTransaction $transaction,
        string $gatewayTransactionId,
        bool $success,
        ?array $metadata = null
    ): void {
        $status = $success ? PaymentStatus::PAID : PaymentStatus::FAILED;

        $this->updateTransactionStatus(
            $transaction,
            $status,
            $gatewayTransactionId,
            $metadata
        );
    }
}

