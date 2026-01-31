<?php

use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;

// Payment callback route (for gateway redirects)
Route::get('/payment/callback/{gateway}', [PaymentController::class, 'callback'])
    ->name('payment.callback');

// Serve React app for root
Route::get('/', function () {
    return view('app');
});

// Cashier panel route
Route::get('/cashier/{any?}', function () {
    return view('cashier');
})->where('any', '.*');

// Supervisor panel route
Route::get('/supervisor/{any?}', function () {
    return view('supervisor');
})->where('any', '.*');

// Serve React app for all frontend routes (catch-all)
// API routes are handled separately in routes/api.php
// Payment callback routes are handled above
// This ensures that all frontend routes are handled by React Router
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|payment/callback|cashier|supervisor).*$');
