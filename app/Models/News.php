<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class News extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'badge',
        'image_url',
    ];

    /**
     * Get all feed items for this news.
     */
    public function feedItems(): MorphMany
    {
        return $this->morphMany(FeedItem::class, 'feedable');
    }
}
