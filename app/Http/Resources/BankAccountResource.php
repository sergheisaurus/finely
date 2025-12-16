<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'balance' => (float) $this->balance,
            'currency' => $this->currency,
            'account_number' => $this->account_number,
            'bank_name' => $this->bank_name,
            'color' => $this->color,
            'icon' => $this->icon,
            'is_default' => $this->is_default,
            'cards_count' => $this->whenCounted('cards'),
            'cards' => CardResource::collection($this->whenLoaded('cards')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
