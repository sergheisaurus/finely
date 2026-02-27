<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isSecretMode = $request->header('X-Secret-Mode') === 'true';

        $title = $this->title;
        $categoryId = $this->category_id;
        $merchantId = $this->merchant_id;
        $category = new CategoryResource($this->whenLoaded('category'));
        $merchant = new MerchantResource($this->whenLoaded('merchant'));

        // If not in secret mode, check if we need to mask this transaction
        if (!$isSecretMode) {
            if ($this->secret_title) {
                // Mask the title (e.g. "Sex Toy" -> "Amazon Purchase")
                $title = $this->title; // the real title is actually the clean one, secret_title is the dirty one
            }
            if ($this->secret_category_id) {
                // The transaction is logged under a clean category, but secretly belongs to another
                $categoryId = $this->category_id;
            }
            if ($this->secret_merchant_id) {
                $merchantId = $this->merchant_id;
            }
        } else {
            // We ARE in secret mode. Show the secret details!
            if ($this->secret_title) {
                $title = $this->secret_title; // Reveal dirty title
            }
            if ($this->secret_category_id) {
                $categoryId = $this->secret_category_id;
                $category = new CategoryResource($this->whenLoaded('secretCategory'));
            }
            if ($this->secret_merchant_id) {
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
            
            // Raw database fields for the edit form when in secret mode
            'real_title' => $this->title,
            'secret_title' => $this->secret_title,
            'real_category_id' => $this->category_id,
            'secret_category_id' => $this->secret_category_id,
            'real_merchant_id' => $this->merchant_id,
            'secret_merchant_id' => $this->secret_merchant_id,

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
