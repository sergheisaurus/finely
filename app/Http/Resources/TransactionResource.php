<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'title' => $this->title,
            'description' => $this->description,
            'transaction_date' => $this->transaction_date->format('Y-m-d'),
            'from_account_id' => $this->from_account_id,
            'from_card_id' => $this->from_card_id,
            'to_account_id' => $this->to_account_id,
            'to_card_id' => $this->to_card_id,
            'category_id' => $this->category_id,
            'merchant_id' => $this->merchant_id,
            'from_account' => new BankAccountResource($this->whenLoaded('fromAccount')),
            'from_card' => new CardResource($this->whenLoaded('fromCard')),
            'to_account' => new BankAccountResource($this->whenLoaded('toAccount')),
            'to_card' => new CardResource($this->whenLoaded('toCard')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'merchant' => new MerchantResource($this->whenLoaded('merchant')),
            'attachments' => TransactionAttachmentResource::collection($this->whenLoaded('attachments')),
            'attachments_count' => $this->whenCounted('attachments'),
            'transactionable_type' => $this->transactionable_type,
            'transactionable_id' => $this->transactionable_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
