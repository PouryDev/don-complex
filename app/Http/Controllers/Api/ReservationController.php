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
            $numberOfPeople = $request->validated()['number_of_people'];

            // Additional validation: check if requested number exceeds available spots
            // Use SessionService to get accurate available spots (includes pending_participants)
            $availableSpots = $this->sessionService->getAvailableSpots($session);
            if ($numberOfPeople > $availableSpots) {
                return response()->json([
                    'message' => "حداکثر {$availableSpots} نفر می‌توانید رزرو کنید",
                ], 422)->header('Content-Type', 'application/json');
            }

            $reservation = $this->reservationService->createReservation(
                $request->user(),
                $session,
                $numberOfPeople
            );

            // Create payment transaction
            $totalPrice = $this->reservationService->calculateTotalPrice($session, $numberOfPeople);
            $this->paymentService->createTransaction($reservation, $totalPrice);

            // Eager load all nested relationships
            $reservation->load([
                'session.branch',
                'session.hall',
                'session.sessionTemplate',
                'user',
                'paymentTransaction'
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
            ->where(function ($q) {
                $q->where('expires_at', '>', now());
            })
            ->orderBy('expires_at', 'asc')
            ->get();
            
        return ReservationResource::collection($reservations);
    }
}

