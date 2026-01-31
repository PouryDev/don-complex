<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ReservationResource;
use App\Enums\PaymentStatus;
use App\Models\Reservation;
use App\Models\PaymentTransaction;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Helpers\TimezoneHelper;

class CashierController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
        $this->middleware(function ($request, $next) {
            $user = $request->user();
            if (!$user->isCashier()) {
                abort(403, 'Only cashiers can access this resource');
            }
            // Ensure branch is loaded for cashier
            if (!$user->relationLoaded('branch')) {
                $user->load('branch');
            }
            return $next($request);
        });
    }

    /**
     * Get reservations for cashier's branch
     */
    public function indexReservations(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            return ReservationResource::collection(collect());
        }

        $query = Reservation::query()
            ->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
            ->where('game_sessions.branch_id', $branch->id)
            ->select('reservations.*')
            ->with([
                'session.branch',
                'session.hall',
                'session.sessionTemplate',
                'user',
                'paymentTransaction',
                'orders.orderItems.menuItem'
            ]);

        // Filter by payment status
        if ($request->has('payment_status')) {
            $query->where('reservations.payment_status', $request->payment_status);
        }

        // Filter by date (session date)
        if ($request->has('date')) {
            $query->where('game_sessions.date', $request->date);
        }

        // Filter by validated status
        if ($request->has('validated')) {
            if ($request->validated === 'true') {
                $query->whereNotNull('reservations.validated_at');
            } else {
                $query->whereNull('reservations.validated_at');
            }
        }

        // Exclude cancelled reservations by default
        if (!$request->has('include_cancelled')) {
            $query->whereNull('reservations.cancelled_at');
        }

        $perPage = $request->get('per_page', 15);
        $reservations = $query->orderBy('reservations.created_at', 'desc')->paginate($perPage);

        return ReservationResource::collection($reservations);
    }

    /**
     * Get a single reservation
     */
    public function showReservation(Request $request, Reservation $reservation): ReservationResource
    {
        // Ensure reservation belongs to cashier's branch
        if ($reservation->session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only view reservations for sessions in your branch');
        }

        $reservation->load([
            'session.branch',
            'session.hall',
            'session.sessionTemplate',
            'user',
            'paymentTransaction',
            'orders.orderItems.menuItem.category'
        ]);

        return new ReservationResource($reservation);
    }

    /**
     * Process payment for a reservation (mark as paid)
     */
    public function processPayment(Request $request, Reservation $reservation)
    {
        // Ensure reservation belongs to cashier's branch
        if ($reservation->session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only process payments for reservations in your branch');
        }

        if ($reservation->payment_status === PaymentStatus::PAID) {
            return response()->json([
                'message' => 'این رزرو قبلاً پرداخت شده است',
            ], 400);
        }

        if (!$reservation->paymentTransaction) {
            return response()->json([
                'message' => 'تراکنش پرداخت یافت نشد',
            ], 400);
        }

        try {
            DB::transaction(function () use ($reservation, $request) {
                $cashierNote = $request->input('note');
                $this->paymentService->markAsPaidByCashier(
                    $reservation->paymentTransaction,
                    $cashierNote
                );
            });

            // Reload reservation with all relationships
            $reservation->refresh();
            $reservation->load([
                'session.branch',
                'session.hall',
                'session.sessionTemplate',
                'user',
                'paymentTransaction',
                'orders.orderItems.menuItem'
            ]);

            return new ReservationResource($reservation);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get orders for a reservation
     */
    public function getOrders(Request $request, Reservation $reservation): AnonymousResourceCollection
    {
        // Ensure reservation belongs to cashier's branch
        if ($reservation->session->branch_id !== $request->user()->branch->id) {
            abort(403, 'You can only view orders for reservations in your branch');
        }

        $orders = $reservation->orders()
            ->with(['orderItems.menuItem.category'])
            ->whereNull('deleted_at')
            ->get();

        return OrderResource::collection($orders);
    }

    /**
     * Get transactions for cashier's branch
     */
    public function getTransactions(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'total' => 0,
                    'per_page' => 15,
                    'current_page' => 1,
                    'last_page' => 1,
                ],
            ]);
        }

        $query = PaymentTransaction::query()
            ->join('reservations', 'payment_transactions.reservation_id', '=', 'reservations.id')
            ->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
            ->where('game_sessions.branch_id', $branch->id)
            ->select('payment_transactions.*')
            ->with([
                'reservation.user',
                'reservation.session.branch'
            ]);

        // Filter by status
        if ($request->has('status')) {
            $query->where('payment_transactions.status', $request->status);
        }

        // Filter by date (transaction date)
        if ($request->has('date')) {
            $query->whereDate('payment_transactions.created_at', $request->date);
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('payment_transactions.created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('payment_transactions.created_at', '<=', $request->to_date);
        }

        $perPage = $request->get('per_page', 15);
        $transactions = $query->orderBy('payment_transactions.created_at', 'desc')->paginate($perPage);

        return response()->json([
            'data' => $transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'reservation_id' => $transaction->reservation_id,
                    'amount' => (float) $transaction->amount,
                    'gateway' => $transaction->gateway,
                    'status' => $transaction->status->value,
                    'gateway_transaction_id' => $transaction->gateway_transaction_id,
                    'metadata' => $transaction->metadata,
                    'created_at' => $transaction->created_at->toIso8601String(),
                    'reservation' => [
                        'id' => $transaction->reservation->id,
                        'user' => [
                            'id' => $transaction->reservation->user->id,
                            'name' => $transaction->reservation->user->name,
                        ],
                        'session' => [
                            'id' => $transaction->reservation->session->id,
                            'date' => $transaction->reservation->session->date,
                            'start_time' => $transaction->reservation->session->start_time,
                            'branch' => [
                                'id' => $transaction->reservation->session->branch->id,
                                'name' => $transaction->reservation->session->branch->name,
                            ],
                        ],
                    ],
                ];
            }),
            'meta' => [
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
            ],
        ]);
    }

    /**
     * Get statistics for cashier's branch
     */
    public function getStats(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $branch = $user->branch;

        if (!$branch) {
            return response()->json([
                'today_reservations' => 0,
                'today_revenue' => 0,
                'pending_reservations' => 0,
                'today_transactions' => 0,
            ]);
        }

        $today = TimezoneHelper::today();
        $todayEnd = TimezoneHelper::today()->endOfDay();
        $todayFormatted = $today->format('Y-m-d');

        // Today's reservations count
        // Note: We interpret date as if it is in Iran timezone
        $todayReservations = Reservation::query()
            ->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
            ->where('game_sessions.branch_id', $branch->id)
            ->where('game_sessions.date', $todayFormatted)
            ->whereNull('reservations.cancelled_at')
            ->count();

        // Today's revenue (from paid transactions)
        // Note: created_at is stored as UTC, so we need to convert to UTC for comparison
        $todayStartUTC = $today->copy()->startOfDay()->utc();
        $todayEndUTC = $todayEnd->copy()->endOfDay()->utc();
        $todayRevenue = PaymentTransaction::query()
            ->join('reservations', 'payment_transactions.reservation_id', '=', 'reservations.id')
            ->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
            ->where('game_sessions.branch_id', $branch->id)
            ->where('payment_transactions.status', PaymentStatus::PAID)
            ->whereBetween('payment_transactions.created_at', [$todayStartUTC, $todayEndUTC])
            ->sum('payment_transactions.amount');

        // Pending reservations count
        $pendingReservations = Reservation::query()
            ->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
            ->where('game_sessions.branch_id', $branch->id)
            ->where('reservations.payment_status', PaymentStatus::PENDING)
            ->whereNull('reservations.cancelled_at')
            ->where(function ($query) {
                $query->whereNull('reservations.expires_at')
                      ->orWhere('reservations.expires_at', '>', now());
            })
            ->count();

        // Today's transactions count
        $todayTransactions = PaymentTransaction::query()
            ->join('reservations', 'payment_transactions.reservation_id', '=', 'reservations.id')
            ->join('game_sessions', 'reservations.session_id', '=', 'game_sessions.id')
            ->where('game_sessions.branch_id', $branch->id)
            ->whereBetween('payment_transactions.created_at', [$today, $todayEnd])
            ->count();

        return response()->json([
            'today_reservations' => $todayReservations,
            'today_revenue' => (float) $todayRevenue,
            'pending_reservations' => $pendingReservations,
            'today_transactions' => $todayTransactions,
        ]);
    }
}

