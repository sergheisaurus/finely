<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMerchantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', Rule::in(['company', 'person'])],
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
            $merchant = $this->route('merchant');
            $type = $this->input('type', $merchant?->type);
            $isSecret = $this->has('is_secret')
                ? $this->boolean('is_secret')
                : (bool) $merchant?->is_secret;
            $coverMerchantId = $this->input('cover_merchant_id', $merchant?->cover_merchant_id);

            if (! $isSecret && $coverMerchantId) {
                $validator->errors()->add('cover_merchant_id', 'A cover merchant can only be set for secret merchants.');
            }

            if ($coverMerchantId) {
                $cover = \App\Models\Merchant::find($coverMerchantId);

                if ($merchant && $merchant->id === (int) $coverMerchantId) {
                    $validator->errors()->add('cover_merchant_id', 'A merchant cannot cover itself.');
                }

                if ($cover && $cover->is_secret) {
                    $validator->errors()->add('cover_merchant_id', 'The cover merchant must be a non-secret merchant.');
                }

                if ($cover && $cover->type !== $type) {
                    $validator->errors()->add('cover_merchant_id', 'The cover merchant type must match the merchant type.');
                }
            }
        });
    }
}
