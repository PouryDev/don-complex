<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // session_id is not needed here because it comes from the route parameter
            'number_of_people' => ['required', 'integer', 'min:1', 'max:50'],
        ];
    }
}
