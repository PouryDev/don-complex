<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CoinTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'source',
        'description',
        'related_id',
        'related_type',
    ];

    protected $casts = [
        'amount' => 'integer',
        'created_at' => 'datetime',
    ];

    public $timestamps = false;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function related(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope a query to only include earned transactions.
     */
    public function scopeEarned($query)
    {
        return $query->where('type', 'earned');
    }

    /**
     * Scope a query to only include spent transactions.
     */
    public function scopeSpent($query)
    {
        return $query->where('type', 'spent');
    }

    /**
     * Scope a query to filter by source.
     */
    public function scopeBySource($query, string $source)
    {
        return $query->where('source', $source);
    }
}


