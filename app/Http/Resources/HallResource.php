<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HallResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'name' => $this->name,
            'capacity' => $this->capacity,
            'branch' => $this->whenLoaded('branch', new BranchResource($this->branch)),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
