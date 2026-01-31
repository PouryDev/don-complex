<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSessionRequest;
use App\Http\Resources\SessionResource;
use App\Models\Branch;
use App\Models\Session;
use App\Services\SessionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class SessionController extends Controller
{
    protected SessionService $sessionService;

    public function __construct(SessionService $sessionService)
    {
        $this->sessionService = $sessionService;
    }

    public function index(Request $request)
    {
        $query = Session::query()->with(['branch', 'hall', 'sessionTemplate']);

        // Apply filters
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('hall_id')) {
            $query->where('hall_id', $request->hall_id);
        }

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Supervisor can only see sessions in their branch
        if ($request->user()->isSupervisor()) {
            $query->where('branch_id', $request->user()->branch->id);
        }
        // Game master can only see sessions in their branch
        elseif ($request->user()->isGameMaster()) {
            $query->where('branch_id', $request->user()->branch->id);
        }

        $perPage = $request->get('per_page', 15);
        $sessions = $this->sessionService->getPaginatedSessionsWithAvailability(
            $query->orderBy('date')->orderBy('start_time'),
            $perPage
        );

        return SessionResource::collection($sessions);
    }

    public function show(Session $session): SessionResource
    {
        // Only load relationships if not already loaded
        if (!$session->relationLoaded('branch')) {
            $session->load('branch');
        }
        if (!$session->relationLoaded('hall')) {
            $session->load('hall');
        }
        if (!$session->relationLoaded('sessionTemplate')) {
            $session->load('sessionTemplate');
        }

        return new SessionResource($session);
    }

    public function store(StoreSessionRequest $request): SessionResource
    {
        $this->authorize('create', Session::class);

        $validated = $request->validated();

        // If supervisor, ensure they're creating session in their branch
        if ($request->user()->isSupervisor()) {
            $validated['branch_id'] = $request->user()->branch->id;
        }
        // If game master, ensure they're creating session in their branch
        elseif ($request->user()->isGameMaster()) {
            $validated['branch_id'] = $request->user()->branch->id;
        }

        $session = Session::create($validated);
        $session->load(['branch', 'hall', 'sessionTemplate']);

        // Clear session availability cache
        Cache::forget("session_available_spots_{$session->id}_" . $session->updated_at->timestamp);

        return new SessionResource($session);
    }

    public function update(Request $request, Session $session): SessionResource
    {
        $this->authorize('update', $session);

        $validated = $request->validate([
            'date' => ['sometimes', 'date', 'after_or_equal:today'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'max_participants' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:upcoming,ongoing,completed,cancelled'],
        ]);

        $oldTimestamp = $session->updated_at->timestamp;
        $session->update($validated);
        $session->load(['branch', 'hall', 'sessionTemplate']);

        // Clear session availability cache
        Cache::forget("session_available_spots_{$session->id}_{$oldTimestamp}");

        return new SessionResource($session);
    }

    public function branchSessions(Request $request, Branch $branch)
    {
        $this->authorize('view', $branch);

        $query = $branch->sessions()->with(['branch', 'hall', 'sessionTemplate']);

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        $perPage = $request->get('per_page', 15);
        $sessions = $this->sessionService->getPaginatedSessionsWithAvailability(
            $query->orderBy('date')->orderBy('start_time'),
            $perPage
        );

        return SessionResource::collection($sessions);
    }
}

