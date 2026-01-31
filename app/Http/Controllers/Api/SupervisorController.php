<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Http\Resources\SessionResource;
use App\Http\Resources\SessionTemplateResource;
use App\Models\Hall;
use App\Models\Reservation;
use App\Models\Session;
use App\Models\SessionTemplate;
use App\Services\ReservationService;
use App\Services\SessionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SupervisorController extends Controller
{
    protected SessionService $sessionService;
    protected ReservationService $reservationService;

    public function __construct(SessionService $sessionService, ReservationService $reservationService)
    {
        $this->sessionService = $sessionService;
        $this->reservationService = $reservationService;
        $this->middleware(function ($request, $next) {
            if (!$request->user()->isSupervisor()) {
                abort(403, 'Only supervisors can access this resource');
            }
            // Ensure branch is loaded for supervisor
            if (!$request->user()->relationLoaded('branch')) {
                $request->user()->load('branch');
            }
            return $next($request);
        });
    }

    /**
     * Get sessions for supervisor's branch
     */
    public function sessions(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            return SessionResource::collection(collect());
        }

        $query = $branch->sessions()->with(['branch', 'hall', 'sessionTemplate', 'gameMaster']);

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('status')) {
            if ($request->status === 'upcoming') {
                // Fix: Filter out past sessions when status is "upcoming"
                $today = Carbon::today();
                $now = Carbon::now();
                $query->where(function($q) use ($today, $now) {
                    $q->where('date', '>', $today)
                      ->orWhere(function($q2) use ($today, $now) {
                          $q2->where('date', $today)
                             ->where('start_time', '>', $now->format('H:i:s'));
                      });
                });
            } else {
                $query->where('status', $request->status);
            }
        }

        $perPage = $request->get('per_page', 15);
        $sessions = $this->sessionService->getPaginatedSessionsWithAvailability(
            $query->orderBy('date')->orderBy('start_time'),
            $perPage
        );

        return SessionResource::collection($sessions);
    }

    /**
     * Get reservations for a session
     */
    public function sessionReservations(Request $request, Session $session): AnonymousResourceCollection
    {
        // Ensure the session belongs to the supervisor's branch
        if ($session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only view reservations for sessions in your branch');
        }

        $perPage = $request->get('per_page', 15);
        $reservations = $session->reservations()
            ->with([
                'session.branch',
                'session.hall',
                'session.sessionTemplate',
                'session.gameMaster',
                'user',
                'paymentTransaction',
                'validator'
            ])
            ->whereNull('cancelled_at')
            ->orderBy('created_at')
            ->paginate($perPage);

        return ReservationResource::collection($reservations);
    }

    /**
     * Get a single reservation
     */
    public function showReservation(Request $request, Reservation $reservation): ReservationResource
    {
        // Ensure reservation belongs to supervisor's branch
        if ($reservation->session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only view reservations for sessions in your branch');
        }

        $reservation->load([
            'session.branch',
            'session.hall',
            'session.sessionTemplate',
            'user',
            'paymentTransaction',
            'validator',
            'orders.orderItems.menuItem.category'
        ]);

        return new ReservationResource($reservation);
    }

    /**
     * Create a new session for supervisor's branch
     */
    public function createSession(Request $request): SessionResource
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            abort(403, 'Supervisor must be assigned to a branch');
        }

        $validated = $request->validate([
            'hall_id' => ['required', 'exists:halls,id'],
            'session_template_id' => ['nullable', 'exists:session_templates,id'],
            'game_master_id' => ['nullable', 'exists:users,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'price' => ['required', 'numeric', 'min:0'],
            'max_participants' => ['required', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:upcoming,ongoing,completed,cancelled'],
        ]);

        // Verify hall belongs to supervisor's branch
        $hall = Hall::findOrFail($validated['hall_id']);
        if ($hall->branch_id !== $branch->id) {
            return response()->json([
                'message' => 'سالن انتخاب شده متعلق به شعبه شما نیست',
            ], 403);
        }

        // Verify game master belongs to supervisor's branch if provided
        if (isset($validated['game_master_id'])) {
            $gameMaster = \App\Models\User::findOrFail($validated['game_master_id']);
            if (!$gameMaster->isGameMaster() || $gameMaster->branch_id !== $branch->id) {
                return response()->json([
                    'message' => 'Game Master انتخاب شده متعلق به شعبه شما نیست',
                ], 403);
            }
        }

        // Set branch_id automatically
        $validated['branch_id'] = $branch->id;

        $session = Session::create($validated);
        $session->load(['branch', 'hall', 'sessionTemplate', 'gameMaster']);

        // Clear session availability cache
        Cache::forget("session_available_spots_{$session->id}_" . $session->updated_at->timestamp);

        return new SessionResource($session);
    }

    /**
     * Update a session
     */
    public function updateSession(Request $request, Session $session): SessionResource
    {
        // Ensure the session belongs to the supervisor's branch
        if ($session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only update sessions in your branch');
        }

        $validated = $request->validate([
            'hall_id' => ['sometimes', 'exists:halls,id'],
            'session_template_id' => ['nullable', 'exists:session_templates,id'],
            'game_master_id' => ['nullable', 'exists:users,id'],
            'date' => ['sometimes', 'date', 'after_or_equal:today'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'max_participants' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:upcoming,ongoing,completed,cancelled'],
        ]);

        // Verify hall belongs to supervisor's branch if provided
        if (isset($validated['hall_id'])) {
            $hall = Hall::findOrFail($validated['hall_id']);
            if ($hall->branch_id !== $request->user()->branch->id) {
                return response()->json([
                    'message' => 'سالن انتخاب شده متعلق به شعبه شما نیست',
                ], 403);
            }
        }

        // Verify game master belongs to supervisor's branch if provided
        if (isset($validated['game_master_id'])) {
            $gameMaster = \App\Models\User::findOrFail($validated['game_master_id']);
            if (!$gameMaster->isGameMaster() || $gameMaster->branch_id !== $request->user()->branch->id) {
                return response()->json([
                    'message' => 'Game Master انتخاب شده متعلق به شعبه شما نیست',
                ], 403);
            }
        }

        $oldTimestamp = $session->updated_at->timestamp;
        $session->update($validated);
        $session->load(['branch', 'hall', 'sessionTemplate', 'gameMaster']);

        // Clear session availability cache
        Cache::forget("session_available_spots_{$session->id}_{$oldTimestamp}");

        return new SessionResource($session);
    }

    /**
     * Cancel a reservation
     */
    public function cancelReservation(Request $request, Reservation $reservation)
    {
        // Ensure the reservation's session belongs to the supervisor's branch
        if ($reservation->session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only cancel reservations for sessions in your branch');
        }

        if ($reservation->cancelled_at) {
            return response()->json([
                'message' => 'این رزرو قبلاً لغو شده است',
            ], 400);
        }

        $this->reservationService->cancelReservation($reservation);

        // Clear session availability cache
        $session = $reservation->session;
        Cache::forget("session_available_spots_{$session->id}_" . $session->updated_at->timestamp);

        // Eager load all nested relationships
        $reservation->load([
            'session.branch',
            'session.hall',
            'session.sessionTemplate',
            'user',
            'paymentTransaction',
            'validator'
        ]);

        return new ReservationResource($reservation);
    }

    /**
     * Report fraud: Cancel reservation without refund and restore capacity
     * This burns the tickets and adds capacity back to the session
     */
    public function reportFraud(Request $request, Reservation $reservation)
    {
        // Ensure the reservation's session belongs to the supervisor's branch
        if ($reservation->session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only report fraud for reservations in your branch');
        }

        if ($reservation->cancelled_at) {
            return response()->json([
                'message' => 'این رزرو قبلاً لغو شده است',
            ], 400);
        }

        try {
            $this->reservationService->reportFraud($reservation, $request->user());

            // Clear session availability cache
            $session = $reservation->session;
            Cache::forget("session_available_spots_{$session->id}_" . $session->updated_at->timestamp);

            // Eager load all nested relationships
            $reservation->load([
                'session.branch',
                'session.hall',
                'session.sessionTemplate',
                'user',
                'paymentTransaction',
                'validator'
            ]);

            return new ReservationResource($reservation);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Register game result for a reservation
     */
    public function registerGameResult(Request $request, Reservation $reservation)
    {
        // Ensure the reservation's session belongs to the supervisor's branch
        if ($reservation->session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only register game results for reservations in your branch');
        }

        $validated = $request->validate([
            'result' => 'required|string|in:win,lose,draw',
            'score' => 'nullable|integer|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Store game result in metadata or create a separate table
        // For now, we'll use a JSON field in reservations table
        $metadata = $reservation->game_result_metadata ?? [];
        $metadata['result'] = $validated['result'];
        $metadata['score'] = $validated['score'] ?? null;
        $metadata['notes'] = $validated['notes'] ?? null;
        $metadata['registered_at'] = now()->toIso8601String();
        $metadata['registered_by'] = $request->user()->id;

        $reservation->update([
            'game_result_metadata' => $metadata,
        ]);

        $reservation->load([
            'session.branch',
            'session.hall',
            'session.sessionTemplate',
            'user',
            'paymentTransaction',
            'validator'
        ]);

        return new ReservationResource($reservation);
    }

    /**
     * Select best player for a session
     */
    public function selectBestPlayer(Request $request, Session $session)
    {
        // Ensure the session belongs to the supervisor's branch
        if ($session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only select best player for sessions in your branch');
        }

        $validated = $request->validate([
            'reservation_id' => 'required|exists:reservations,id',
        ]);

        $reservation = Reservation::findOrFail($validated['reservation_id']);

        // Ensure reservation belongs to this session
        if ($reservation->session_id !== $session->id) {
            return response()->json([
                'message' => 'این رزرو متعلق به این سانس نیست',
            ], 400);
        }

        // Store best player in session metadata or create a separate field
        $metadata = $session->best_player_metadata ?? [];
        $metadata['reservation_id'] = $reservation->id;
        $metadata['user_id'] = $reservation->user_id;
        $metadata['selected_at'] = now()->toIso8601String();
        $metadata['selected_by'] = $request->user()->id;

        $session->update([
            'best_player_metadata' => $metadata,
        ]);

        $session->load(['branch', 'hall', 'sessionTemplate', 'gameMaster']);

        return new SessionResource($session);
    }

    /**
     * Get statistics for supervisor's branch
     */
    public function getStats(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            return response()->json([
                'today_sessions' => 0,
                'pending_validations' => 0,
                'completed_games' => 0,
                'validated_reservations' => 0,
            ]);
        }

        $today = Carbon::today();
        $todayEnd = Carbon::today()->endOfDay();

        // Today's sessions count
        $todaySessions = Session::query()
            ->where('branch_id', $branch->id)
            ->whereDate('date', $today)
            ->count();

        // Pending validations (reservations that need validation)
        $pendingValidations = Reservation::query()
            ->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
            ->where('game_sessions.branch_id', $branch->id)
            ->whereNull('reservations.validated_at')
            ->whereNull('reservations.cancelled_at')
            ->where('reservations.payment_status', 'paid')
            ->whereDate('game_sessions.date', '<=', $today)
            ->count();

        // Completed games (sessions with best player selected)
        $completedGames = Session::query()
            ->where('branch_id', $branch->id)
            ->whereNotNull('best_player_metadata')
            ->whereDate('date', $today)
            ->count();

        // Validated reservations today
        $validatedReservations = Reservation::query()
            ->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
            ->where('game_sessions.branch_id', $branch->id)
            ->whereNotNull('reservations.validated_at')
            ->whereDate('reservations.validated_at', $today)
            ->count();

        return response()->json([
            'today_sessions' => $todaySessions,
            'pending_validations' => $pendingValidations,
            'completed_games' => $completedGames,
            'validated_reservations' => $validatedReservations,
        ]);
    }

    /**
     * Get list of Game Masters in supervisor's branch
     */
    public function getGameMasters(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            return response()->json(['game_masters' => []]);
        }

        $gameMasters = \App\Models\User::where('role', \App\Enums\UserRole::GAME_MASTER)
            ->where('branch_id', $branch->id)
            ->get(['id', 'name', 'email']);

        return response()->json([
            'game_masters' => $gameMasters,
        ]);
    }

    /**
     * Get Game Master statistics
     */
    public function getGameMasterStats(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            return response()->json([
                'game_masters' => [],
                'top_game_master' => null,
            ]);
        }

        // Get time period from request (default: today)
        $period = $request->get('period', 'today'); // today, week, month
        $startDate = null;
        $endDate = Carbon::today()->endOfDay();

        switch ($period) {
            case 'week':
                $startDate = Carbon::now()->startOfWeek();
                break;
            case 'month':
                $startDate = Carbon::now()->startOfMonth();
                break;
            default: // today
                $startDate = Carbon::today();
                break;
        }

        // Get all Game Masters in the branch
        $gameMasters = \App\Models\User::where('role', \App\Enums\UserRole::GAME_MASTER)
            ->where('branch_id', $branch->id)
            ->get();

        // Calculate validation counts for each Game Master
        $gameMasterStats = $gameMasters->map(function ($gameMaster) use ($branch, $startDate, $endDate) {
            $validatedCount = Reservation::query()
                ->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
                ->where('game_sessions.branch_id', $branch->id)
                ->where('reservations.validated_by', $gameMaster->id)
                ->whereNotNull('reservations.validated_at')
                ->whereBetween('reservations.validated_at', [$startDate, $endDate])
                ->count();

            return [
                'id' => $gameMaster->id,
                'name' => $gameMaster->name,
                'email' => $gameMaster->email,
                'validated_count' => $validatedCount,
            ];
        })->sortByDesc('validated_count')->values();

        // Find top Game Master
        $topGameMaster = $gameMasterStats->firstWhere('validated_count', $gameMasterStats->max('validated_count'));

        return response()->json([
            'game_masters' => $gameMasterStats,
            'top_game_master' => $topGameMaster && $topGameMaster['validated_count'] > 0 ? $topGameMaster : null,
            'period' => $period,
        ]);
    }

    /**
     * Assign Game Master to a session
     */
    public function assignGameMaster(Request $request, Session $session)
    {
        // Ensure the session belongs to the supervisor's branch
        if ($session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only assign game masters to sessions in your branch');
        }

        $validated = $request->validate([
            'game_master_id' => 'required|exists:users,id',
        ]);

        // Verify the user is a Game Master
        $gameMaster = \App\Models\User::findOrFail($validated['game_master_id']);
        if (!$gameMaster->isGameMaster()) {
            return response()->json([
                'message' => 'کاربر انتخاب شده Game Master نیست',
            ], 400);
        }

        // Verify the Game Master belongs to the same branch
        if ($gameMaster->branch_id !== $session->branch_id) {
            return response()->json([
                'message' => 'Game Master باید متعلق به همان شعبه باشد',
            ], 400);
        }

        $session->update([
            'game_master_id' => $validated['game_master_id'],
        ]);

        $session->load(['branch', 'hall', 'sessionTemplate', 'gameMaster']);

        return new SessionResource($session);
    }

    /**
     * Get halls for supervisor's branch
     */
    public function getHalls(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            abort(403, 'Supervisor must be assigned to a branch');
        }

        $halls = $branch->halls()->get();

        return \App\Http\Resources\HallResource::collection($halls);
    }

    /**
     * Get session templates for a hall in supervisor's branch
     */
    public function getSessionTemplates(Request $request, Hall $hall): AnonymousResourceCollection
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            abort(403, 'Supervisor must be assigned to a branch');
        }

        // Verify hall belongs to supervisor's branch
        if ($hall->branch_id !== $branch->id) {
            abort(403, 'You can only view session templates for halls in your branch');
        }

        $perPage = $request->get('per_page', 15);
        $templates = $hall->sessionTemplates()->paginate($perPage);

        return SessionTemplateResource::collection($templates);
    }

    /**
     * Create a session template for a hall in supervisor's branch
     */
    public function createSessionTemplate(Request $request, Hall $hall): SessionTemplateResource
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            abort(403, 'Supervisor must be assigned to a branch');
        }

        // Verify hall belongs to supervisor's branch
        if ($hall->branch_id !== $branch->id) {
            abort(403, 'You can only create session templates for halls in your branch');
        }

        // Normalize start_time if it includes seconds (H:i:s -> H:i)
        $requestData = $request->all();
        if (isset($requestData['start_time']) && preg_match('/^\d{2}:\d{2}:\d{2}$/', $requestData['start_time'])) {
            $requestData['start_time'] = substr($requestData['start_time'], 0, 5); // Remove seconds
            $request->merge($requestData);
        }

        $validated = $request->validate([
            'day_of_week' => ['nullable', 'integer', 'min:0', 'max:6'],
            'start_time' => ['required', 'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9](:([0-5][0-9]))?$/'],
            'price' => ['required', 'numeric', 'min:0'],
            'max_participants' => ['required', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // Normalize start_time to H:i:s format if provided
        if (isset($validated['start_time'])) {
            $timeParts = explode(':', $validated['start_time']);
            if (count($timeParts) === 2) {
                $validated['start_time'] = $validated['start_time'] . ':00';
            }
        }

        // Set hall_id automatically
        $validated['hall_id'] = $hall->id;

        $template = SessionTemplate::create($validated);
        $template->load('hall');

        return new SessionTemplateResource($template);
    }

    /**
     * Update a session template
     */
    public function updateSessionTemplate(Request $request, SessionTemplate $sessionTemplate): SessionTemplateResource
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            abort(403, 'Supervisor must be assigned to a branch');
        }

        // Verify template's hall belongs to supervisor's branch
        if ($sessionTemplate->hall->branch_id !== $branch->id) {
            abort(403, 'You can only update session templates for halls in your branch');
        }

        // Normalize start_time if it includes seconds (H:i:s -> H:i)
        $requestData = $request->all();
        if (isset($requestData['start_time']) && preg_match('/^\d{2}:\d{2}:\d{2}$/', $requestData['start_time'])) {
            $requestData['start_time'] = substr($requestData['start_time'], 0, 5); // Remove seconds
            $request->merge($requestData);
        }

        $validated = $request->validate([
            'day_of_week' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:6'],
            'start_time' => ['sometimes', 'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9](:([0-5][0-9]))?$/'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'max_participants' => ['sometimes', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // Normalize start_time to H:i:s format if provided
        if (isset($validated['start_time'])) {
            $timeParts = explode(':', $validated['start_time']);
            if (count($timeParts) === 2) {
                $validated['start_time'] = $validated['start_time'] . ':00';
            }
        }

        $sessionTemplate->update($validated);
        $sessionTemplate->load('hall');

        return new SessionTemplateResource($sessionTemplate);
    }

    /**
     * Delete a session template
     */
    public function deleteSessionTemplate(Request $request, SessionTemplate $sessionTemplate)
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            abort(403, 'Supervisor must be assigned to a branch');
        }

        // Verify template's hall belongs to supervisor's branch
        if ($sessionTemplate->hall->branch_id !== $branch->id) {
            abort(403, 'You can only delete session templates for halls in your branch');
        }

        $sessionTemplate->delete();

        return response()->json(['message' => 'Session template deleted successfully']);
    }
}

