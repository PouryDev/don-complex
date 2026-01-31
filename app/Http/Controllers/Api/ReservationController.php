<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Session;
use App\Services\PaymentService;
use App\Services\ReservationService;
use App\Services\SessionService;
use App\Enums\PaymentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use App\Helpers\TimezoneHelper;

class ReservationController extends Controller
{
    protected ReservationService $reservationService;
    protected PaymentService $paymentService;
    protected SessionService $sessionService;

    public function __construct(
        ReservationService $reservationService,
        PaymentService $paymentService,
        SessionService $sessionService
    ) {
        $this->reservationService = $reservationService;
        $this->paymentService = $paymentService;
        $this->sessionService = $sessionService;
    }

    public function index(Request $request)
    {
        // Eager load all necessary relationships to prevent N+1 queries
        $query = Reservation::query()->with([
            'session.branch',
            'session.hall',
            'session.sessionTemplate',
            'user',
            'paymentTransaction'
        ]);

        // Users can only see their own reservations
        if ($request->user()->isCustomer()) {
            $query->where('reservations.user_id', $request->user()->id);
        } elseif ($request->user()->isSupervisor()) {
            // Supervisor can see reservations in their branch
            $query->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
                  ->where('game_sessions.branch_id', $request->user()->branch->id)
                  ->select('reservations.*');
        } elseif ($request->user()->isGameMaster()) {
            // Use join instead of whereHas for better performance
            $query->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
                  ->where('game_sessions.branch_id', $request->user()->branch->id)
                  ->select('reservations.*');
        }

        $perPage = $request->get('per_page', 15);
        $reservations = $query->orderBy('reservations.created_at', 'desc')->paginate($perPage);

        return ReservationResource::collection($reservations);
    }

    public function show(Reservation $reservation): ReservationResource
    {
        $this->authorize('view', $reservation);

        // Only load relationships if not already loaded
        if (!$reservation->relationLoaded('session')) {
            $reservation->load('session.branch', 'session.hall', 'session.sessionTemplate');
        } elseif (!$reservation->session->relationLoaded('branch')) {
            $reservation->session->load('branch', 'hall', 'sessionTemplate');
        }
        
        if (!$reservation->relationLoaded('user')) {
            $reservation->load('user');
        }
        
        if (!$reservation->relationLoaded('paymentTransaction')) {
            $reservation->load('paymentTransaction');
        }

        return new ReservationResource($reservation);
    }

