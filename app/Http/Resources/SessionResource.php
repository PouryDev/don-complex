<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
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
            'available_spots' => $this->max_participants - $this->current_participants - ($this->pending_participants ?? 0),
            'status' => $this->status->value,
            'branch' => $this->whenLoaded('branch', new BranchResource($this->branch)),
            'hall' => $this->whenLoaded('hall', new HallResource($this->hall)),
            'session_template' => $this->whenLoaded('sessionTemplate', new SessionTemplateResource($this->sessionTemplate)),
        ];
    }
}
