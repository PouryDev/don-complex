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
            'game_master_id' => $this->game_master_id,
            'game_master' => $this->whenLoaded('gameMaster', function () {
                return [
                    'id' => $this->gameMaster->id,
                    'name' => $this->gameMaster->name,
                    'email' => $this->gameMaster->email,
                ];
            }),
        ];
    }
}
