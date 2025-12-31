<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBranchRequest;
use App\Http\Resources\BranchResource;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::query();

        // Game master can only see their own branch
        if ($request->user()->isGameMaster()) {
            $query->where('game_master_id', $request->user()->id);
        }

        $perPage = $request->get('per_page', 15);
        $branches = $query->with('gameMaster')->paginate($perPage);

        return BranchResource::collection($branches);
    }

    public function show(Request $request, Branch $branch): BranchResource
    {
        $this->authorize('view', $branch);

        $branch->load('gameMaster');

        return new BranchResource($branch);
    }

    public function store(Request $request): BranchResource
    {
        $this->authorize('create', Branch::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'game_master_id' => ['nullable', 'exists:users,id'],
        ]);

        $branch = Branch::create($validated);
        $branch->load('gameMaster');

        return new BranchResource($branch);
    }

    public function update(UpdateBranchRequest $request, Branch $branch): BranchResource
    {
        $this->authorize('update', $branch);

        $branch->update($request->validated());
        $branch->load('gameMaster');

        return new BranchResource($branch);
    }

    public function destroy(Branch $branch)
    {
        $this->authorize('delete', $branch);

        $branch->delete();

        return response()->json(['message' => 'Branch deleted successfully']);
    }
}

