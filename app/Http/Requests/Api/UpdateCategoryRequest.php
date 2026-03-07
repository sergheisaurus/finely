<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'type' => ['sometimes', Rule::in(['income', 'expense'])],
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
            $category = $this->route('category');
            $type = $this->input('type', $category?->type);
            $isSecret = $this->has('is_secret')
                ? $this->boolean('is_secret')
                : (bool) $category?->is_secret;
            $parentId = $this->input('parent_id', $category?->parent_id);
            $coverCategoryId = $this->input('cover_category_id', $category?->cover_category_id);

            if ($parentId) {
                $parent = \App\Models\Category::find($parentId);

                if ($category && $category->id === (int) $parentId) {
                    $validator->errors()->add('parent_id', 'A category cannot be its own parent.');
                }

                if ($parent && $parent->type !== $type) {
                    $validator->errors()->add('type', 'Sub-category type must match parent category type.');
                }
            }

            if (! $isSecret && $coverCategoryId) {
                $validator->errors()->add('cover_category_id', 'A cover category can only be set for secret categories.');
            }

            if ($coverCategoryId) {
                $cover = \App\Models\Category::find($coverCategoryId);

                if ($category && $category->id === (int) $coverCategoryId) {
                    $validator->errors()->add('cover_category_id', 'A category cannot cover itself.');
                }

                if ($cover && $cover->is_secret) {
                    $validator->errors()->add('cover_category_id', 'The cover category must be a non-secret category.');
                }

                if ($cover && $cover->type !== $type) {
                    $validator->errors()->add('cover_category_id', 'The cover category type must match the category type.');
                }
            }
        });
    }
}
