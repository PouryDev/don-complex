<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\User;
use App\Models\PaymentTransaction;

class CashierPolicy
{
    /**
     * Check if user can view reservations in their branch
     */
    public function viewReservation(User $user, Reservation $reservation): bool
    {
        if (!$user->isCashier() || !$user->branch) {
            return false;
        }

        return $reservation->session->branch_id === $user->branch->id;
    }

    /**
     * Check if user can process payments for reservations in their branch
     */
    public function processPayment(User $user, Reservation $reservation): bool
    {
        if (!$user->isCashier() || !$user->branch) {
            return false;
        }

        return $reservation->session->branch_id === $user->branch->id;
    }

    /**
     * Check if user can view transactions in their branch
     */
    public function viewTransaction(User $user, PaymentTransaction $transaction): bool
    {
        if (!$user->isCashier() || !$user->branch) {
            return false;
        }

        if (!$transaction->reservation || !$transaction->reservation->session) {
            return false;
        }

        return $transaction->reservation->session->branch_id === $user->branch->id;
    }
}


