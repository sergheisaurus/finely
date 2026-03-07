<?php

namespace App\Http\Resources;

use App\Support\SecretMode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MerchantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isSecretMode = SecretMode::isActive($request);

        if ($this->is_secret && ! $isSecretMode) {
            if ($this->cover_merchant_id) {
                return [
                    'id' => $this->id,
                    'name' => $this->coverMerchant->name ?? 'Covered',
                    'type' => $this->coverMerchant->type ?? 'company',
                    'image_path' => null,
                    'image_url' => null,
                    'is_secret' => true,
                ];
            }
            return ['id' => $this->id, 'name' => 'Hidden Merchant', 'is_secret' => true];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'image_path' => $this->image_path,
            'image_url' => $this->image_path
                ? (filter_var($this->image_path, FILTER_VALIDATE_URL) ? $this->image_path : \Illuminate\Support\Facades\Storage::url($this->image_path))
                : null,
            'is_secret' => $this->is_secret,
            'cover_merchant_id' => $this->cover_merchant_id,
            'transactions_count' => $this->whenCounted('transactions'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
