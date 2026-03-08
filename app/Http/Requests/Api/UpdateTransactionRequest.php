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
        $splits = array_values(array_filter(
            $this->input('splits', []),
            fn ($split) => is_array($split)
                && (filled($split['amount'] ?? null) || filled($split['category_id'] ?? null)),
        ));

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

        if ($this->has('splits')) {
            $merged['splits'] = $splits;
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
            'splits' => ['sometimes', 'array'],
            'splits.*.amount' => ['required', 'numeric', 'min:0.01'],
            'splits.*.category_id' => [
                'required',
                Rule::exists('categories', 'id')->where(
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
            $type = $this->input('type', $transaction?->type);
            $amount = (float) $this->input('amount', $transaction?->amount ?? 0);
            $splits = $this->has('splits') ? $this->input('splits', []) : [];

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

            if ($splits !== []) {
                if (! in_array($type, ['expense', 'income'], true)) {
                    $validator->errors()->add('splits', 'Only income and expense transactions can be split.');
                }

                if (! $categoryId) {
                    $validator->errors()->add('category_id', 'Choose a main category before adding splits.');
                }

                $splitTotal = round(array_reduce(
                    $splits,
                    fn (float $total, array $split) => $total + (float) ($split['amount'] ?? 0),
                    0.0,
                ), 2);

                if ($splitTotal >= round($amount, 2)) {
                    $validator->errors()->add('splits', 'Split amounts must leave some of the total on the main category.');
                }

                foreach ($splits as $index => $split) {
                    $splitCategory = isset($split['category_id'])
                        ? Category::find($split['category_id'])
                        : null;

                    if ($splitCategory?->is_secret) {
                        $validator->errors()->add("splits.{$index}.category_id", 'Split categories cannot be secret categories.');
                    }

                    if ($splitCategory && $splitCategory->type !== $type) {
                        $validator->errors()->add("splits.{$index}.category_id", 'Split category type must match the transaction type.');
                    }
                }
            }
        });
    }
}
