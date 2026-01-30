<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoinResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'balance' => $this->balance,
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}


