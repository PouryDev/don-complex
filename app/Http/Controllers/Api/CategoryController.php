<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $branchId = $request->get('branch_id');
        $perPage = $request->get('per_page', 15);
        
        // Create cache key based on filters
        $cacheKey = "categories_index_" . ($branchId ?? 'all') . "_per_page_{$perPage}";
        
        $categories = Cache::remember($cacheKey, 600, function () use ($branchId, $perPage) {
            $query = Category::where('is_active', true);

            // Filter by branch_id if provided
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            return $query->orderBy('order')
                ->orderBy('name')
                ->paginate($perPage);
        });

        return response()->json($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = Category::create([
            'branch_id' => $validated['branch_id'],
            'name' => $validated['name'],
            'order' => $validated['order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Clear cache for this branch and all categories
        Cache::forget("categories_index_{$validated['branch_id']}_per_page_15");
        Cache::forget("categories_index_all_per_page_15");
        Cache::forget("categories_index_{$validated['branch_id']}_per_page_" . $request->get('per_page', 15));
        Cache::forget("categories_index_all_per_page_" . $request->get('per_page', 15));

        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $branchId = $category->branch_id;
        $category->update($validated);

        // Clear cache for this branch and all categories
        Cache::forget("categories_index_{$branchId}_per_page_15");
        Cache::forget("categories_index_all_per_page_15");
        // Clear cache for all possible per_page values (common ones)
        for ($i = 10; $i <= 50; $i += 5) {
            Cache::forget("categories_index_{$branchId}_per_page_{$i}");
            Cache::forget("categories_index_all_per_page_{$i}");
        }

        return response()->json($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): JsonResponse
    {
        $branchId = $category->branch_id;
        $category->delete();

        // Clear cache for this branch and all categories
        Cache::forget("categories_index_{$branchId}_per_page_15");
        Cache::forget("categories_index_all_per_page_15");
        // Clear cache for all possible per_page values (common ones)
        for ($i = 10; $i <= 50; $i += 5) {
            Cache::forget("categories_index_{$branchId}_per_page_{$i}");
            Cache::forget("categories_index_all_per_page_{$i}");
        }

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
