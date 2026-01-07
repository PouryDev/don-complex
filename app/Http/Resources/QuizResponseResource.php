<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizResponseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'quiz_id' => $this->quiz_id,
            'answers' => $this->answers,
            'score' => $this->score,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
