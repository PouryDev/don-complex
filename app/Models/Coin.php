<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Coin extends Model
{
    protected $fillable = [
        'user_id',
        'balance',
    ];

    protected $casts = [
        'balance' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Increment user's coin balance
     */
    public function incrementBalance(int $amount): void
    {
        $this->increment('balance', $amount);
    }

    /**
     * Decrement user's coin balance
     */
    public function decrementBalance(int $amount): void
    {
        $this->decrement('balance', $amount);
    }
}


