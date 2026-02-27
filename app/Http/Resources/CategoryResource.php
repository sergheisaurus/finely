<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isSecretMode = $request->header('X-Secret-Mode') === 'true';

        // If it's a secret category and we aren't in secret mode, return the cover instead (if requested directly)
        if ($this->is_secret && !$isSecretMode) {
            if ($this->cover_category_id) {
                // Ideally this shouldn't happen during a collection if they are filtered out, 
                // but for direct lookups, mimic the cover.
                return [
                    'id' => $this->id,
                    'parent_id' => $this->coverCategory->parent_id ?? null,
                    'name' => $this->coverCategory->name ?? 'Covered',
                    'icon' => $this->coverCategory->icon ?? 'Shield',
                    'color' => $this->coverCategory->color ?? '#9ca3af',
                    'type' => $this->type,
                    'is_parent' => true,
                    'is_secret' => true, // Still let UI know it's a secret entity underneath though masked
                    'parent' => null,
                    'children' => [],
                ];
            }

            return ['id' => $this->id, 'name' => 'Hidden Category', 'is_secret' => true];
        }

        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'icon' => $this->icon,
            'color' => $this->color,
            'type' => $this->type,
            'is_secret' => $this->is_secret,
            'cover_category_id' => $this->cover_category_id,
            'is_parent' => $this->isParent(),
            'parent' => new CategoryResource($this->whenLoaded('parent')),
            'children' => CategoryResource::collection($this->whenLoaded('children')),
            'transactions_count' => $this->whenCounted('transactions'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
