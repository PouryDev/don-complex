<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Http\Resources\SessionResource;
use App\Models\Reservation;
use App\Models\Session;
use App\Services\SessionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GameMasterController extends Controller
{
    protected SessionService $sessionService;

    public function __construct(SessionService $sessionService)
    {
        $this->sessionService = $sessionService;
        $this->middleware(function ($request, $next) {
            if (!$request->user()->isGameMaster()) {
                abort(403, 'Only game masters can access this resource');
            }
            return $next($request);
        });
    }

    public function sessions(Request $request)
    {
        $branch = $request->user()->branch;

        if (!$branch) {
            return SessionResource::collection(collect());
        }

        $query = $branch->sessions()->with(['branch', 'hall', 'sessionTemplate']);

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        $sessions = $this->sessionService->getPaginatedSessionsWithAvailability(
            $query->orderBy('date')->orderBy('start_time'),
            $perPage
        );

        return SessionResource::collection($sessions);
    }

    public function sessionReservations(Request $request, Session $session)
    {
        // Ensure the session belongs to the game master's branch
        if ($session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only view reservations for sessions in your branch');
        }

        $perPage = $request->get('per_page', 15);
        $reservations = $session->reservations()
            ->with([
                'session.branch',
                'session.hall',
                'session.sessionTemplate',
                'user',
                'paymentTransaction'
            ])
            ->whereNull('cancelled_at')
            ->orderBy('created_at')
            ->paginate($perPage);

        return ReservationResource::collection($reservations);
    }

    public function validateReservation(Request $request, Reservation $reservation)
    {
        // Ensure the reservation's session belongs to the game master's branch
        if ($reservation->session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only validate reservations for sessions in your branch');
        }

        if ($reservation->validated_at) {
            return response()->json(['message' => 'Reservation already validated'], 400);
        }

        $reservation->update([
            'validated_at' => now(),
            'validated_by' => $request->user()->id,
        ]);

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
}

