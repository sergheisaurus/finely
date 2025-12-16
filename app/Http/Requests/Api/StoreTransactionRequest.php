<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['income', 'expense', 'transfer', 'card_payment'])],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'transaction_date' => ['required', 'date'],
            'from_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'from_card_id' => ['nullable', 'exists:cards,id'],
            'to_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'to_card_id' => ['nullable', 'exists:cards,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'merchant_id' => ['nullable', 'exists:merchants,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $type = $this->type;

            if ($type === 'expense') {
                if (! $this->from_account_id && ! $this->from_card_id) {
                    $validator->errors()->add('from_account_id', 'Expense requires a source account or card.');
                }
            }

            if ($type === 'income') {
                if (! $this->to_account_id) {
                    $validator->errors()->add('to_account_id', 'Income requires a destination account.');
                }
            }

            if ($type === 'transfer') {
                if (! $this->from_account_id) {
                    $validator->errors()->add('from_account_id', 'Transfer requires a source account.');
                }
                if (! $this->to_account_id) {
                    $validator->errors()->add('to_account_id', 'Transfer requires a destination account.');
                }
                if ($this->from_account_id && $this->from_account_id === $this->to_account_id) {
                    $validator->errors()->add('to_account_id', 'Cannot transfer to the same account.');
                }
            }

            if ($type === 'card_payment') {
                if (! $this->from_account_id) {
                    $validator->errors()->add('from_account_id', 'Card payment requires a source account.');
                }
                if (! $this->to_card_id) {
                    $validator->errors()->add('to_card_id', 'Card payment requires a credit card.');
                }
            }
        });
    }
}
