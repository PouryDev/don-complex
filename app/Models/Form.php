<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Form extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'badge',
        'fields',
    ];

    protected $casts = [
        'fields' => 'array',
    ];

    /**
     * Get all feed items for this form.
     */
    public function feedItems(): MorphMany
    {
        return $this->morphMany(FeedItem::class, 'feedable');
    }
}
