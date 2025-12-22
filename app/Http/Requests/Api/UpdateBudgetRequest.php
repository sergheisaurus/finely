<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'currency' => ['sometimes', 'required', 'string', 'size:3'],
            'period' => ['sometimes', 'required', Rule::in(['monthly', 'quarterly', 'yearly'])],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'rollover_unused' => ['boolean'],
            'alert_threshold' => ['integer', 'min:0', 'max:100'],
            'is_active' => ['boolean'],
            'color' => ['nullable', 'string', 'max:7'],
            'icon' => ['nullable', 'string', 'max:50'],
        ];
    }
}
