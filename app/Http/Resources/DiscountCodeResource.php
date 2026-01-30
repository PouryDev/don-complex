<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiscountCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'value' => (float) $this->value,
            'min_order_amount' => $this->min_order_amount ? (float) $this->min_order_amount : null,
            'max_uses' => $this->max_uses,
            'used_count' => $this->used_count,
            'expires_at' => $this->expires_at?->toISOString(),
            'is_active' => $this->is_active,
            'coins_cost' => $this->coins_cost,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}


