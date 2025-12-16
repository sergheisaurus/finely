<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'default_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'default_card_id' => ['nullable', 'exists:cards,id'],
            'currency' => ['sometimes', 'string', 'size:3'],
        ];
    }
}
