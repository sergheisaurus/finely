<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bank_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'type' => ['required', Rule::in(['debit', 'credit'])],
            'card_holder_name' => ['required', 'string', 'max:255'],
            'last_four_digits' => ['required', 'string', 'size:4', 'regex:/^\d{4}$/'],
            'card_network' => ['required', Rule::in(['visa', 'mastercard', 'amex', 'discover', 'other'])],
            'expiry_month' => ['required', 'integer', 'between:1,12'],
            'expiry_year' => ['required', 'integer', 'min:'.date('Y')],
            'credit_limit' => ['nullable', 'required_if:type,credit', 'numeric', 'min:0'],
            'current_balance' => ['sometimes', 'numeric', 'min:0'],
            'payment_due_day' => ['nullable', 'integer', 'between:1,31'],
            'billing_cycle_day' => ['nullable', 'integer', 'between:1,31'],
            'color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->type === 'debit' && ! $this->bank_account_id) {
                $validator->errors()->add('bank_account_id', 'A debit card must be linked to a bank account.');
            }
        });
    }
}
