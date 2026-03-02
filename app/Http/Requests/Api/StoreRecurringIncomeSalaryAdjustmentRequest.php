<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecurringIncomeSalaryAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'effective_date' => ['required', 'date'],
            'gross_amount' => ['required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'deduction_rules' => ['nullable', 'array'],
            'deduction_rules.*.name' => ['required_with:deduction_rules', 'string', 'max:100'],
            'deduction_rules.*.type' => ['nullable', Rule::in(['percent', 'fixed'])],
            'deduction_rules.*.percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'deduction_rules.*.fixed_amount' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'notes' => ['nullable', 'string', 'max:255'],
            'apply_to_income' => ['nullable', 'boolean'],
        ];
    }
}
