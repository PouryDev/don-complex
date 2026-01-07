<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Cache;

class FeedItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'feedable_type',
        'feedable_id',
        'scheduled_at',
        'is_active',
        'order',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Get the parent feedable model (news, form, or quiz).
     */
    public function feedable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Clear feed cache when feed item is saved or deleted
        static::saved(function ($feedItem) {
            static::clearFeedCache();
        });

        static::deleted(function ($feedItem) {
            static::clearFeedCache();
        });
    }

    /**
     * Clear all feed-related cache
     */
    protected static function clearFeedCache(): void
    {
        // Clear feed index cache for common per_page values
        for ($i = 10; $i <= 50; $i += 5) {
            Cache::forget("feed_index_per_page_{$i}");
        }
        
        // Note: Individual feed item cache (feed_show_{type}_{id}) will expire naturally
        // or can be cleared specifically if needed
    }
}
