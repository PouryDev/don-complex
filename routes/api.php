<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\GameMasterController;
use App\Http\Controllers\Api\HallController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\SessionTemplateController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

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

    // Game Master routes
    Route::prefix('game-master')->group(function () {
        Route::get('/sessions', [GameMasterController::class, 'sessions']);
        Route::get('/sessions/{session}/reservations', [GameMasterController::class, 'sessionReservations']);
        Route::post('/reservations/{reservation}/validate', [GameMasterController::class, 'validateReservation']);
    });
});

