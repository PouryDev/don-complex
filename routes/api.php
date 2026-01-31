<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CoinController;
use App\Http\Controllers\Api\DiscountCodeController;
use App\Http\Controllers\Api\FeedController;
use App\Http\Controllers\Api\FormResponseController;
use App\Http\Controllers\Api\FreeTicketController;
use App\Http\Controllers\Api\CashierController;
use App\Http\Controllers\Api\SupervisorController;
use App\Http\Controllers\Api\GameMasterController;
use App\Http\Controllers\Api\HallController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\QuizResponseController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\SessionTemplateController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public menu routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/menu-items', [MenuItemController::class, 'index']);

// Public feed routes
Route::get('/feed', [FeedController::class, 'index']);
Route::get('/feed/{type}/{id}', [FeedController::class, 'show']);

// Public payment gateways route (needed for checkout)
Route::get('/payment/gateways', [PaymentController::class, 'gateways']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'update']);

    // Branches
    Route::apiResource('branches', BranchController::class);
    Route::get('/branches/{branch}/sessions', [SessionController::class, 'branchSessions']);

    // Halls
    Route::get('/branches/{branch}/halls', [HallController::class, 'index']);
    Route::post('/branches/{branch}/halls', [HallController::class, 'store']);
    Route::put('/halls/{hall}', [HallController::class, 'update']);
    Route::delete('/halls/{hall}', [HallController::class, 'destroy']);

    // Session Templates
    Route::get('/halls/{hall}/session-templates', [SessionTemplateController::class, 'index']);
    Route::post('/halls/{hall}/session-templates', [SessionTemplateController::class, 'store']);
    Route::put('/session-templates/{sessionTemplate}', [SessionTemplateController::class, 'update']);
    Route::delete('/session-templates/{sessionTemplate}', [SessionTemplateController::class, 'destroy']);

    // Sessions
    // Important: available-for-menu route must be before apiResource to avoid route model binding conflict
    Route::get('/sessions/available-for-menu', [SessionController::class, 'getAvailableSessionsForMenuOrdering']);
    Route::apiResource('sessions', SessionController::class)->except(['destroy']);

    // Reservations
    // Important: unpaid route must be before apiResource to avoid route model binding conflict
    Route::get('/reservations/unpaid', [ReservationController::class, 'unpaid']);
    Route::get('/reservations/active-for-menu', [ReservationController::class, 'getActiveReservationsForMenuOrdering']);
    Route::apiResource('reservations', ReservationController::class)->except(['update']);
    Route::post('/sessions/{session}/reservations', [ReservationController::class, 'store']);

    // Orders (for reservations)
    Route::get('/reservations/{reservation}/orders', [OrderController::class, 'index']);
    Route::post('/reservations/{reservation}/orders', [OrderController::class, 'store']);
    Route::put('/orders/{order}', [OrderController::class, 'update']);
    Route::delete('/orders/{order}', [OrderController::class, 'destroy']);
    Route::post('/orders/menu', [OrderController::class, 'createMenuOrder']);

    // Payment routes
    Route::post('/payments/{paymentTransaction}/initiate', [PaymentController::class, 'initiate']);
    Route::get('/payments/{paymentTransaction}/status', [PaymentController::class, 'status']);

    // Quiz and Form responses
    Route::post('/quizzes/{quiz}/responses', [QuizResponseController::class, 'store']);
    Route::get('/quizzes/{quiz}/responses', [QuizResponseController::class, 'show']);
    Route::post('/forms/{form}/responses', [FormResponseController::class, 'store']);
    Route::get('/forms/{form}/responses', [FormResponseController::class, 'show']);

    // Coins
    Route::get('/coins/balance', [CoinController::class, 'balance']);
    Route::get('/coins/history', [CoinController::class, 'history']);
    
    // Discount Codes
    Route::get('/discount-codes', [DiscountCodeController::class, 'index']);
    Route::post('/discount-codes/{discountCode}/purchase', [DiscountCodeController::class, 'purchase']);
    Route::get('/discount-codes/my-codes', [DiscountCodeController::class, 'myCodes']);
    Route::post('/discount-codes/validate', [DiscountCodeController::class, 'validate']);
    
    // Free Tickets
    Route::get('/free-tickets', [FreeTicketController::class, 'index']);
    Route::post('/free-tickets/purchase', [FreeTicketController::class, 'purchase']);
    Route::post('/free-tickets/{freeTicket}/use', [FreeTicketController::class, 'use']);
    
    // Feed view tracking (for coin rewards)
    Route::post('/feed/{type}/{id}/view', [FeedController::class, 'trackView']);

    // Game Master routes
    Route::prefix('game-master')->group(function () {
        Route::get('/sessions', [GameMasterController::class, 'sessions']);
        Route::get('/sessions/{session}/reservations', [GameMasterController::class, 'sessionReservations']);
        Route::post('/reservations/{reservation}/validate', [GameMasterController::class, 'validateReservation']);
    });

    // Cashier routes
    Route::prefix('cashier')->group(function () {
        Route::get('/reservations', [CashierController::class, 'indexReservations']);
        Route::get('/reservations/{reservation}', [CashierController::class, 'showReservation']);
        Route::post('/reservations/{reservation}/process-payment', [CashierController::class, 'processPayment']);
        Route::get('/reservations/{reservation}/orders', [CashierController::class, 'getOrders']);
        Route::get('/transactions', [CashierController::class, 'getTransactions']);
        Route::get('/stats', [CashierController::class, 'getStats']);
    });

    // Supervisor routes
    Route::prefix('supervisor')->group(function () {
        Route::get('/sessions', [SupervisorController::class, 'sessions']);
        Route::post('/sessions', [SupervisorController::class, 'createSession']);
        Route::put('/sessions/{session}', [SupervisorController::class, 'updateSession']);
        Route::get('/sessions/{session}/reservations', [SupervisorController::class, 'sessionReservations']);
        Route::get('/reservations/{reservation}', [SupervisorController::class, 'showReservation']);
        Route::post('/reservations/{reservation}/cancel', [SupervisorController::class, 'cancelReservation']);
        Route::post('/reservations/{reservation}/fraud-report', [SupervisorController::class, 'reportFraud']);
        Route::post('/reservations/{reservation}/game-result', [SupervisorController::class, 'registerGameResult']);
        Route::post('/sessions/{session}/best-player', [SupervisorController::class, 'selectBestPlayer']);
        Route::get('/stats', [SupervisorController::class, 'getStats']);
        Route::get('/game-masters', [SupervisorController::class, 'getGameMasters']);
        Route::get('/game-master-stats', [SupervisorController::class, 'getGameMasterStats']);
        Route::post('/sessions/{session}/assign-game-master', [SupervisorController::class, 'assignGameMaster']);
        
        // Session Template management
        Route::get('/halls', [SupervisorController::class, 'getHalls']);
        Route::get('/halls/{hall}/session-templates', [SupervisorController::class, 'getSessionTemplates']);
        Route::post('/halls/{hall}/session-templates', [SupervisorController::class, 'createSessionTemplate']);
        Route::put('/session-templates/{sessionTemplate}', [SupervisorController::class, 'updateSessionTemplate']);
        Route::delete('/session-templates/{sessionTemplate}', [SupervisorController::class, 'deleteSessionTemplate']);
    });

    // Admin routes
    Route::prefix('admin')->group(function () {
        // Categories
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::get('/categories/{category}', [CategoryController::class, 'show']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        // Menu Items
        Route::get('/menu-items', [MenuItemController::class, 'index']);
        Route::post('/menu-items', [MenuItemController::class, 'store']);
        Route::get('/menu-items/{menuItem}', [MenuItemController::class, 'show']);
        Route::post('/menu-items/{menuItem}', [MenuItemController::class, 'update']);
        Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy']);
    });
});

