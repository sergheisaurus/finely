<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'category_id' => $this->category_id,
            'provider' => $this->provider,
            'order_site' => $this->order_site,
            'order_number' => $this->order_number,
            'order_url' => $this->order_url,
            'ordered_at' => $this->ordered_at?->toDateString(),
            'delivered_at' => $this->delivered_at?->toDateString(),
            'status' => $this->status,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'source_currency' => $this->source_currency,
            'fx_rate' => $this->fx_rate,
            'fx_fee_amount' => $this->fx_fee_amount,
            'notes' => $this->notes,

            // Relationships
            'merchant' => new MerchantResource($this->whenLoaded('merchant')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),

            // Counts
            'items_count' => $this->whenCounted('items'),
            'transactions_count' => $this->whenCounted('transactions'),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
