<?php

namespace App\Policies;

use App\Models\Session;
use App\Models\User;

class SessionPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // Anyone can view sessions
    }

    public function view(User $user, Session $session): bool
    {
        return true; // Anyone can view a session
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isGameMaster();
    }

    public function update(User $user, Session $session): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Game master can only update sessions in their branch
        return $user->isGameMaster() && $user->branch?->id === $session->branch_id;
    }

    public function delete(User $user, Session $session): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Game master can only delete sessions in their branch
        return $user->isGameMaster() && $user->branch?->id === $session->branch_id;
    }
}
