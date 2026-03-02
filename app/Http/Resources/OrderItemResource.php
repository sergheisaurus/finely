<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'name' => $this->name,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'amount' => $this->amount,
            'product_url' => $this->product_url,
            'external_item_id' => $this->external_item_id,
            'ordered_at' => $this->ordered_at?->toDateString(),
            'delivered_at' => $this->delivered_at?->toDateString(),
            'returned_at' => $this->returned_at?->toDateString(),
            'status' => $this->status,
            'sort_order' => $this->sort_order,
            'image_url' => $this->latestImageAsset?->url,
            'image_thumbnail_url' => $this->latestImageAsset?->thumbnail_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
