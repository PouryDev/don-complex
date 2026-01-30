<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom validation messages
     */
    public function messages(): array
    {
        return [
            'items.required' => 'لیست آیتم‌های سفارش الزامی است.',
            'items.min' => 'حداقل یک آیتم برای سفارش لازم است.',
            'items.*.menu_item_id.required' => 'شناسه آیتم منو الزامی است.',
            'items.*.menu_item_id.exists' => 'آیتم منو انتخاب شده معتبر نیست.',
            'items.*.quantity.required' => 'تعداد آیتم الزامی است.',
            'items.*.quantity.min' => 'تعداد هر آیتم باید حداقل 1 باشد.',
            'notes.max' => 'یادداشت نباید بیشتر از 500 کاراکتر باشد.',
        ];
    }
}

