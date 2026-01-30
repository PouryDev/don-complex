<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoinTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'type' => $this->type,
            'source' => $this->source,
            'description' => $this->description,
            'related' => $this->when($this->related, function () {
                return [
                    'id' => $this->related->id,
                    'type' => class_basename($this->related),
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}


