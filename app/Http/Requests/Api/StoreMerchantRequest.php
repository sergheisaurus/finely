<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMerchantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['company', 'person'])],
            'image_path' => ['nullable', 'string', 'max:2048'],
            'is_secret' => ['sometimes', 'boolean'],
            'cover_merchant_id' => [
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
            if (! $this->boolean('is_secret') && $this->filled('cover_merchant_id')) {
                $validator->errors()->add('cover_merchant_id', 'A cover merchant can only be set for secret merchants.');
            }

            if ($this->filled('cover_merchant_id')) {
                $cover = \App\Models\Merchant::find($this->cover_merchant_id);

                if ($cover && $cover->is_secret) {
                    $validator->errors()->add('cover_merchant_id', 'The cover merchant must be a non-secret merchant.');
                }

                if ($cover && $cover->type !== $this->type) {
                    $validator->errors()->add('cover_merchant_id', 'The cover merchant type must match the merchant type.');
                }
            }
        });
    }
}
