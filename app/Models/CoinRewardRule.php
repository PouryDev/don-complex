<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CoinRewardRule extends Model
{
    protected $fillable = [
        'rewardable_type',
        'rewardable_id',
        'coins',
        'is_active',
    ];

    protected $casts = [
        'coins' => 'integer',
        'is_active' => 'boolean',
    ];

    public function rewardable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get coins for a specific rewardable model
     */
    public static function getCoinsFor($rewardable): ?int
    {
        // For reservations, check for generic rule (rewardable_id = 0)
        if (get_class($rewardable) === 'App\Models\Reservation') {
            $rule = self::where('rewardable_type', 'App\Models\Reservation')
                ->where('rewardable_id', 0)
                ->where('is_active', true)
                ->first();
        } else {
            $rule = self::where('rewardable_type', get_class($rewardable))
                ->where('rewardable_id', $rewardable->id)
                ->where('is_active', true)
                ->first();
        }

        return $rule ? $rule->coins : null;
    }
}

