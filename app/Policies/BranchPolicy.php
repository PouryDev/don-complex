<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;
use App\Enums\UserRole;

class BranchPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isGameMaster();
    }

    public function view(User $user, Branch $branch): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Game master can only view their own branch
        return $user->isGameMaster() && $user->branch?->id === $branch->id;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Branch $branch): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Game master can only update their own branch
        return $user->isGameMaster() && $user->branch?->id === $branch->id;
    }

    public function delete(User $user, Branch $branch): bool
    {
        return $user->isAdmin();
    }
}
