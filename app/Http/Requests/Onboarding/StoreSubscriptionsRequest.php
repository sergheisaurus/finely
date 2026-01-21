<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubscriptionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subscriptions' => ['array'],
            'subscriptions.*.name' => ['required', 'string', 'max:255'],
            'subscriptions.*.description' => ['nullable', 'string'],
            'subscriptions.*.amount' => ['required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'subscriptions.*.currency' => ['required', 'string', 'size:3'],
            'subscriptions.*.billing_cycle' => ['required', Rule::in(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])],
            'subscriptions.*.billing_day' => ['nullable', 'integer', 'between:1,31'],
            'subscriptions.*.billing_month' => ['nullable', 'integer', 'between:1,12'],
            'subscriptions.*.start_date' => ['required', 'date'],
            'subscriptions.*.end_date' => ['nullable', 'date', 'after:subscriptions.*.start_date'],
            'subscriptions.*.payment_method_type' => ['required', Rule::in(['bank_account', 'card'])],
            'subscriptions.*.payment_method_id' => ['required', 'integer'],
            'subscriptions.*.category_id' => ['nullable', 'exists:categories,id'],
            'subscriptions.*.merchant_id' => ['nullable', 'exists:merchants,id'],
            'subscriptions.*.is_active' => ['boolean'],
            'subscriptions.*.auto_create_transaction' => ['boolean'],
            'subscriptions.*.color' => ['nullable', 'string'],
            'subscriptions.*.icon' => ['nullable', 'string'],
        ];
    }
}
