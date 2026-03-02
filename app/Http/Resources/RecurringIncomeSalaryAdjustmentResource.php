<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecurringIncomeSalaryAdjustmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'recurring_income_id' => $this->recurring_income_id,
            'effective_date' => $this->effective_date?->toDateString(),
            'gross_amount' => $this->gross_amount,
            'net_amount' => $this->net_amount,
            'deduction_rules' => $this->deduction_rules ?? [],
            'deduction_amount_total' => round((float) \collect($this->deduction_rules ?? [])->sum(function (array $rule): float {
                $type = $rule['type'] ?? ((isset($rule['fixed_amount']) && (float) $rule['fixed_amount'] > 0) ? 'fixed' : 'percent');

                if ($type === 'fixed') {
                    return (float) ($rule['fixed_amount'] ?? 0);
                }

                return (float) $this->gross_amount * ((float) ($rule['percent'] ?? 0) / 100);
            }), 2),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
