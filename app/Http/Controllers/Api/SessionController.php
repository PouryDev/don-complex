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
use Carbon\Carbon;

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

        // Only filter by branch for management, not for booking
        // If for_booking parameter is not set or false, apply branch filter for supervisors/game masters
        if (!$request->has('for_booking') || !$request->boolean('for_booking')) {
            // Supervisor can only see sessions in their branch (for management)
            if ($request->user()->isSupervisor()) {
                $query->where('branch_id', $request->user()->branch->id);
            }
            // Game master can only see sessions in their branch
            elseif ($request->user()->isGameMaster()) {
                $query->where('branch_id', $request->user()->branch->id);
            }
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

    /**
     * Get available sessions for menu ordering (within ±5 hours)
     */
    public function getAvailableSessionsForMenuOrdering(Request $request): AnonymousResourceCollection
    {
        $branchId = $request->get('branch_id');
        
        if (!$branchId) {
            return SessionResource::collection(collect());
        }

        $now = Carbon::now();
        $fiveHoursBefore = $now->copy()->subHours(5);
        $fiveHoursAfter = $now->copy()->addHours(5);

        $query = Session::query()
            ->with(['branch', 'hall', 'sessionTemplate'])
            ->where('branch_id', $branchId)
            ->whereIn('status', ['upcoming', 'ongoing'])
            ->where(function ($q) use ($fiveHoursBefore, $fiveHoursAfter) {
                // Check if session datetime is within ±5 hours
                $q->where(function ($subQ) use ($fiveHoursBefore, $fiveHoursAfter) {
                    // For same day sessions, check time range
                    $subQ->where('date', $fiveHoursBefore->format('Y-m-d'))
                        ->where('start_time', '>=', $fiveHoursBefore->format('H:i:s'))
                        ->where('start_time', '<=', $fiveHoursAfter->format('H:i:s'));
                })
                ->orWhere(function ($subQ) use ($fiveHoursBefore, $fiveHoursAfter) {
                    // For sessions between the date range
                    $subQ->where('date', '>', $fiveHoursBefore->format('Y-m-d'))
                        ->where('date', '<', $fiveHoursAfter->format('Y-m-d'));
                })
                ->orWhere(function ($subQ) use ($fiveHoursBefore, $fiveHoursAfter) {
                    // For end date, check time
                    $subQ->where('date', $fiveHoursAfter->format('Y-m-d'))
                        ->where('start_time', '<=', $fiveHoursAfter->format('H:i:s'));
                });
            })
            ->orderBy('date')
            ->orderBy('start_time');

        $sessions = $this->sessionService->getPaginatedSessionsWithAvailability(
            $query,
            100 // Get more sessions for selection
        );

        // Filter by actual datetime (combining date and time)
        $filteredSessions = $sessions->getCollection()->filter(function ($session) use ($fiveHoursBefore, $fiveHoursAfter) {
            $sessionDateTime = Carbon::parse($session->date->format('Y-m-d') . ' ' . $session->start_time);
            return $sessionDateTime->between($fiveHoursBefore, $fiveHoursAfter);
        });

        // Create new paginator with filtered results
        $sessions->setCollection($filteredSessions);

        return SessionResource::collection($sessions);
    }
}

