<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBranchRequest;
use App\Http\Resources\BranchResource;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
        // Only filter by branch for management, not for booking
        // If for_booking parameter is not set or false, apply branch filter
        if (!$request->has('for_booking') || !$request->boolean('for_booking')) {
            // Supervisor can only see their own branch (for management)
            if ($user->isSupervisor()) {
                $branch = Branch::with('gameMasters')->find($user->branch_id);
                if (!$branch) {
                    return BranchResource::collection(collect());
                }
                return BranchResource::collection(collect([$branch]));
            }
            
            // Game master can only see their own branch - no caching needed for single branch
            if ($user->isGameMaster()) {
                $branch = Branch::with('gameMasters')->find($user->branch_id);
                if (!$branch) {
                    return BranchResource::collection(collect());
                }
                return BranchResource::collection(collect([$branch]));
            }
        }

        // Cache branches list for admins (5 minutes)
        $cacheKey = "branches_index_per_page_{$perPage}";
        $branches = Cache::remember($cacheKey, 300, function () use ($perPage) {
            return Branch::with('gameMasters')->paginate($perPage);
        });

        return BranchResource::collection($branches);
    }

    public function show(Request $request, Branch $branch): BranchResource
    {
        $this->authorize('view', $branch);

        // Only load if not already loaded
        if (!$branch->relationLoaded('gameMasters')) {
            $branch->load('gameMasters');
        }

        return new BranchResource($branch);
    }

    public function store(Request $request): BranchResource
    {
        $this->authorize('create', Branch::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $branch = Branch::create($validated);
        $branch->load('gameMasters');

        // Clear branches cache
        $this->clearBranchesCache();

        return new BranchResource($branch);
    }

    public function update(UpdateBranchRequest $request, Branch $branch): BranchResource
    {
        $this->authorize('update', $branch);

        $branch->update($request->validated());
        $branch->load('gameMasters');

        // Clear branches cache
        $this->clearBranchesCache();

        return new BranchResource($branch);
    }

    public function destroy(Branch $branch)
    {
        $this->authorize('delete', $branch);

        $branch->delete();

        // Clear branches cache
        $this->clearBranchesCache();

        return response()->json(['message' => 'Branch deleted successfully']);
    }

    /**
     * Clear branches cache
     */
    protected function clearBranchesCache(): void
    {
        // Clear cache for common per_page values
        for ($i = 10; $i <= 50; $i += 5) {
            Cache::forget("branches_index_per_page_{$i}");
        }
    }
}

