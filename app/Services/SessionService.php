<?php

namespace App\Services;

use App\Models\Session;
use App\Models\SessionTemplate;
use App\Services\ReservationService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Helpers\TimezoneHelper;

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
                // If day_of_week is null, apply template to all days
                // Otherwise, only apply if it matches the current day
                if ($template->day_of_week === null || $template->day_of_week == $dayOfWeek) {
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
            'pending_participants' => 0,
            'status' => 'upcoming',
        ]);
    }

    /**
     * Calculate available spots for a session
     * Uses cache to avoid repeated calculations
     */
    public function getAvailableSpots(Session $session): int
    {
        // Use cache key based on session ID and updated_at to invalidate on changes
        $cacheKey = "session_available_spots_{$session->id}_{$session->updated_at->timestamp}";
        
        return Cache::remember($cacheKey, 60, function () use ($session) {
            // Expire unpaid reservations before calculating available spots
            // Use app() to avoid circular dependency
            app(ReservationService::class)->expireUnpaidReservations($session);
            
            // Refresh session to get updated pending_participants
            $session->refresh();
            
            return max(0, $session->max_participants - $session->current_participants - $session->pending_participants);
        });
    }

    /**
     * Check if session has enough spots
     */
    public function hasEnoughSpots(Session $session, int $numberOfPeople): bool
    {
        // Expire unpaid reservations before checking capacity
        // Use app() to avoid circular dependency
        app(ReservationService::class)->expireUnpaidReservations($session);
        
        // Refresh session to get updated pending_participants
        $session->refresh();
        
        return $this->getAvailableSpots($session) >= $numberOfPeople;
    }

    /**
     * Get sessions with availability information
     * Optimized to batch expire unpaid reservations
     */
    public function getSessionsWithAvailability($query): Collection
    {
        $sessions = $query->get();
        
        // Batch expire unpaid reservations for all sessions
        $sessionIds = $sessions->pluck('id')->toArray();
        if (!empty($sessionIds)) {
            $this->batchExpireUnpaidReservations($sessionIds);
        }
        
        // Refresh all sessions to get updated pending_participants
        $sessions->each(function ($session) {
            $session->refresh();
        });
        
        // Calculate available spots for all sessions
        return $sessions->map(function ($session) {
            $session->available_spots = max(0, $session->max_participants - $session->current_participants - ($session->pending_participants ?? 0));
            return $session;
        });
    }

    /**
     * Get paginated sessions with availability information
     * Optimized to batch expire unpaid reservations
     */
    public function getPaginatedSessionsWithAvailability($query, int $perPage = 15)
    {
        $paginated = $query->paginate($perPage);
        
        // Batch expire unpaid reservations for all sessions in the collection
        $sessionIds = $paginated->getCollection()->pluck('id')->toArray();
        if (!empty($sessionIds)) {
            $this->batchExpireUnpaidReservations($sessionIds);
        }
        
        // Refresh all sessions to get updated pending_participants
        $paginated->getCollection()->each(function ($session) {
            $session->refresh();
        });
        
        // Calculate available spots for all sessions
        $paginated->getCollection()->transform(function ($session) {
            $session->available_spots = max(0, $session->max_participants - $session->current_participants - ($session->pending_participants ?? 0));
            return $session;
        });

        return $paginated;
    }

    /**
     * Batch expire unpaid reservations for multiple sessions
     * This is more efficient than calling expireUnpaidReservations for each session
     */
    protected function batchExpireUnpaidReservations(array $sessionIds): void
    {
        if (empty($sessionIds)) {
            return;
        }

        DB::transaction(function () use ($sessionIds) {
            // Find all expired reservations for these sessions
            // expires_at is stored as UTC, so we compare with UTC
            $expiredReservations = DB::table('reservations')
                ->whereIn('session_id', $sessionIds)
                ->where('payment_status', 'pending')
                ->whereNull('cancelled_at')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', TimezoneHelper::now()->utc())
                ->lockForUpdate()
                ->get();

            if ($expiredReservations->isEmpty()) {
                return;
            }

            // Group by session_id and calculate total expired participants per session
            $expiredBySession = $expiredReservations->groupBy('session_id')
                ->map(function ($reservations) {
                    return $reservations->sum('number_of_people');
                });

            // Mark reservations as cancelled
            // cancelled_at and updated_at are stored as UTC
            $nowUTC = TimezoneHelper::now()->utc();
            DB::table('reservations')
                ->whereIn('id', $expiredReservations->pluck('id'))
                ->update([
                    'cancelled_at' => $nowUTC,
                    'updated_at' => $nowUTC,
                ]);

            // Update pending_participants for each affected session
            // Also update updated_at to invalidate cache
            foreach ($expiredBySession as $sessionId => $totalExpiredParticipants) {
                DB::table('game_sessions')
                    ->where('id', $sessionId)
                    ->decrement('pending_participants', $totalExpiredParticipants);
                
                // Update updated_at to invalidate cache
                // updated_at is stored as UTC
                DB::table('game_sessions')
                    ->where('id', $sessionId)
                    ->update(['updated_at' => TimezoneHelper::now()->utc()]);
            }
        });
    }
}

