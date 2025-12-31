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

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Reservation::query()->with(['session', 'user', 'paymentTransaction']);

        // Users can only see their own reservations
        if ($request->user()->isCustomer()) {
            $query->where('user_id', $request->user()->id);
        } elseif ($request->user()->isGameMaster()) {
            // Game master can see reservations for their branch
            $query->whereHas('session', function ($q) use ($request) {
                $q->where('branch_id', $request->user()->branch->id);
            });
        }

        $reservations = $query->orderBy('created_at', 'desc')->get();

        return ReservationResource::collection($reservations);
    }

    public function show(Reservation $reservation): ReservationResource
    {
        $this->authorize('view', $reservation);

        $reservation->load(['session', 'user', 'paymentTransaction']);

        return new ReservationResource($reservation);
    }

    public function store(StoreReservationRequest $request, Session $session): ReservationResource
    {
        $this->authorize('create', Reservation::class);

        $reservation = $this->reservationService->createReservation(
            $request->user(),
            $session,
            $request->validated()['number_of_people']
        );

        // Create payment transaction
        $totalPrice = $this->reservationService->calculateTotalPrice($session, $request->validated()['number_of_people']);
        $this->paymentService->createTransaction($reservation, $totalPrice);

        $reservation->load(['session', 'user', 'paymentTransaction']);

        return new ReservationResource($reservation);
    }

    public function destroy(Reservation $reservation)
    {
        $this->authorize('delete', $reservation);

        $this->reservationService->cancelReservation($reservation);

        return response()->json(['message' => 'Reservation cancelled successfully']);
    }
}

