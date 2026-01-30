<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDiscountCode extends Model
{
    protected $fillable = [
        'user_id',
        'discount_code_id',
        'coins_spent',
        'purchased_at',
        'used_at',
    ];

    protected $casts = [
        'coins_spent' => 'integer',
        'purchased_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function discountCode(): BelongsTo
    {
        return $this->belongsTo(DiscountCode::class);
    }

    /**
     * Check if discount code is used
     */
    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    /**
     * Check if discount code is valid (not used and not expired)
     */
    public function isValid(): bool
    {
        if ($this->isUsed()) {
            return false;
        }

        return $this->discountCode->isValid();
    }
}


