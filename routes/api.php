<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FeedController;
use App\Http\Controllers\Api\FormResponseController;
use App\Http\Controllers\Api\GameMasterController;
use App\Http\Controllers\Api\HallController;
use App\Http\Controllers\Api\MenuItemController;
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
    Route::apiResource('sessions', SessionController::class)->except(['destroy']);

    // Reservations
    Route::apiResource('reservations', ReservationController::class)->except(['update']);
    Route::post('/sessions/{session}/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations/unpaid', [ReservationController::class, 'unpaid']);

    // Payment routes
    Route::post('/payments/{paymentTransaction}/initiate', [PaymentController::class, 'initiate']);
    Route::get('/payments/{paymentTransaction}/status', [PaymentController::class, 'status']);

    // Quiz and Form responses
    Route::post('/quizzes/{quiz}/responses', [QuizResponseController::class, 'store']);
    Route::get('/quizzes/{quiz}/responses', [QuizResponseController::class, 'show']);
    Route::post('/forms/{form}/responses', [FormResponseController::class, 'store']);
    Route::get('/forms/{form}/responses', [FormResponseController::class, 'show']);

    // Game Master routes
    Route::prefix('game-master')->group(function () {
        Route::get('/sessions', [GameMasterController::class, 'sessions']);
        Route::get('/sessions/{session}/reservations', [GameMasterController::class, 'sessionReservations']);
        Route::post('/reservations/{reservation}/validate', [GameMasterController::class, 'validateReservation']);
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

