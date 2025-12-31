<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Reservation;
use App\Models\Session;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    protected SessionService $sessionService;

    public function __construct(SessionService $sessionService)
    {
        $this->sessionService = $sessionService;
    }

    /**
     * Create a reservation with pessimistic locking to prevent race conditions
     */
    public function createReservation(User $user, Session $session, int $numberOfPeople): Reservation
    {
        return DB::transaction(function () use ($user, $session, $numberOfPeople) {
            // Lock the session row for update to prevent concurrent modifications
            $lockedSession = Session::lockForUpdate()->findOrFail($session->id);

            // Check if there are enough spots available
            if (!$this->sessionService->hasEnoughSpots($lockedSession, $numberOfPeople)) {
                throw new \Exception('Not enough spots available for this session');
            }

            // Create the reservation
            $reservation = Reservation::create([
                'user_id' => $user->id,
                'session_id' => $lockedSession->id,
                'number_of_people' => $numberOfPeople,
                'payment_status' => PaymentStatus::PENDING,
            ]);

            // Update the session's current participants count atomically
            $lockedSession->increment('current_participants', $numberOfPeople);

            return $reservation;
        });
    }

    /**
     * Calculate total price for a reservation
     */
    public function calculateTotalPrice(Session $session, int $numberOfPeople): float
    {
        return (float) ($session->price * $numberOfPeople);
    }

    /**
     * Cancel a reservation and update session participants
     */
    public function cancelReservation(Reservation $reservation): bool
    {
        if ($reservation->cancelled_at) {
            return false; // Already cancelled
        }

        return DB::transaction(function () use ($reservation) {
            $reservation->update([
                'cancelled_at' => now(),
            ]);

            // Decrement session participants
            $session = Session::lockForUpdate()->findOrFail($reservation->session_id);
            $session->decrement('current_participants', $reservation->number_of_people);

            return true;
        });
    }

    /**
     * Update payment status
     */
    public function updatePaymentStatus(Reservation $reservation, PaymentStatus $status): void
    {
        $reservation->update([
            'payment_status' => $status,
        ]);
    }
}

