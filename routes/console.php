<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule: Generate sessions from templates daily (runs at 00:00)
Schedule::command('sessions:generate --days=30')
    ->daily()
    ->at('00:00')
    ->timezone('Asia/Tehran');
