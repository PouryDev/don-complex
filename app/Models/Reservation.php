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
     * Get minimum cafe order amount required
     * Formula: (session.price - 10000) * number_of_people
     */
    public function getMinimumCafeOrderAmount(): float
    {
        if (!$this->relationLoaded('session')) {
            $this->load('session');
        }
        
        $sessionPricePerPerson = (float) $this->session->price;
        $discountPerPerson = 10000; // 10,000 tomans discount per person
        $minimumPerPerson = max(0, $sessionPricePerPerson - $discountPerPerson);
        
        return (float) ($minimumPerPerson * $this->number_of_people);
    }

    /**
     * Get total amount of cafe orders
     */
    public function getCafeOrderTotal(): float
    {
        return (float) $this->orders()
            ->whereNull('deleted_at')
            ->where('status', '!=', \App\Enums\OrderStatus::CANCELLED)
            ->get()
            ->sum('total_amount');
    }

    /**
     * Get cafe order payable amount (max of actual orders or minimum required)
     */
    public function getCafeOrderPayable(): float
    {
        $cafeOrderTotal = $this->getCafeOrderTotal();
        $minimumCafeOrder = $this->getMinimumCafeOrderAmount();
        
        return (float) max($cafeOrderTotal, $minimumCafeOrder);
    }

    /**
     * Get ticket price (session price * number of people)
     */
    public function getTicketPrice(): float
    {
        if (!$this->relationLoaded('session')) {
            $this->load('session');
        }
        
        return (float) ($this->session->price * $this->number_of_people);
    }

    /**
     * Get total amount including reservation price and cafe orders
     * New pricing logic:
     * - Ticket price: session.price * number_of_people
     * - Minimum cafe order: (session.price - 10000) * number_of_people
     * - Cafe order payable: max(actual cafe orders, minimum cafe order)
     * - Total: ticket price + cafe order payable
     */
    public function getTotalAmount(): float
    {
        $ticketPrice = $this->getTicketPrice();
        $cafeOrderPayable = $this->getCafeOrderPayable();
        
        return (float) ($ticketPrice + $cafeOrderPayable);
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
