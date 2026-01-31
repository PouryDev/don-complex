<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Reservation;
use App\Models\Session;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReservationService
{
    protected SessionService $sessionService;
    protected OrderService $orderService;

    public function __construct(SessionService $sessionService, OrderService $orderService)
    {
        $this->sessionService = $sessionService;
        $this->orderService = $orderService;
    }

    /**
     * Create a reservation with pessimistic locking to prevent race conditions
     */
    public function createReservation(User $user, Session $session, int $numberOfPeople): Reservation
    {
        return DB::transaction(function () use ($user, $session, $numberOfPeople) {
            // Lock the session row for update to prevent concurrent modifications
            $lockedSession = Session::lockForUpdate()->findOrFail($session->id);

            // Expire unpaid reservations before checking capacity
            $this->expireUnpaidReservations($lockedSession);

            // Check if there are enough spots available
            if (!$this->sessionService->hasEnoughSpots($lockedSession, $numberOfPeople)) {
                throw new \Exception('ظرفیت کافی برای این سانس وجود ندارد');
            }

            // Create the reservation with 15 minutes expiration time
            $reservation = Reservation::create([
                'user_id' => $user->id,
                'session_id' => $lockedSession->id,
                'number_of_people' => $numberOfPeople,
                'payment_status' => PaymentStatus::PENDING,
                'expires_at' => Carbon::now()->addMinutes(15),
            ]);

            // Update the session's pending participants count atomically
            $lockedSession->increment('pending_participants', $numberOfPeople);

            return $reservation;
        });
    }

    /**
     * Create a reservation with optional order
     */
    public function createReservationWithOrder(
        User $user,
        Session $session,
        int $numberOfPeople,
        ?array $orderItems = null,
        ?string $orderNotes = null
    ): Reservation {
        return DB::transaction(function () use ($user, $session, $numberOfPeople, $orderItems, $orderNotes) {
            // Create the reservation first
            $reservation = $this->createReservation($user, $session, $numberOfPeople);

            // Create order if items provided
            if (!empty($orderItems)) {
                $this->orderService->createOrder($reservation, $orderItems, $orderNotes);
            }

            // Load relations for response
            $reservation->load(['orders.orderItems.menuItem', 'session.branch']);

            return $reservation;
        });
    }

    /**
     * Calculate total price for a reservation (tickets only)
     */
    public function calculateTotalPrice(Session $session, int $numberOfPeople): float
    {
        return (float) ($session->price * $numberOfPeople);
    }

    /**
     * Calculate total price including orders
     */
    public function calculateTotalPriceWithOrders(Reservation $reservation): float
    {
        return $reservation->getTotalAmount();
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

            // Decrement session participants based on payment status
            $session = Session::lockForUpdate()->findOrFail($reservation->session_id);
            
            if ($reservation->payment_status === PaymentStatus::PAID) {
                // If paid, decrement from current_participants
                $session->decrement('current_participants', $reservation->number_of_people);
            } else {
                // If pending, decrement from pending_participants
                $session->decrement('pending_participants', $reservation->number_of_people);
            }

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

    /**
     * Expire unpaid reservations that have passed their expiration time
     */
    public function expireUnpaidReservations(Session $session): int
    {
        $expiredCount = 0;

        $expiredReservations = Reservation::where('session_id', $session->id)
            ->where('payment_status', PaymentStatus::PENDING)
            ->whereNull('cancelled_at')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->lockForUpdate()
            ->get();

        if ($expiredReservations->isEmpty()) {
            return 0;
        }

        DB::transaction(function () use ($session, $expiredReservations, &$expiredCount) {
            $totalExpiredParticipants = 0;

            foreach ($expiredReservations as $reservation) {
                $reservation->update([
                    'cancelled_at' => now(),
                ]);
                
                // Cancel and soft delete all orders for this reservation
                $reservation->orders()->update(['status' => \App\Enums\OrderStatus::CANCELLED]);
                $reservation->orders()->delete();
                
                $totalExpiredParticipants += $reservation->number_of_people;
                $expiredCount++;
            }

            // Decrement pending_participants for expired reservations
            if ($totalExpiredParticipants > 0) {
                $lockedSession = Session::lockForUpdate()->findOrFail($session->id);
                $lockedSession->decrement('pending_participants', $totalExpiredParticipants);
            }
        });

        return $expiredCount;
    }

    /**
     * Confirm payment and move reservation from pending to paid
     */
    public function confirmPayment(Reservation $reservation): void
    {
        DB::transaction(function () use ($reservation) {
            // Refresh reservation to get latest state
            $reservation->refresh();
            
            // Only process if reservation is paid and not cancelled
            if ($reservation->payment_status === PaymentStatus::PAID && !$reservation->cancelled_at) {
                $session = Session::lockForUpdate()->findOrFail($reservation->session_id);

                // Only move from pending if expires_at is set (meaning it was pending)
                if ($reservation->expires_at !== null) {
                    // Decrement from pending_participants
                    $session->decrement('pending_participants', $reservation->number_of_people);
                    
                    // Increment current_participants
                    $session->increment('current_participants', $reservation->number_of_people);

                    // Clear expiration time and auto-validate paid reservation
                    $reservation->update([
                        'expires_at' => null,
                        'validated_at' => now(),
                        'validated_by' => null, // System auto-validation for paid reservations
                    ]);
                } elseif (!$reservation->validated_at) {
                    // If reservation was already paid (no expires_at) but not validated, auto-validate it
                    $reservation->update([
                        'validated_at' => now(),
                        'validated_by' => null, // System auto-validation for paid reservations
                    ]);
                }
            }
        });
    }
}

