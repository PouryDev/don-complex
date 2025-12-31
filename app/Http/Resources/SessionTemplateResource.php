<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hall_id' => $this->hall_id,
            'day_of_week' => $this->day_of_week,
            'start_time' => $this->start_time,
            'price' => (float) $this->price,
            'max_participants' => $this->max_participants,
            'is_active' => $this->is_active,
            'hall' => $this->whenLoaded('hall', new HallResource($this->hall)),
        ];
    }
}
