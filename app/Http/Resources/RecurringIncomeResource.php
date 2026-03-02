<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecurringIncomeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $grossAmount = (float) $this->amount;

        $computedAdditions = [];
        $totalAdditions = 0.0;
        foreach ((array) ($this->additions ?? []) as $addition) {
            $type = $addition['type'] ?? 'fixed';
            $value = (float) ($addition['value'] ?? $addition['amount'] ?? 0);
            $amount = $type === 'percentage'
                ? $grossAmount * ($value / 100)
                : $value;

            $computedAdditions[] = [
                'name' => $addition['name'] ?? '',
                'type' => $type,
                'value' => $value,
                'amount' => round($amount, 2),
            ];
            $totalAdditions += $amount;
        }

        $baseForDeductions = $grossAmount + $totalAdditions;
        $deductionPercentTotal = 0.0;
        $deductionFixedTotal = 0.0;
        $computedDeductions = [];

        foreach ((array) ($this->deductions ?? []) as $deduction) {
            $type = $deduction['type'] ?? 'fixed';
            $value = (float) ($deduction['value'] ?? $deduction['amount'] ?? 0);
            $amount = $type === 'percentage'
                ? $baseForDeductions * ($value / 100)
                : $value;

            if ($type === 'percentage') {
                $deductionPercentTotal += $amount;
            } else {
                $deductionFixedTotal += $amount;
            }

            $computedDeductions[] = [
                'name' => $deduction['name'] ?? '',
                'type' => $type,
                'value' => $value,
                'amount' => round($amount, 2),
            ];
        }

        $deductionAmountTotal = $deductionPercentTotal + $deductionFixedTotal;

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
            'is_salary' => (bool) $this->is_salary,
            'gross_amount' => $this->gross_amount,
            'deduction_rules' => $this->deduction_rules ?? [],
            'reminder_days_before' => $this->reminder_days_before,
            'color' => $this->color,
            'icon' => $this->icon,
            'deductions' => $this->deductions,

            // Computed fields
            'is_overdue' => $this->isOverdue(),
            'is_expected_soon' => $this->isExpectedSoon(),
            'monthly_equivalent' => round($this->getMonthlyEquivalent(), 2),
            'yearly_total' => round($this->getYearlyTotal(), 2),
            'deduction_percent_total' => round($deductionPercentTotal, 2),
            'deduction_fixed_total' => round($deductionFixedTotal, 2),
            'deduction_amount_total' => round($deductionAmountTotal, 2),
            'deduction_breakdown' => [
                'gross_amount' => round($grossAmount, 2),
                'total_additions' => round($totalAdditions, 2),
                'total_deductions' => round($deductionAmountTotal, 2),
                'net_amount' => round($grossAmount + $totalAdditions - $deductionAmountTotal, 2),
                'additions' => $computedAdditions,
                'deductions' => $computedDeductions,
            ],
            'expected_net_from_gross' => $this->is_salary
                ? round($this->getNetAmount(), 2)
                : null,

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
