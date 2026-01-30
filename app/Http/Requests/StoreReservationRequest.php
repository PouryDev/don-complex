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
            // Optional order items
            'order_items' => ['nullable', 'array'],
            'order_items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'order_items.*.quantity' => ['required', 'integer', 'min:1'],
            'order_notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'number_of_people.required' => 'تعداد نفرات الزامی است.',
            'number_of_people.min' => 'تعداد نفرات باید حداقل 1 باشد.',
            'number_of_people.max' => 'تعداد نفرات نمی‌تواند بیشتر از 50 باشد.',
            'order_items.*.menu_item_id.required' => 'شناسه آیتم منو الزامی است.',
            'order_items.*.menu_item_id.exists' => 'آیتم منو انتخاب شده معتبر نیست.',
            'order_items.*.quantity.required' => 'تعداد آیتم الزامی است.',
            'order_items.*.quantity.min' => 'تعداد هر آیتم باید حداقل 1 باشد.',
            'order_notes.max' => 'یادداشت سفارش نباید بیشتر از 500 کاراکتر باشد.',
        ];
    }
}
