<?php

namespace App\Models;

use App\Enums\SessionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Session extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'hall_id',
        'session_template_id',
        'date',
        'start_time',
        'price',
        'max_participants',
        'current_participants',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'price' => 'decimal:2',
        'status' => SessionStatus::class,
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function hall(): BelongsTo
    {
        return $this->belongsTo(Hall::class);
    }

    public function sessionTemplate(): BelongsTo
    {
        return $this->belongsTo(SessionTemplate::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }
}
