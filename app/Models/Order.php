<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reservation_id',
        'total_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'status' => OrderStatus::class,
    ];

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function menuItems(): BelongsToMany
    {
        return $this->belongsToMany(MenuItem::class, 'order_items')
            ->withPivot('quantity', 'price')
            ->withTimestamps();
    }

    /**
     * Scope a query to only include pending orders
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', OrderStatus::PENDING);
    }

    /**
     * Scope a query to only include orders for a specific reservation
     */
    public function scopeForReservation(Builder $query, int $reservationId): Builder
    {
        return $query->where('reservation_id', $reservationId);
    }

    /**
     * Calculate total amount from order items
     */
    public function calculateTotal(): float
    {
        return (float) $this->orderItems()
            ->selectRaw('SUM(quantity * price) as total')
            ->value('total') ?? 0;
    }

    /**
     * Check if order can be modified
     */
    public function canBeModified(): bool
    {
        // Load reservation and session if not already loaded
        if (!$this->relationLoaded('reservation')) {
            $this->load('reservation.session');
        } elseif (!$this->reservation->relationLoaded('session')) {
            $this->reservation->load('session');
        }

        $session = $this->reservation->session;
        
        // Combine date and start_time to create a datetime
        $sessionDateTime = Carbon::parse($session->date->format('Y-m-d') . ' ' . $session->start_time);
        
        // Order can be modified if:
        // 1. Session hasn't started yet
        // 2. Payment is still pending
        return $sessionDateTime->isFuture() && 
               $this->reservation->payment_status === \App\Enums\PaymentStatus::PENDING;
    }
}

