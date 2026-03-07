<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()->id)
                ),
            ],
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'is_secret' => ['sometimes', 'boolean'],
            'cover_category_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()->id)
                ),
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->parent_id) {
                $parent = \App\Models\Category::find($this->parent_id);
                if ($parent && $parent->type !== $this->type) {
                    $validator->errors()->add('type', 'Sub-category type must match parent category type.');
                }
            }

            if (! $this->boolean('is_secret') && $this->filled('cover_category_id')) {
                $validator->errors()->add('cover_category_id', 'A cover category can only be set for secret categories.');
            }

            if ($this->filled('cover_category_id')) {
                $cover = \App\Models\Category::find($this->cover_category_id);

                if ($cover && $cover->is_secret) {
                    $validator->errors()->add('cover_category_id', 'The cover category must be a non-secret category.');
                }

                if ($cover && $cover->type !== $this->type) {
                    $validator->errors()->add('cover_category_id', 'The cover category type must match the category type.');
                }
            }
        });
    }
}
