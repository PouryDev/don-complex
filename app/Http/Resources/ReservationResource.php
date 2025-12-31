<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'session_id' => $this->session_id,
            'number_of_people' => $this->number_of_people,
            'payment_status' => $this->payment_status->value,
            'payment_transaction_id' => $this->payment_transaction_id,
            'validated_at' => $this->validated_at,
            'validated_by' => $this->validated_by,
            'cancelled_at' => $this->cancelled_at,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
            'session' => $this->whenLoaded('session', new SessionResource($this->session)),
            'payment_transaction' => $this->whenLoaded('paymentTransaction', function () {
                return [
                    'id' => $this->paymentTransaction->id,
                    'amount' => (float) $this->paymentTransaction->amount,
                    'gateway' => $this->paymentTransaction->gateway,
                    'status' => $this->paymentTransaction->status->value,
                ];
            }),
        ];
    }
}
