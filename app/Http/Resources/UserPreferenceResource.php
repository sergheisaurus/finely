<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserPreferenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'default_account_id' => $this->default_account_id,
            'default_card_id' => $this->default_card_id,
            'currency' => $this->currency,
            'default_account' => new BankAccountResource($this->whenLoaded('defaultAccount')),
            'default_card' => new CardResource($this->whenLoaded('defaultCard')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
