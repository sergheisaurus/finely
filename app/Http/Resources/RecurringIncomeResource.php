<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecurringIncomeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'to_account_id' => $this->to_account_id,
            'name' => $this->name,
            'description' => $this->description,
            'source' => $this->source,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'frequency' => $this->frequency,
            'payment_day' => $this->payment_day,
            'payment_month' => $this->payment_month,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'last_received_date' => $this->last_received_date?->toDateString(),
            'next_expected_date' => $this->next_expected_date?->toDateString(),
            'is_active' => $this->is_active,
            'auto_create_transaction' => $this->auto_create_transaction,
            'reminder_days_before' => $this->reminder_days_before,
            'color' => $this->color,
            'icon' => $this->icon,

            // Computed fields
            'is_overdue' => $this->isOverdue(),
            'is_expected_soon' => $this->isExpectedSoon(),
            'monthly_equivalent' => round($this->getMonthlyEquivalent(), 2),
            'yearly_total' => round($this->getYearlyTotal(), 2),

            // Relationships
            'category' => new CategoryResource($this->whenLoaded('category')),
            'to_account' => new BankAccountResource($this->whenLoaded('toAccount')),

            // Counts
            'transactions_count' => $this->whenCounted('transactions'),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
