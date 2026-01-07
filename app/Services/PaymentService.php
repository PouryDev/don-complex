<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\PaymentTransaction;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    protected ReservationService $reservationService;

    public function __construct(ReservationService $reservationService)
    {
        $this->reservationService = $reservationService;
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
            }
        }
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

