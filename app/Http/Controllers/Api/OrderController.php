<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\StoreMenuOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Reservation;
use App\Models\Session;
use App\Services\OrderService;
use App\Services\PaymentService;
use App\Services\ReservationService;
use App\Enums\PaymentStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    protected OrderService $orderService;
    protected PaymentService $paymentService;
    protected ReservationService $reservationService;

    public function __construct(
        OrderService $orderService,
        PaymentService $paymentService,
        ReservationService $reservationService
    ) {
        $this->orderService = $orderService;
        $this->paymentService = $paymentService;
        $this->reservationService = $reservationService;
    }

    /**
     * Get all orders for a reservation
     */
    public function index(Request $request, Reservation $reservation): AnonymousResourceCollection
    {
        $this->authorize('view', $reservation);

        $orders = $reservation->orders()
            ->with(['orderItems.menuItem.category'])
            ->whereNull('deleted_at')
            ->get();

        return OrderResource::collection($orders);
    }

    /**
     * Create a new order for a reservation
     */
    public function store(StoreOrderRequest $request, Reservation $reservation): JsonResponse
    {
        $this->authorize('view', $reservation);

        try {
            // Check if reservation belongs to authenticated user
            if ($reservation->user_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'شما مجاز به ایجاد سفارش برای این رزرو نیستید.'
                ], 403);
            }

            // Create order
            $order = $this->orderService->createOrder(
                $reservation,
                $request->validated()['items'],
                $request->validated()['notes'] ?? null
            );

            // Recalculate payment transaction amount
            $reservation->load('paymentTransaction');
            if ($reservation->paymentTransaction) {
                $this->paymentService->recalculateTransactionAmount($reservation);
            }

            // Reload order with updated reservation data
            $order->load(['orderItems.menuItem.category', 'reservation']);

            return response()->json([
                'message' => 'سفارش با موفقیت ثبت شد.',
                'data' => new OrderResource($order),
                'total_amount' => $reservation->getTotalAmount(),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update an existing order
     */
    public function update(StoreOrderRequest $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        try {
            // Update order
            $order = $this->orderService->updateOrder(
                $order,
                $request->validated()['items'],
                $request->validated()['notes'] ?? null
            );

            // Recalculate payment transaction amount
            $reservation = $order->reservation;
            $reservation->load('paymentTransaction');
            if ($reservation->paymentTransaction) {
                $this->paymentService->recalculateTransactionAmount($reservation);
            }

            // Reload order with updated data
            $order->load(['orderItems.menuItem.category', 'reservation']);

            return response()->json([
                'message' => 'سفارش با موفقیت بروزرسانی شد.',
                'data' => new OrderResource($order),
                'total_amount' => $reservation->getTotalAmount(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete an order
     */
    public function destroy(Order $order): JsonResponse
    {
        $this->authorize('delete', $order);

        try {
            $reservation = $order->reservation;

            $this->orderService->cancelOrder($order);

            // Recalculate payment transaction amount
            $reservation->load('paymentTransaction');
            if ($reservation->paymentTransaction) {
                $this->paymentService->recalculateTransactionAmount($reservation);
            }

            return response()->json([
                'message' => 'سفارش با موفقیت حذف شد.',
                'total_amount' => $reservation->getTotalAmount(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Create a menu order (can link to existing reservation or create new one)
     */
    public function createMenuOrder(StoreMenuOrderRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $validated = $request->validated();
            $items = $validated['items'];
            $notes = $validated['notes'] ?? null;

            return DB::transaction(function () use ($user, $validated, $items, $notes) {
                $reservation = null;

                // If reservation_id is provided, use existing reservation
                if (isset($validated['reservation_id'])) {
                    $reservation = Reservation::findOrFail($validated['reservation_id']);
                    
                    // Verify reservation belongs to user
                    if ($reservation->user_id !== $user->id) {
                        return response()->json([
                            'message' => 'شما مجاز به ایجاد سفارش برای این رزرو نیستید.'
                        ], 403);
                    }

                    // Verify reservation is still valid
                    if ($reservation->payment_status !== PaymentStatus::PENDING || $reservation->cancelled_at) {
                        return response()->json([
                            'message' => 'این رزرو دیگر معتبر نیست.'
                        ], 422);
                    }
                }
                // If session_id is provided, create new reservation
                elseif (isset($validated['session_id'])) {
                    $session = Session::findOrFail($validated['session_id']);
                    
                    // Create reservation with 1 person (default for menu orders)
                    $reservation = $this->reservationService->createReservation(
                        $user,
                        $session,
                        1 // Default to 1 person for menu-only orders
                    );

                    // Create payment transaction if not exists
                    if (!$reservation->payment_transaction_id) {
                        $totalPrice = $reservation->getTotalAmount();
                        $this->paymentService->createTransaction($reservation, $totalPrice);
                    }
                }

                // Create order for the reservation
                $order = $this->orderService->createOrder($reservation, $items, $notes);

                // Recalculate payment transaction amount only if reservation is still pending
                // For paid reservations (active sessions), no payment recalculation is needed
                $reservation->load('paymentTransaction');
                if ($reservation->paymentTransaction && $reservation->payment_status === PaymentStatus::PENDING) {
                    $this->paymentService->recalculateTransactionAmount($reservation);
                }

                // Calculate minimum cafe order and deficit
                $minimumCafeOrder = $reservation->getMinimumCafeOrderAmount();
                $cafeOrderTotal = $reservation->getCafeOrderTotal();
                $cafeOrderDeficit = max(0, $minimumCafeOrder - $cafeOrderTotal);
                
                // For paid reservations (active sessions), if order is less than minimum, no payment needed
                $requiresPayment = true;
                if ($reservation->payment_status === PaymentStatus::PAID && $cafeOrderTotal < $minimumCafeOrder) {
                    $requiresPayment = false;
                }

                // Reload order with relationships
                $order->load(['orderItems.menuItem.category', 'reservation.session']);

                return response()->json([
                    'message' => 'سفارش با موفقیت ثبت شد.',
                    'data' => new OrderResource($order),
                    'reservation' => [
                        'id' => $reservation->id,
                        'total_amount' => $reservation->getTotalAmount(),
                        'minimum_cafe_order' => $minimumCafeOrder,
                        'cafe_order_total' => $cafeOrderTotal,
                        'cafe_order_deficit' => $cafeOrderDeficit,
                        'has_deficit' => $cafeOrderDeficit > 0,
                        'requires_payment' => $requiresPayment,
                    ],
                ], 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

