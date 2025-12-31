<?php

use Illuminate\Support\Facades\Route;

// Serve React app for root
Route::get('/', function () {
    return view('app');
});

// Serve React app for all frontend routes (catch-all)
// API routes are handled separately in routes/api.php
// This ensures that all frontend routes are handled by React Router
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
