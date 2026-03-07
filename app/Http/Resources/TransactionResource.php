<?php

namespace App\Http\Resources;

use App\Support\SecretMode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isSecretMode = SecretMode::isActive($request);
        $hasSecretDetails = $this->resource->hasSecretDetails();

        $title = $this->title;
        $categoryId = $this->category_id;
        $merchantId = $this->merchant_id;
        $category = new CategoryResource($this->whenLoaded('category'));
        $merchant = new MerchantResource($this->whenLoaded('merchant'));

        if ($isSecretMode) {
            if ($hasSecretDetails && $this->secret_title) {
                $title = $this->secret_title;
            }

            if ($hasSecretDetails && $this->secret_category_id) {
                $categoryId = $this->secret_category_id;
                $category = new CategoryResource($this->whenLoaded('secretCategory'));
            }

            if ($hasSecretDetails && $this->secret_merchant_id) {
                $merchantId = $this->secret_merchant_id;
                $merchant = new MerchantResource($this->whenLoaded('secretMerchant'));
            }
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'title' => $title, // Possibly swapped
            'description' => $this->description,
            'transaction_date' => $this->transaction_date->format('Y-m-d'),
            
            'from_account_id' => $this->from_account_id,
            'from_card_id' => $this->from_card_id,
            'to_account_id' => $this->to_account_id,
            'to_card_id' => $this->to_card_id,
            
            'category_id' => $categoryId,
            'merchant_id' => $merchantId,
            
            'from_account' => new BankAccountResource($this->whenLoaded('fromAccount')),
            'from_card' => new CardResource($this->whenLoaded('fromCard')),
            'to_account' => new BankAccountResource($this->whenLoaded('toAccount')),
            'to_card' => new CardResource($this->whenLoaded('toCard')),
            
            'category' => $category,
            'merchant' => $merchant,
            'is_secret' => $hasSecretDetails,
            
            'real_title' => $this->title,
            'secret_title' => $isSecretMode ? $this->secret_title : null,
            'real_category_id' => $this->category_id,
            'secret_category_id' => $isSecretMode ? $this->secret_category_id : null,
            'real_merchant_id' => $this->merchant_id,
            'secret_merchant_id' => $isSecretMode ? $this->secret_merchant_id : null,

            'attachments' => TransactionAttachmentResource::collection($this->whenLoaded('attachments')),
            'attachments_count' => $this->whenCounted('attachments'),
            'transactionable_type' => $this->transactionable_type,
            'transactionable_id' => $this->transactionable_id,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
