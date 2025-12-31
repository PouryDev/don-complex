<?php

namespace App\Console\Commands;

use App\Services\SessionService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateSessionsFromTemplates extends Command
{
    protected $signature = 'sessions:generate 
                            {--days=30 : Number of days ahead to generate sessions}
                            {--start-date= : Start date (Y-m-d format). Defaults to today}';

    protected $description = 'Generate sessions from active session templates for the specified date range';

    protected SessionService $sessionService;

    public function __construct(SessionService $sessionService)
    {
        parent::__construct();
        $this->sessionService = $sessionService;
    }

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $startDateInput = $this->option('start-date');

        $startDate = $startDateInput 
            ? Carbon::parse($startDateInput)
            : Carbon::today();

        $endDate = $startDate->copy()->addDays($days - 1);

        $this->info("Generating sessions from {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}...");

        $sessions = $this->sessionService->generateSessionsFromTemplates($startDate, $endDate);

        $this->info("Successfully generated {$sessions->count()} sessions.");

        if ($this->getOutput()->isVerbose() && $sessions->isNotEmpty()) {
            $this->table(
                ['ID', 'Branch', 'Hall', 'Date', 'Time', 'Price', 'Max Participants'],
                $sessions->map(function ($session) {
                    $session->load(['branch', 'hall']);
                    return [
                        $session->id,
                        $session->branch->name,
                        $session->hall->name,
                        $session->date->format('Y-m-d'),
                        $session->start_time,
                        $session->price,
                        $session->max_participants,
                    ];
                })->toArray()
            );
        }

        return Command::SUCCESS;
    }
}
