<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Session;
use App\Services\PaymentService;
use App\Services\ReservationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReservationController extends Controller
{
    protected ReservationService $reservationService;
    protected PaymentService $paymentService;

    public function __construct(ReservationService $reservationService, PaymentService $paymentService)
    {
        $this->reservationService = $reservationService;
        $this->paymentService = $paymentService;
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

        // Eager load all nested relationships
        $reservation->load([
            'session.branch',
            'session.hall',
            'session.sessionTemplate',
            'user',
            'paymentTransaction'
        ]);

        return new ReservationResource($reservation);
    }

    public function store(StoreReservationRequest $request, Session $session): ReservationResource
    {
        $this->authorize('create', Reservation::class);

        try {
            $numberOfPeople = $request->validated()['number_of_people'];

            // Additional validation: check if requested number exceeds available spots
            $availableSpots = $session->max_participants - $session->current_participants;
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

        $this->reservationService->cancelReservation($reservation);

        return response()->json(['message' => 'Reservation cancelled successfully']);
    }
}

