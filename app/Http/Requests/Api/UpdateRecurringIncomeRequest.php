<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecurringIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            'to_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'source' => ['nullable', 'string', 'max:255'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'currency' => ['sometimes', 'required', 'string', 'size:3'],
            'frequency' => ['sometimes', 'required', Rule::in(['weekly', 'bi_weekly', 'monthly', 'quarterly', 'yearly'])],
            'payment_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'payment_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'is_active' => ['boolean'],
            'auto_create_transaction' => ['boolean'],
            'reminder_days_before' => ['integer', 'min:0', 'max:30'],
            'color' => ['nullable', 'string', 'max:7'],
            'icon' => ['nullable', 'string', 'max:50'],
        ];
    }
}
