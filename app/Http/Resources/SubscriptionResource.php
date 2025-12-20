<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'merchant_id' => $this->merchant_id,
            'category_id' => $this->category_id,
            'payment_method_type' => $this->payment_method_type,
            'payment_method_id' => $this->payment_method_id,
            'name' => $this->name,
            'description' => $this->description,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'billing_cycle' => $this->billing_cycle,
            'billing_day' => $this->billing_day,
            'billing_month' => $this->billing_month,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'last_billed_date' => $this->last_billed_date?->toDateString(),
            'next_billing_date' => $this->next_billing_date?->toDateString(),
            'is_active' => $this->is_active,
            'auto_create_transaction' => $this->auto_create_transaction,
            'reminder_days_before' => $this->reminder_days_before,
            'color' => $this->color,
            'icon' => $this->icon,

            // Computed fields
            'is_overdue' => $this->isOverdue(),
            'is_due_soon' => $this->isDueSoon(),
            'monthly_equivalent' => round($this->getMonthlyEquivalent(), 2),
            'yearly_total' => round($this->getYearlyTotal(), 2),

            // Relationships
            'merchant' => new MerchantResource($this->whenLoaded('merchant')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'payment_method' => $this->whenLoaded('paymentMethod', function () {
                if ($this->payment_method_type === 'bank_account') {
                    return new BankAccountResource($this->paymentMethod);
                } elseif ($this->payment_method_type === 'card') {
                    return new CardResource($this->paymentMethod);
                }

                return null;
            }),

            // Counts
            'transactions_count' => $this->whenCounted('transactions'),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
