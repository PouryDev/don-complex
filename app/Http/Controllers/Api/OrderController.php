<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Reservation;
use App\Services\OrderService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    protected OrderService $orderService;
    protected PaymentService $paymentService;

    public function __construct(OrderService $orderService, PaymentService $paymentService)
    {
        $this->orderService = $orderService;
        $this->paymentService = $paymentService;
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
}

