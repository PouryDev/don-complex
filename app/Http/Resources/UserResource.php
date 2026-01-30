<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role->value,
            'branch' => $this->whenLoaded('branch', new BranchResource($this->branch)),
            'coin_balance' => $this->when($this->relationLoaded('coin'), function () {
                return $this->coin->balance;
            }, function () {
                // Lazy load if not already loaded
                $coin = $this->coin;
                return $coin ? $coin->balance : 0;
            }),
        ];
    }
}

