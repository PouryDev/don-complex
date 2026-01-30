<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FreeTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session' => $this->whenLoaded('session', function () {
                return new SessionResource($this->session);
            }),
            'coins_spent' => $this->coins_spent,
            'purchased_at' => $this->purchased_at?->toISOString(),
            'used_at' => $this->used_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'is_used' => $this->isUsed(),
            'is_valid' => $this->isValid(),
        ];
    }
}


