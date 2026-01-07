<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Clear categories cache when category is saved or deleted
        static::saved(function ($category) {
            static::clearCategoriesCache($category->branch_id);
        });

        static::deleted(function ($category) {
            static::clearCategoriesCache($category->branch_id);
        });
    }

    /**
     * Clear categories cache for a branch
     */
    protected static function clearCategoriesCache(?int $branchId): void
    {
        // Clear cache for this branch and all categories
        for ($i = 10; $i <= 50; $i += 5) {
            Cache::forget("categories_index_" . ($branchId ?? 'all') . "_per_page_{$i}");
            Cache::forget("categories_index_all_per_page_{$i}");
        }
    }
}
