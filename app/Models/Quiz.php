<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'badge',
        'questions',
    ];

    protected $casts = [
        'questions' => 'array',
    ];

    /**
     * Get all feed items for this quiz.
     */
    public function feedItems(): MorphMany
    {
        return $this->morphMany(FeedItem::class, 'feedable');
    }
}
