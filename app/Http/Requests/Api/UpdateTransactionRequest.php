<?php

namespace App\Http\Requests\Api;

use App\Models\Category;
use App\Models\Merchant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends FormRequest
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

        $fallbackTitle = match ($this->input('type', $this->route('transaction')?->type)) {
            'income' => 'Private income',
            'transfer' => 'Private transfer',
            'card_payment' => 'Private card payment',
            default => 'Private transaction',
        };

        $merged = [];

        if ($this->has('title') && ! filled($this->title) && $hasSecretDetails) {
            $merged['title'] = $fallbackTitle;
        }

        if (! $this->filled('category_id') && $secretCategory?->cover_category_id) {
            $merged['category_id'] = $secretCategory->cover_category_id;
        }

        if (! $this->filled('merchant_id') && $secretMerchant?->cover_merchant_id) {
            $merged['merchant_id'] = $secretMerchant->cover_merchant_id;
        }

        if ($merged !== []) {
            $this->merge($merged);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['sometimes', Rule::in(['income', 'expense', 'transfer', 'card_payment'])],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'transaction_date' => ['sometimes', 'date'],
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
            $transaction = $this->route('transaction');

            $categoryId = $this->has('category_id')
                ? $this->input('category_id')
                : $transaction?->category_id;
            $secretCategoryId = $this->has('secret_category_id')
                ? $this->input('secret_category_id')
                : $transaction?->secret_category_id;
            $merchantId = $this->has('merchant_id')
                ? $this->input('merchant_id')
                : $transaction?->merchant_id;
            $secretMerchantId = $this->has('secret_merchant_id')
                ? $this->input('secret_merchant_id')
                : $transaction?->secret_merchant_id;

            $category = $categoryId ? Category::find($categoryId) : null;
            $secretCategory = $secretCategoryId ? Category::find($secretCategoryId) : null;
            $merchant = $merchantId ? Merchant::find($merchantId) : null;
            $secretMerchant = $secretMerchantId ? Merchant::find($secretMerchantId) : null;

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
