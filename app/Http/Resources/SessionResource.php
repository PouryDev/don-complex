<?php

namespace App\Http\Resources;

use App\Services\SessionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\TimezoneHelper;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Get accurate available spots (expires unpaid reservations first)
        $sessionService = app(SessionService::class);
        $availableSpots = $sessionService->getAvailableSpots($this->resource);

        // Calculate actual status based on date and time
        $actualStatus = $this->calculateActualStatus();

        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'hall_id' => $this->hall_id,
            'session_template_id' => $this->session_template_id,
            'date' => $this->date->format('Y-m-d'),
            'start_time' => $this->start_time,
            'price' => (float) $this->price,
            'max_participants' => $this->max_participants,
            'current_participants' => $this->current_participants,
            'pending_participants' => $this->pending_participants ?? 0,
            'available_spots' => $availableSpots,
            'status' => $actualStatus,
            'branch' => $this->whenLoaded('branch', new BranchResource($this->branch)),
            'hall' => $this->whenLoaded('hall', new HallResource($this->hall)),
            'session_template' => $this->whenLoaded('sessionTemplate', new SessionTemplateResource($this->sessionTemplate)),
            'game_master' => $this->whenLoaded('gameMaster', function () {
                return [
                    'id' => $this->gameMaster->id,
                    'name' => $this->gameMaster->name,
                    'email' => $this->gameMaster->email,
                ];
            }),
            'best_player_metadata' => $this->best_player_metadata,
        ];
    }

    /**
     * Calculate actual status based on date and time
     * If status is cancelled, keep it as cancelled
     * Otherwise, calculate based on current date/time vs session date/time
     */
    protected function calculateActualStatus(): string
    {
        // If cancelled, always return cancelled
        if ($this->status->value === 'cancelled') {
            return 'cancelled';
        }

        $now = TimezoneHelper::now();
        // Parse session date and time as if they are in Iran timezone
        $sessionDate = TimezoneHelper::createFromDateAndTime(
            $this->date->format('Y-m-d'),
            '00:00:00'
        )->startOfDay();
        $sessionDateTime = TimezoneHelper::createFromDateAndTime(
            $this->date->format('Y-m-d'),
            $this->start_time // createFromDateAndTime handles both H:i and H:i:s formats
        );

        // If session date is in the past, it's completed
        if ($sessionDate->isPast() && !$sessionDate->isToday()) {
            return 'completed';
        }

        // If session is today, check the time
        if ($sessionDate->isToday()) {
            // If start time has passed, it's ongoing or completed
            if ($sessionDateTime->isPast()) {
                // Consider it completed if it's been more than 3 hours (typical game session duration)
                if ($now->diffInHours($sessionDateTime) >= 3) {
                    return 'completed';
                }
                return 'ongoing';
            }
            // If start time hasn't passed yet, it's upcoming
            return 'upcoming';
        }

        // If session date is in the future, it's upcoming
        return 'upcoming';
    }
}
