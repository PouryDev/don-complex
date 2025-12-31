<?php

namespace App\Console\Commands;

use App\Models\Session;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncSessionParticipants extends Command
{
    protected $signature = 'sessions:sync-participants 
                            {--session-id= : Sync a specific session by ID}';

    protected $description = 'Sync current_participants with actual sum of reservations number_of_people';

    public function handle(): int
    {
        $sessionId = $this->option('session-id');

        if ($sessionId) {
            $session = Session::find($sessionId);
            if (!$session) {
                $this->error("Session with ID {$sessionId} not found.");
                return Command::FAILURE;
            }
            $sessions = collect([$session]);
            $this->info("Syncing session ID: {$sessionId}");
        } else {
            $sessions = Session::all();
            $this->info("Syncing all sessions...");
        }

        $updated = 0;
        $totalSessions = $sessions->count();

        $bar = $this->output->createProgressBar($totalSessions);
        $bar->start();

        foreach ($sessions as $session) {
            // Calculate actual participants from non-cancelled reservations
            $actualParticipants = $session->reservations()
                ->whereNull('cancelled_at')
                ->sum('number_of_people');

            // Update if different
            if ($session->current_participants != $actualParticipants) {
                $oldValue = $session->current_participants;
                $session->update(['current_participants' => $actualParticipants]);
                $updated++;

                if ($this->getOutput()->isVerbose()) {
                    $this->newLine();
                    $this->line("Session #{$session->id}: {$oldValue} → {$actualParticipants}");
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Successfully synced {$updated} out of {$totalSessions} sessions.");

        return Command::SUCCESS;
    }
}
