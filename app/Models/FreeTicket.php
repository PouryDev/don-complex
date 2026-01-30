<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class FreeTicket extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'coins_spent',
        'purchased_at',
        'used_at',
        'expires_at',
    ];

    protected $casts = [
        'coins_spent' => 'integer',
        'purchased_at' => 'datetime',
        'used_at' => 'datetime',
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

    /**
     * Check if ticket is valid (not used and not expired)
     */
    public function isValid(): bool
    {
        if ($this->used_at !== null) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Check if ticket is used
     */
    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    /**
     * Use ticket for a session
     */
    public function use(int $sessionId): void
    {
        if (!$this->isValid()) {
            throw new \Exception('Ticket is not valid');
        }

        $this->update([
            'session_id' => $sessionId,
            'used_at' => Carbon::now(),
        ]);
    }
}


