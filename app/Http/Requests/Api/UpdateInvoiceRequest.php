<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInvoiceRequest extends FormRequest
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
            'invoice_number' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'currency' => ['sometimes', 'required', 'string', 'size:3'],
            'issue_date' => ['sometimes', 'required', 'date'],
            'due_date' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::in(['pending', 'paid', 'overdue', 'cancelled'])],

            // Recurring settings
            'is_recurring' => ['boolean'],
            'frequency' => ['nullable', Rule::in(['monthly', 'quarterly', 'yearly'])],
            'billing_day' => ['nullable', 'integer', 'min:1', 'max:31'],

            // QR data
            'qr_data' => ['nullable', 'array'],
            'qr_raw_text' => ['nullable', 'string'],
            'creditor_name' => ['nullable', 'string', 'max:255'],
            'creditor_iban' => ['nullable', 'string', 'max:34'],
            'payment_reference' => ['nullable', 'string', 'max:255'],

            // Notes and visual
            'notes' => ['nullable', 'string', 'max:2000'],
            'color' => ['nullable', 'string', 'max:7'],
            'icon' => ['nullable', 'string', 'max:50'],

            // Line items
            'items' => ['nullable', 'array'],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['nullable', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
