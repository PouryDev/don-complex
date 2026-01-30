<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserDiscountCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'discount_code' => $this->whenLoaded('discountCode', function () {
                return new DiscountCodeResource($this->discountCode);
            }),
            'coins_spent' => $this->coins_spent,
            'purchased_at' => $this->purchased_at?->toISOString(),
            'used_at' => $this->used_at?->toISOString(),
            'is_used' => $this->isUsed(),
            'is_valid' => $this->isValid(),
        ];
    }
}