    public function store(StoreReservationRequest $request, Session $session): ReservationResource
    {
        $this->authorize('create', Reservation::class);

        try {
            $validated = $request->validated();
            $numberOfPeople = $validated['number_of_people'];

            // Additional validation: check if requested number exceeds available spots
            // Use SessionService to get accurate available spots (includes pending_participants)
            $availableSpots = $this->sessionService->getAvailableSpots($session);
            if ($numberOfPeople > $availableSpots) {
                return response()->json([
                    'message' => "حداکثر {$availableSpots} نفر می‌توانید رزرو کنید",
                ], 422)->header('Content-Type', 'application/json');
            }

            // Create reservation with optional order
            $orderItems = $validated['order_items'] ?? null;
            $orderNotes = $validated['order_notes'] ?? null;

            $reservation = $this->reservationService->createReservationWithOrder(
                $request->user(),
                $session,
                $numberOfPeople,
                $orderItems,
                $orderNotes
            );

            // Calculate total price (reservation + orders)
            $totalPrice = $reservation->getTotalAmount();
            
            // Create payment transaction with total amount
            $this->paymentService->createTransaction($reservation, $totalPrice);

            // Eager load all nested relationships
            $reservation->load([
                'session.branch',
                'session.hall',
                'session.sessionTemplate',
                'user',
                'paymentTransaction',
                'orders.orderItems.menuItem'
            ]);

            // Clear session availability cache
            $session = $reservation->session;
            Cache::forget("session_available_spots_{$session->id}_" . $session->updated_at->timestamp);

            return new ReservationResource($reservation);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(Reservation $reservation)
    {
        $this->authorize('delete', $reservation);

        $sessionId = $reservation->session_id;
        $this->reservationService->cancelReservation($reservation);

        // Clear session availability cache
        $session = \App\Models\Session::find($sessionId);
        if ($session) {
            Cache::forget("session_available_spots_{$session->id}_" . $session->updated_at->timestamp);
        }

        return response()->json(['message' => 'Reservation cancelled successfully']);
    }

    /**
     * Get unpaid and non-expired reservations for the authenticated user
     */
    public function unpaid(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        // Use optimized query with proper indexes
        $reservations = Reservation::query()->with([
            'session.branch',
            'session.hall',
            'session.sessionTemplate',
            'paymentTransaction',
        ])
            ->where('user_id', $user->id)
            ->where('payment_status', PaymentStatus::PENDING)
            ->whereNull('cancelled_at')
            // expires_at and created_at are stored as UTC, so we compare with UTC
            ->where('expires_at', '>', TimezoneHelper::now()->utc())
            ->where('created_at', '>=', TimezoneHelper::now()->utc()->subMinutes(15))
            ->orderBy('expires_at', 'asc')
            ->get();
            
        return ReservationResource::collection($reservations);
    }

    /**
     * Get active reservations for menu ordering (within ±5 hours)
     */
    public function getActiveReservationsForMenuOrdering(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $now = TimezoneHelper::now();
        $fiveHoursBefore = $now->copy()->subHours(5);
        $fiveHoursAfter = $now->copy()->addHours(5);

        // Get reservations where session is within ±5 hours
        $reservations = Reservation::query()
            ->with([
                'session.branch',
                'session.hall',
                'session.sessionTemplate',
                'paymentTransaction',
                'orders'
            ])
            ->where('user_id', $user->id)
            ->where('payment_status', PaymentStatus::PENDING)
            ->whereNull('cancelled_at')
            ->where(function ($query) {
                // expires_at is stored as UTC, so we compare with UTC
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', TimezoneHelper::now()->utc());
            })
            ->whereHas('session', function ($query) use ($fiveHoursBefore, $fiveHoursAfter) {
                // Check if session datetime is within ±5 hours
                $query->where(function ($q) use ($fiveHoursBefore, $fiveHoursAfter) {
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
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Filter by actual datetime (combining date and time)
        // Note: session date and time are stored in database, we need to interpret them in Iran timezone
        $reservations = $reservations->filter(function ($reservation) use ($fiveHoursBefore, $fiveHoursAfter) {
            $session = $reservation->session;
            if (!$session) return false;
            
            // Parse session date and time as if they are in Iran timezone
            $sessionDateTime = TimezoneHelper::createFromDateAndTime(
                $session->date->format('Y-m-d'),
                $session->start_time // createFromDateAndTime handles both H:i and H:i:s formats
            );
            return $sessionDateTime->between($fiveHoursBefore, $fiveHoursAfter);
        });

        return ReservationResource::collection($reservations);
    }

    /**
     * Get active session (paid reservation where session started and is within 30 minutes after start time)
     * Users can place menu orders up to 30 minutes after session start time
     */
    public function getActiveSession(Request $request)
    {
        $user = $request->user();
        $now = TimezoneHelper::now();
        // Sessions can be ordered up to 30 minutes after start time
        // So we need to check sessions that started within the last 1.5 hours (90 minutes)
        // This covers: sessions that started 90 minutes ago (still within 30 min window) to sessions that just started
        $oneAndHalfHoursAgo = $now->copy()->subHours(1)->subMinutes(30);

        // Get paid reservations where session started and is within ordering window (30 min after start)
        $reservations = Reservation::query()
            ->with([
                'session.branch',
                'session.hall',
                'session.sessionTemplate',
                'paymentTransaction',
                'orders.orderItems.menuItem.category'
            ])
            ->where('user_id', $user->id)
            ->where('payment_status', PaymentStatus::PAID)
            ->whereNull('cancelled_at')
            ->whereHas('session', function ($query) use ($oneAndHalfHoursAgo, $now) {
                // Check if session datetime is within the ordering window
                $query->where(function ($q) use ($oneAndHalfHoursAgo, $now) {
                    $q->where(function ($subQ) use ($oneAndHalfHoursAgo, $now) {
                        // For same day sessions, check time range
                        $subQ->where('date', $oneAndHalfHoursAgo->format('Y-m-d'))
                            ->where('start_time', '>=', $oneAndHalfHoursAgo->format('H:i:s'))
                            ->where('start_time', '<=', $now->format('H:i:s'));
                    })
                    ->orWhere(function ($subQ) use ($oneAndHalfHoursAgo, $now) {
                        // For sessions between the date range
                        $subQ->where('date', '>', $oneAndHalfHoursAgo->format('Y-m-d'))
                            ->where('date', '<', $now->format('Y-m-d'));
                    })
                    ->orWhere(function ($subQ) use ($oneAndHalfHoursAgo, $now) {
                        // For today, check if time is before now
                        $subQ->where('date', $now->format('Y-m-d'))
                            ->where('start_time', '<=', $now->format('H:i:s'));
                    });
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Filter by actual datetime (combining date and time)
        // Only include sessions that have started and are within 30 minutes after start time
        $activeReservation = $reservations->first(function ($reservation) use ($now) {
            $session = $reservation->session;
            if (!$session) return false;
            
            // Parse session date and time as if they are in Iran timezone
            $sessionDateTime = TimezoneHelper::createFromDateAndTime(
                $session->date->format('Y-m-d'),
                $session->start_time
            );
            
            // Session must have started (not in the future)
            // And current time must be within 30 minutes after session start
            $thirtyMinutesAfterStart = $sessionDateTime->copy()->addMinutes(30);
            
            return $sessionDateTime->lte($now) && $now->lte($thirtyMinutesAfterStart);
        });

        if (!$activeReservation) {
            return response()->json(['data' => null]);
        }

        return new ReservationResource($activeReservation);
    }
}

