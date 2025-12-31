<?php

namespace App\Services;

use App\Models\Session;
use App\Models\SessionTemplate;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SessionService
{
    /**
     * Generate sessions from templates for a date range
     */
    public function generateSessionsFromTemplates(Carbon $startDate, Carbon $endDate): Collection
    {
        $sessions = collect();
        $templates = SessionTemplate::with('hall.branch')
            ->where('is_active', true)
            ->get();

        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dayOfWeek = $currentDate->dayOfWeek;

            foreach ($templates as $template) {
                if ($template->day_of_week == $dayOfWeek) {
                    $session = $this->createSessionFromTemplate($template, $currentDate);
                    if ($session) {
                        $sessions->push($session);
                    }
                }
            }

            $currentDate->addDay();
        }

        return $sessions;
    }

    /**
     * Create a session from a template for a specific date
     */
    public function createSessionFromTemplate(SessionTemplate $template, Carbon $date): ?Session
    {
        $hall = $template->hall;
        $branch = $hall->branch;

        // Check if session already exists
        $existingSession = Session::where('branch_id', $branch->id)
            ->where('hall_id', $hall->id)
            ->where('date', $date->format('Y-m-d'))
            ->where('start_time', $template->start_time)
            ->first();

        if ($existingSession) {
            return null; // Session already exists
        }

        return Session::create([
            'branch_id' => $branch->id,
            'hall_id' => $hall->id,
            'session_template_id' => $template->id,
            'date' => $date->format('Y-m-d'),
            'start_time' => $template->start_time,
            'price' => $template->price,
            'max_participants' => $template->max_participants,
            'current_participants' => 0,
            'status' => 'upcoming',
        ]);
    }

    /**
     * Calculate available spots for a session
     */
    public function getAvailableSpots(Session $session): int
    {
        return max(0, $session->max_participants - $session->current_participants);
    }

    /**
     * Check if session has enough spots
     */
    public function hasEnoughSpots(Session $session, int $numberOfPeople): bool
    {
        return $this->getAvailableSpots($session) >= $numberOfPeople;
    }

    /**
     * Get sessions with availability information
     */
    public function getSessionsWithAvailability($query): Collection
    {
        return $query->get()->map(function ($session) {
            $session->available_spots = $this->getAvailableSpots($session);
            return $session;
        });
    }
}

