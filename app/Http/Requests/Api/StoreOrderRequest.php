<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
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
            'provider' => ['nullable', 'string', 'max:50'],
            'order_site' => ['nullable', 'string', 'max:120'],
            'order_number' => ['nullable', 'string', 'max:120'],
            'order_url' => ['nullable', 'url', 'max:2048'],
            'ordered_at' => ['required', 'date'],
            'delivered_at' => ['nullable', 'date'],
            'status' => ['required', 'string', Rule::in(['placed', 'shipped', 'delivered', 'cancelled', 'returned', 'partial'])],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'source_currency' => ['nullable', 'string', 'size:3'],
            'fx_rate' => ['nullable', 'numeric', 'min:0'],
            'fx_fee_amount' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],

            // Items
            'items' => ['nullable', 'array', 'max:200'],
            'items.*.name' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.product_url' => ['nullable', 'url', 'max:2048'],
            'items.*.external_item_id' => ['nullable', 'string', 'max:100'],
            'items.*.ordered_at' => ['nullable', 'date'],
            'items.*.delivered_at' => ['nullable', 'date'],
            'items.*.returned_at' => ['nullable', 'date'],
            'items.*.status' => ['nullable', 'string', Rule::in(['ordered', 'shipped', 'delivered', 'returned', 'cancelled'])],
            'items.*.sort_order' => ['nullable', 'integer', 'min:0'],

            // Transaction options
            'create_transaction' => ['sometimes', 'boolean'],
            'link_transaction_id' => ['nullable', 'integer', 'min:1'],
            'transaction' => ['nullable', 'array'],
            'transaction.from_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'transaction.from_card_id' => ['nullable', 'exists:cards,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $create = (bool) $this->input('create_transaction', false);
            $linkId = $this->input('link_transaction_id');

            if ($create && $linkId) {
                $validator->errors()->add('link_transaction_id', 'Choose either to create a transaction or link an existing one.');
            }
        });
    }
}
