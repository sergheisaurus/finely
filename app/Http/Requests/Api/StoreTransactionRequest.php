<?php

namespace App\Http\Requests\Api;

use App\Models\Category;
use App\Models\Merchant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    public function prepareForValidation(): void
    {
        $secretCategory = $this->secret_category_id
            ? Category::find($this->secret_category_id)
            : null;
        $secretMerchant = $this->secret_merchant_id
            ? Merchant::find($this->secret_merchant_id)
            : null;

        $hasSecretDetails = filled($this->secret_title)
            || $secretCategory !== null
            || $secretMerchant !== null;

        $fallbackTitle = match ($this->input('type')) {
            'income' => 'Private income',
            'transfer' => 'Private transfer',
            'card_payment' => 'Private card payment',
            default => 'Private transaction',
        };

        $this->merge([
            'title' => filled($this->title) ? $this->title : ($hasSecretDetails ? $fallbackTitle : $this->title),
            'category_id' => $this->category_id ?: $secretCategory?->cover_category_id,
            'merchant_id' => $this->merchant_id ?: $secretMerchant?->cover_merchant_id,
        ]);
    }

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
            'category_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()->id)
                ),
            ],
            'merchant_id' => [
                'nullable',
                Rule::exists('merchants', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()->id)
                ),
            ],
            'secret_title' => ['nullable', 'string', 'max:255'],
            'secret_category_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()->id)
                ),
            ],
            'secret_merchant_id' => [
                'nullable',
                Rule::exists('merchants', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()->id)
                ),
            ],
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

            $category = $this->category_id ? Category::find($this->category_id) : null;
            $secretCategory = $this->secret_category_id ? Category::find($this->secret_category_id) : null;
            $merchant = $this->merchant_id ? Merchant::find($this->merchant_id) : null;
            $secretMerchant = $this->secret_merchant_id ? Merchant::find($this->secret_merchant_id) : null;

            if ($category?->is_secret) {
                $validator->errors()->add('category_id', 'Use the secret category field for secret categories.');
            }

            if ($secretCategory && ! $secretCategory->is_secret) {
                $validator->errors()->add('secret_category_id', 'The secret category must be marked as secret.');
            }

            if ($category && $secretCategory && $category->type !== $secretCategory->type) {
                $validator->errors()->add('secret_category_id', 'The cover category and secret category must have the same type.');
            }

            if ($merchant?->is_secret) {
                $validator->errors()->add('merchant_id', 'Use the secret merchant field for secret merchants.');
            }

            if ($secretMerchant && ! $secretMerchant->is_secret) {
                $validator->errors()->add('secret_merchant_id', 'The secret merchant must be marked as secret.');
            }

            if ($merchant && $secretMerchant && $merchant->type !== $secretMerchant->type) {
                $validator->errors()->add('secret_merchant_id', 'The cover merchant and secret merchant must have the same type.');
            }
        });
    }
}
