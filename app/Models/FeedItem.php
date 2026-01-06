<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphTo;

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
}
