<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'category_id',
        'name',
        'description',
        'ingredients',
        'price',
        'is_available',
        'order',
        'image',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'price' => 'decimal:2',
        'order' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Clear menu items cache when menu item is saved or deleted
        static::saved(function ($menuItem) {
            static::clearMenuItemsCache($menuItem->branch_id);
        });

        static::deleted(function ($menuItem) {
            static::clearMenuItemsCache($menuItem->branch_id);
        });
    }

    /**
     * Clear menu items cache for a branch
     */
    protected static function clearMenuItemsCache(?int $branchId): void
    {
        // Clear cache for this branch and all menu items
        for ($i = 10; $i <= 50; $i += 5) {
            Cache::forget("menu_items_index_" . ($branchId ?? 'all') . "_per_page_{$i}");
            Cache::forget("menu_items_index_all_per_page_{$i}");
        }
    }
}
