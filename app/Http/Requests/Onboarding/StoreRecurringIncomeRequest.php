<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecurringIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'incomes' => ['array'],
            'incomes.*.name' => ['required', 'string', 'max:255'],
            'incomes.*.description' => ['nullable', 'string'],
            'incomes.*.source' => ['nullable', 'string', 'max:255'],
            'incomes.*.amount' => ['required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'incomes.*.currency' => ['required', 'string', 'size:3'],
            'incomes.*.frequency' => ['required', Rule::in(['weekly', 'bi_weekly', 'monthly', 'quarterly', 'yearly'])],
            'incomes.*.payment_day' => ['nullable', 'integer', 'between:1,31'],
            'incomes.*.payment_month' => ['nullable', 'integer', 'between:1,12'],
            'incomes.*.start_date' => ['required', 'date'],
            'incomes.*.end_date' => ['nullable', 'date', 'after:incomes.*.start_date'],
            'incomes.*.to_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'incomes.*.category_id' => ['nullable', 'exists:categories,id'],
            'incomes.*.is_active' => ['boolean'],
            'incomes.*.auto_create_transaction' => ['boolean'],
            'incomes.*.color' => ['nullable', 'string'],
            'incomes.*.icon' => ['nullable', 'string'],
        ];
    }
}
