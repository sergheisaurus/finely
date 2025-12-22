<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'category_id' => $this->category_id,
            'invoice_number' => $this->invoice_number,
            'reference' => $this->reference,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'issue_date' => $this->issue_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'paid_date' => $this->paid_date?->toDateString(),
            'status' => $this->status,

            // Recurring settings
            'is_recurring' => $this->is_recurring,
            'frequency' => $this->frequency,
            'billing_day' => $this->billing_day,
            'next_due_date' => $this->next_due_date?->toDateString(),
            'times_paid' => $this->times_paid,

            // QR data
            'qr_data' => $this->qr_data,
            'qr_raw_text' => $this->qr_raw_text,
            'creditor_name' => $this->creditor_name,
            'creditor_iban' => $this->creditor_iban,
            'payment_reference' => $this->payment_reference,

            // Notes and visual
            'notes' => $this->notes,
            'color' => $this->color,
            'icon' => $this->icon,

            // Computed fields
            'is_overdue' => $this->isOverdue(),
            'is_pending' => $this->isPending(),
            'is_paid' => $this->isPaid(),
            'days_until_due' => $this->getDaysUntilDue(),
            'days_overdue' => $this->getDaysOverdue(),

            // Relationships
            'merchant' => new MerchantResource($this->whenLoaded('merchant')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'attachments' => InvoiceAttachmentResource::collection($this->whenLoaded('attachments')),

            // Counts
            'items_count' => $this->whenCounted('items'),
            'attachments_count' => $this->whenCounted('attachments'),
            'transactions_count' => $this->whenCounted('transactions'),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
