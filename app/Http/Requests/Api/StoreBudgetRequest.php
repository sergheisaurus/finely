<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'currency' => ['required', 'string', 'size:3'],
            'period' => ['required', Rule::in(['monthly', 'quarterly', 'yearly'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'rollover_unused' => ['boolean'],
            'alert_threshold' => ['integer', 'min:0', 'max:100'],
            'is_active' => ['boolean'],
            'color' => ['nullable', 'string', 'max:7'],
            'icon' => ['nullable', 'string', 'max:50'],
        ];
    }
}
