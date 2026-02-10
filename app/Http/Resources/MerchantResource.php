<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MerchantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'image_path' => $this->image_path,
            'image_url' => $this->image_path
                ? (filter_var($this->image_path, FILTER_VALIDATE_URL) ? $this->image_path : \Illuminate\Support\Facades\Storage::url($this->image_path))
                : null,
            'transactions_count' => $this->whenCounted('transactions'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
