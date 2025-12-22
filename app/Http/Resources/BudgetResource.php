<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'period' => $this->period,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'current_period_start' => $this->current_period_start?->toDateString(),
            'current_period_end' => $this->current_period_end?->toDateString(),
            'current_period_spent' => $this->current_period_spent,
            'rollover_unused' => $this->rollover_unused,
            'rollover_amount' => $this->rollover_amount,
            'alert_threshold' => $this->alert_threshold,
            'alert_sent' => $this->alert_sent,
            'is_active' => $this->is_active,
            'color' => $this->color,
            'icon' => $this->icon,

            // Computed fields
            'effective_budget' => round($this->getEffectiveBudget(), 2),
            'remaining_amount' => round($this->getRemainingAmount(), 2),
            'spent_percentage' => round($this->getSpentPercentage(), 1),
            'is_over_budget' => $this->isOverBudget(),
            'is_near_limit' => $this->isNearLimit(),
            'budget_health' => $this->getBudgetHealth(),
            'health_color' => $this->getHealthColor(),
            'daily_avg_spent' => round($this->getDailyAverageSpent(), 2),
            'daily_avg_remaining' => round($this->getDailyAverageRemaining(), 2),
            'days_left_in_period' => $this->getDaysLeftInPeriod(),
            'projected_spending' => round($this->getProjectedSpending(), 2),
            'will_exceed' => $this->willExceedBudget(),

            // Relationships
            'category' => new CategoryResource($this->whenLoaded('category')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
