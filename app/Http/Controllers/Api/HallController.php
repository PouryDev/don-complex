<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\HallResource;
use App\Models\Branch;
use App\Models\Hall;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HallController extends Controller
{
    public function index(Request $request, Branch $branch): AnonymousResourceCollection
    {
        $this->authorize('view', $branch);

        $halls = $branch->halls;

        return HallResource::collection($halls);
    }

    public function store(Request $request, Branch $branch): HallResource
    {
        $this->authorize('update', $branch);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ]);

        $hall = $branch->halls()->create($validated);

        return new HallResource($hall);
    }

    public function update(Request $request, Hall $hall): HallResource
    {
        $this->authorize('update', $hall->branch);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ]);

        $hall->update($validated);

        return new HallResource($hall);
    }

    public function destroy(Hall $hall)
    {
        $this->authorize('update', $hall->branch);

        $hall->delete();

        return response()->json(['message' => 'Hall deleted successfully']);
    }
}

