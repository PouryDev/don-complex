<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SessionTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'hall_id',
        'day_of_week',
        'start_time',
        'price',
        'max_participants',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function hall(): BelongsTo
    {
        return $this->belongsTo(Hall::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }
}
