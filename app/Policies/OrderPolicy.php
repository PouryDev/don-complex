<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use App\Enums\UserRole;

class OrderPolicy
{
    /**
     * Determine if the user can view the order
     */
    public function view(User $user, Order $order): bool
    {
        // User can view their own orders
        if ($order->reservation->user_id === $user->id) {
            return true;
        }

        // Game masters can view orders for their branch
        if ($user->role === UserRole::GAME_MASTER && $user->branch_id) {
            return $order->reservation->session->branch_id === $user->branch_id;
        }

        // Admins can view all orders
        return $user->role === UserRole::ADMIN;
    }

    /**
     * Determine if the user can update the order
     */
    public function update(User $user, Order $order): bool
    {
        // Only the order owner can update
        if ($order->reservation->user_id !== $user->id) {
            return false;
        }

        // Check if order can be modified (session not started, payment not completed)
        return $order->canBeModified();
    }

    /**
     * Determine if the user can delete the order
     */
    public function delete(User $user, Order $order): bool
    {
        // Only the order owner can delete
        if ($order->reservation->user_id !== $user->id) {
            return false;
        }

        // Check if order can be modified (session not started, payment not completed)
        return $order->canBeModified();
    }

    /**
     * Determine if game masters can update order status
     */
    public function updateStatus(User $user, Order $order): bool
    {
        // Only game masters and admins can update order status
        if ($user->role === UserRole::ADMIN) {
            return true;
        }

        if ($user->role === UserRole::GAME_MASTER && $user->branch_id) {
            return $order->reservation->session->branch_id === $user->branch_id;
        }

        return false;
    }
}

