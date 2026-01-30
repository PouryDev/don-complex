<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'number_of_people',
        'payment_status',
        'payment_transaction_id',
        'validated_at',
        'validated_by',
        'cancelled_at',
        'expires_at',
    ];

    protected $casts = [
        'payment_status' => PaymentStatus::class,
        'validated_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function paymentTransaction(): BelongsTo
    {
        return $this->belongsTo(PaymentTransaction::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get total amount including reservation price and orders
     */
    public function getTotalAmount(): float
    {
        // Calculate reservation price (session price * number of people)
        $sessionPrice = $this->session->price * $this->number_of_people;
        
        // Calculate orders total
        $ordersTotal = $this->orders()
            ->whereNull('deleted_at')
            ->where('status', '!=', \App\Enums\OrderStatus::CANCELLED)
            ->get()
            ->sum('total_amount');
        
        return (float) ($sessionPrice + $ordersTotal);
    }

    /**
     * Scope a query to only include non-expired reservations.
     */
    public function scopeNotExpired(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    /**
     * Check if the reservation is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
