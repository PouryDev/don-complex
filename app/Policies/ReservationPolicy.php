<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\User;

class ReservationPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // Users can view their own, game masters/admins can view all
    }

    public function view(User $user, Reservation $reservation): bool
    {
        // Users can view their own reservations
        if ($reservation->user_id === $user->id) {
            return true;
        }

        // Supervisor has full control over reservations in their branch
        if ($user->isSupervisor() && $user->branch?->id === $reservation->session->branch_id) {
            return true;
        }

        // Game master can view reservations for sessions in their branch
        if ($user->isGameMaster() && $user->branch?->id === $reservation->session->branch_id) {
            return true;
        }

        // Admin can view all
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        // All authenticated users can create reservations
        return true;
    }

    public function update(User $user, Reservation $reservation): bool
    {
        // Only the owner can update their reservation
        return $reservation->user_id === $user->id;
    }

    public function delete(User $user, Reservation $reservation): bool
    {
        // Users can cancel their own reservations
        if ($reservation->user_id === $user->id) {
            return true;
        }

        // Supervisor has full control over reservations in their branch
        if ($user->isSupervisor() && $user->branch?->id === $reservation->session->branch_id) {
            return true;
        }

        // Admin can cancel any reservation
        return $user->isAdmin();
    }
}
