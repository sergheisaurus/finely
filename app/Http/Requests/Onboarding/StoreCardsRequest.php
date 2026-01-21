<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCardsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cards' => ['array'],
            'cards.*.bank_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'cards.*.type' => ['required', Rule::in(['debit', 'credit'])],
            'cards.*.card_holder_name' => ['required', 'string', 'max:255'],
            'cards.*.card_number' => ['required', 'string', 'min:13', 'max:19'],
            'cards.*.card_network' => ['required', Rule::in(['visa', 'mastercard', 'amex', 'discover', 'other'])],
            'cards.*.expiry_month' => ['required', 'integer', 'between:1,12'],
            'cards.*.expiry_year' => ['required', 'integer', 'min:'.date('Y')],
            'cards.*.credit_limit' => ['nullable', 'numeric', 'min:0'],
            'cards.*.current_balance' => ['nullable', 'numeric', 'min:0'],
            'cards.*.color' => ['sometimes', 'string'],
        ];
    }
}
