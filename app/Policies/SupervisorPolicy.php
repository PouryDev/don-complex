<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\Session;
use App\Models\User;

class SupervisorPolicy
{
    /**
     * Check if supervisor can view sessions in their branch
     */
    public function viewSessions(User $user): bool
    {
        return $user->isSupervisor() && $user->branch !== null;
    }

    /**
     * Check if supervisor can view a specific session
     */
    public function viewSession(User $user, Session $session): bool
    {
        return $user->isSupervisor() && 
               $user->branch !== null && 
               $user->branch->id === $session->branch_id;
    }

    /**
     * Check if supervisor can view reservations in their branch
     */
    public function viewReservations(User $user): bool
    {
        return $user->isSupervisor() && $user->branch !== null;
    }

    /**
     * Check if supervisor can view a specific reservation
     */
    public function viewReservation(User $user, Reservation $reservation): bool
    {
        return $user->isSupervisor() && 
               $user->branch !== null && 
               $user->branch->id === $reservation->session->branch_id;
    }

    /**
     * Check if supervisor can validate a reservation
     */
    public function validateReservation(User $user, Reservation $reservation): bool
    {
        return $user->isSupervisor() && 
               $user->branch !== null && 
               $user->branch->id === $reservation->session->branch_id;
    }

    /**
     * Check if supervisor can register game result for a reservation
     */
    public function registerGameResult(User $user, Reservation $reservation): bool
    {
        return $user->isSupervisor() && 
               $user->branch !== null && 
               $user->branch->id === $reservation->session->branch_id;
    }

    /**
     * Check if supervisor can select best player for a session
     */
    public function selectBestPlayer(User $user, Session $session): bool
    {
        return $user->isSupervisor() && 
               $user->branch !== null && 
               $user->branch->id === $session->branch_id;
    }
}


