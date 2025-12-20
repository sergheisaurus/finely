<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bank_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'type' => ['sometimes', Rule::in(['debit', 'credit'])],
            'card_holder_name' => ['sometimes', 'string', 'max:255'],
            'card_number' => ['sometimes', 'string', 'min:13', 'max:19', 'regex:/^\d+$/'],
            'card_network' => ['sometimes', Rule::in(['visa', 'mastercard', 'amex', 'discover', 'other'])],
            'expiry_month' => ['sometimes', 'integer', 'between:1,12'],
            'expiry_year' => ['sometimes', 'integer', 'min:'.date('Y')],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'current_balance' => ['sometimes', 'numeric', 'min:0'],
            'payment_due_day' => ['nullable', 'integer', 'between:1,31'],
            'billing_cycle_day' => ['nullable', 'integer', 'between:1,31'],
            'color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
