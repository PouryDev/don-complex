<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Create a new order for a reservation
     */
    public function createOrder(Reservation $reservation, array $items, ?string $notes = null): Order
    {
        return DB::transaction(function () use ($reservation, $items, $notes) {
            // Validate that items belong to the session's branch
            $this->validateOrderItems($items, $reservation->session->branch);

            // Calculate total
            $totalAmount = $this->calculateOrderTotal($items);

            // Create order
            $order = Order::create([
                'reservation_id' => $reservation->id,
                'total_amount' => $totalAmount,
                'status' => OrderStatus::PENDING,
                'notes' => $notes,
            ]);

            // Create order items with snapshot prices
            foreach ($items as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $item['quantity'],
                    'price' => $menuItem->price, // Snapshot price
                ]);
            }

            return $order->load('orderItems.menuItem');
        });
    }

    /**
     * Update an existing order
     */
    public function updateOrder(Order $order, array $items, ?string $notes = null): Order
    {
        return DB::transaction(function () use ($order, $items, $notes) {
            // Check if order can be modified
            if (!$order->canBeModified()) {
                throw ValidationException::withMessages([
                    'order' => ['این سفارش قابل ویرایش نیست. سانس شروع شده یا پرداخت انجام شده است.']
                ]);
            }

            // Validate that items belong to the session's branch
            $this->validateOrderItems($items, $order->reservation->session->branch);

            // Delete existing order items
            $order->orderItems()->delete();

            // Calculate new total
            $totalAmount = $this->calculateOrderTotal($items);

            // Update order
            $order->update([
                'total_amount' => $totalAmount,
                'notes' => $notes,
            ]);

            // Create new order items with snapshot prices
            foreach ($items as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $item['quantity'],
                    'price' => $menuItem->price, // Snapshot price
                ]);
            }

            return $order->load('orderItems.menuItem');
        });
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(Order $order): void
    {
        // Check if order can be modified
        if (!$order->canBeModified()) {
            throw ValidationException::withMessages([
                'order' => ['این سفارش قابل لغو نیست. سانس شروع شده یا پرداخت انجام شده است.']
            ]);
        }

        DB::transaction(function () use ($order) {
            $order->update(['status' => OrderStatus::CANCELLED]);
            $order->delete(); // Soft delete
        });
    }

    /**
     * Calculate total amount for order items
     */
    public function calculateOrderTotal(array $items): float
    {
        $total = 0;

        foreach ($items as $item) {
            $menuItem = MenuItem::findOrFail($item['menu_item_id']);
            $total += $menuItem->price * $item['quantity'];
        }

        return (float) $total;
    }

    /**
     * Validate that order items belong to the specified branch
     */
    public function validateOrderItems(array $items, Branch $branch): void
    {
        $menuItemIds = collect($items)->pluck('menu_item_id')->unique()->toArray();
        
        // Get all menu items for these IDs
        $menuItems = MenuItem::whereIn('id', $menuItemIds)
            ->where('is_available', true)
            ->get();

        // Check if all items exist
        if ($menuItems->count() !== count($menuItemIds)) {
            throw ValidationException::withMessages([
                'items' => ['یک یا چند مورد از آیتم‌های منو یافت نشد یا در دسترس نیست.']
            ]);
        }

        // Check if all items belong to the branch
        $invalidItems = $menuItems->filter(function ($menuItem) use ($branch) {
            return $menuItem->branch_id !== $branch->id;
        });

        if ($invalidItems->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items' => ['همه آیتم‌های سفارش باید از منوی شعبه مربوط به سانس باشند.']
            ]);
        }

        // Validate quantities
        foreach ($items as $item) {
            if (!isset($item['quantity']) || $item['quantity'] < 1) {
                throw ValidationException::withMessages([
                    'items' => ['تعداد هر آیتم باید حداقل 1 باشد.']
                ]);
            }
        }
    }
}

