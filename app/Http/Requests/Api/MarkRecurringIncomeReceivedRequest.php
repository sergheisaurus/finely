<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class MarkRecurringIncomeReceivedRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'date' => ['sometimes', 'date'],
            'additions' => ['nullable', 'array'],
            'additions.*.name' => ['required', 'string', 'max:255'],
            'additions.*.type' => ['nullable', 'string', 'in:fixed,percentage'],
            'additions.*.value' => ['required', 'numeric', 'min:0'],
            'additions.*.amount' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'array'],
            'deductions.*.name' => ['required', 'string', 'max:255'],
            'deductions.*.type' => ['nullable', 'string', 'in:fixed,percentage'],
            'deductions.*.value' => ['required', 'numeric', 'min:0'],
            'deductions.*.amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
