<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'merchant_id' => ['nullable', 'exists:merchants,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'payment_method_type' => ['nullable', Rule::in(['bank_account', 'card'])],
            'payment_method_id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'currency' => ['required', 'string', 'size:3'],
            'billing_cycle' => ['required', Rule::in(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])],
            'billing_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'billing_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'is_active' => ['boolean'],
            'auto_create_transaction' => ['boolean'],
            'reminder_days_before' => ['integer', 'min:0', 'max:30'],
            'color' => ['nullable', 'string', 'max:7'],
            'icon' => ['nullable', 'string', 'max:50'],
        ];
    }
}
