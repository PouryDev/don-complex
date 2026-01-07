<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class MenuItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $branchId = $request->get('branch_id');
        $perPage = $request->get('per_page', 15);
        
        // Create cache key based on filters
        $cacheKey = "menu_items_index_" . ($branchId ?? 'all') . "_per_page_{$perPage}";
        
        $menuItems = Cache::remember($cacheKey, 600, function () use ($branchId, $perPage) {
            $query = MenuItem::with('category')
                ->where('is_available', true);

            // Filter by branch_id if provided
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            return $query->orderBy('order')
                ->orderBy('name')
                ->paginate($perPage);
        });

        return response()->json($menuItems);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'ingredients' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_available' => ['nullable', 'boolean'],
            'order' => ['nullable', 'integer', 'min:0'],
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        // Verify that category belongs to the same branch
        $category = \App\Models\Category::findOrFail($validated['category_id']);
        if ($category->branch_id != $validated['branch_id']) {
            return response()->json(['message' => 'Category does not belong to the specified branch'], 422);
        }

        $data = [
            'branch_id' => $validated['branch_id'],
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'ingredients' => $validated['ingredients'] ?? null,
            'price' => $validated['price'],
            'is_available' => $validated['is_available'] ?? true,
            'order' => $validated['order'] ?? 0,
        ];

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('menu-items', 'public');
        }

        $menuItem = MenuItem::create($data);
        $menuItem->load('category');

        // Clear cache for this branch and all menu items
        $this->clearMenuItemsCache($validated['branch_id']);

        return response()->json($menuItem, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MenuItem $menuItem): JsonResponse
    {
        $menuItem->load('category');
        return response()->json($menuItem);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['sometimes', 'required', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'ingredients' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_available' => ['nullable', 'boolean'],
            'order' => ['nullable', 'integer', 'min:0'],
            'image' => ['nullable', 'image', 'max:2048'],
            'delete_image' => ['nullable', 'boolean'],
        ]);

        $data = array_filter([
            'category_id' => $validated['category_id'] ?? null,
            'name' => $validated['name'] ?? null,
            'description' => $validated['description'] ?? null,
            'ingredients' => $validated['ingredients'] ?? null,
            'price' => $validated['price'] ?? null,
            'is_available' => $validated['is_available'] ?? null,
            'order' => $validated['order'] ?? null,
        ], fn($value) => $value !== null);

        // Handle image deletion
        if ($request->has('delete_image') && $request->boolean('delete_image')) {
            if ($menuItem->image) {
                Storage::disk('public')->delete($menuItem->image);
                $data['image'] = null;
            }
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($menuItem->image) {
                Storage::disk('public')->delete($menuItem->image);
            }
            $data['image'] = $request->file('image')->store('menu-items', 'public');
        }

        $menuItem->update($data);
        $menuItem->load('category');

        // Clear cache for this branch
        $this->clearMenuItemsCache($menuItem->branch_id);

        return response()->json($menuItem);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MenuItem $menuItem): JsonResponse
    {
        // Delete image if exists
        if ($menuItem->image) {
            Storage::disk('public')->delete($menuItem->image);
        }

        $branchId = $menuItem->branch_id;
        $menuItem->delete();

        // Clear cache for this branch
        $this->clearMenuItemsCache($branchId);

        return response()->json(['message' => 'Menu item deleted successfully']);
    }

    /**
     * Clear menu items cache for a branch
     */
    protected function clearMenuItemsCache(?int $branchId): void
    {
        Cache::forget("menu_items_index_" . ($branchId ?? 'all') . "_per_page_15");
        Cache::forget("menu_items_index_all_per_page_15");
        // Clear cache for all possible per_page values (common ones)
        for ($i = 10; $i <= 50; $i += 5) {
            Cache::forget("menu_items_index_" . ($branchId ?? 'all') . "_per_page_{$i}");
            Cache::forget("menu_items_index_all_per_page_{$i}");
        }
    }
}
