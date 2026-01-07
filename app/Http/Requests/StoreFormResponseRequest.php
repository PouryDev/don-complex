<?php

namespace App\Http\Requests;

use App\Models\Form;
use Illuminate\Foundation\Http\FormRequest;

class StoreFormResponseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'data' => ['required', 'array'],
        ];

        // Get the form from route parameter
        $form = $this->route('form');
        
        if ($form && isset($form->fields) && is_array($form->fields)) {
            foreach ($form->fields as $field) {
                $fieldName = $field['name'] ?? null;
                if ($fieldName) {
                    $fieldRules = [];
                    
                    // Check if field is required
                    if (isset($field['required']) && $field['required']) {
                        $fieldRules[] = 'required';
                    } else {
                        $fieldRules[] = 'nullable';
                    }
                    
                    // Add type-specific validation
                    $fieldType = $field['type'] ?? 'text';
                    switch ($fieldType) {
                        case 'email':
                            $fieldRules[] = 'email';
                            break;
                        case 'number':
                            $fieldRules[] = 'numeric';
                            break;
                        case 'textarea':
                        case 'text':
                        default:
                            $fieldRules[] = 'string';
                            break;
                    }
                    
                    $rules["data.{$fieldName}"] = $fieldRules;
                }
            }
        }

        return $rules;
    }
}
