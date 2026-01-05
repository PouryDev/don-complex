<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'game_masters' => $this->whenLoaded('gameMasters', function () {
                return $this->gameMasters->map(function ($gameMaster) {
                    return [
                        'id' => $gameMaster->id,
                        'name' => $gameMaster->name,
                        'email' => $gameMaster->email,
                    ];
                });
            }),
        ];
    }
}
