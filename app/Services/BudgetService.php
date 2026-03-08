<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\DB;

class BudgetService
{
    /**
     * Create a new budget.
     */
    public function create(array $data): Budget
    {
        return DB::transaction(function () use ($data) {
            $budget = new Budget($data);

            // Calculate initial period
            $period = $budget->calculateCurrentPeriod();
            $budget->current_period_start = $period['start'];
            $budget->current_period_end = $period['end'];

            // Calculate initial spending for the period
            $budget->save();
            $budget->current_period_spent = $this->calculateSpending(
                $budget,
                $period['start'],
                $period['end']
            );
            $budget->save();

            return $budget;
        });
    }

    /**
     * Update an existing budget.
     */
    public function update(Budget $budget, array $data): Budget
    {
        return DB::transaction(function () use ($budget, $data) {
            $budget->fill($data);

            // Recalculate period if relevant fields changed
            if ($budget->isDirty(['period', 'start_date'])) {
                $period = $budget->calculateCurrentPeriod();
                $budget->current_period_start = $period['start'];
                $budget->current_period_end = $period['end'];

                // Recalculate spending for new period
                $budget->current_period_spent = $this->calculateSpending(
                    $budget,
                    $period['start'],
                    $period['end']
                );

                // Reset alert for new period
                $budget->alert_sent = false;
            }

            // If category changed, recalculate spending
            if ($budget->isDirty('category_id')) {
                $budget->current_period_spent = $this->calculateSpending(
                    $budget,
                    $budget->current_period_start,
                    $budget->current_period_end
                );
            }

            $budget->save();

            return $budget;
        });
    }

    /**
     * Toggle the active status of a budget.
     */
    public function toggle(Budget $budget): Budget
    {
        $budget->is_active = ! $budget->is_active;

        // If activating, recalculate the current period
        if ($budget->is_active) {
            $period = $budget->calculateCurrentPeriod();
            $budget->current_period_start = $period['start'];
            $budget->current_period_end = $period['end'];

            // Recalculate spending
            $budget->current_period_spent = $this->calculateSpending(
                $budget,
                $period['start'],
                $period['end']
            );

            // Reset rollover and alert when reactivating
            $budget->rollover_amount = 0;
            $budget->alert_sent = false;
        }

        $budget->save();

        return $budget;
    }

    /**
     * Roll over the budget to the next period.
     */
    public function rolloverPeriod(Budget $budget): Budget
    {
        return DB::transaction(function () use ($budget) {
            // Calculate rollover amount if enabled
            if ($budget->rollover_unused) {
                $remaining = $budget->getRemainingAmount();
                $budget->rollover_amount = max(0, $remaining);
            } else {
                $budget->rollover_amount = 0;
            }

            // Move to next period
            $newPeriod = $budget->calculateCurrentPeriod();

            // Advance past the old period
            while ($newPeriod['end']->lte(now())) {
                // For periods that have fully passed, we skip rollovers
                // (you can customize this behavior)
                $nextStart = match ($budget->period) {
                    'monthly' => $newPeriod['start']->copy()->addMonth(),
                    'quarterly' => $newPeriod['start']->copy()->addMonths(3),
                    'yearly' => $newPeriod['start']->copy()->addYear(),
                    default => $newPeriod['start']->copy()->addMonth(),
                };

                $newPeriod = $budget->getPeriodBoundaries($nextStart);
            }

            $budget->current_period_start = $newPeriod['start'];
            $budget->current_period_end = $newPeriod['end'];

            // Recalculate spending for new period
            $budget->current_period_spent = $this->calculateSpending(
                $budget,
                $newPeriod['start'],
                $newPeriod['end']
            );

            // Reset alert flag for new period
            $budget->alert_sent = false;

            $budget->save();

            return $budget;
        });
    }

    /**
     * Update the current period spending for a budget.
     */
    public function updateCurrentPeriodSpending(Budget $budget): Budget
    {
        return $this->syncBudget($budget);
    }

    /**
     * Synchronize a budget to the correct current period and spending.
     */
    public function syncBudget(Budget $budget): Budget
    {
        if (! $budget->is_active) {
            return $budget;
        }

        if ($budget->end_date && now()->startOfDay()->gt($budget->end_date)) {
            $budget->is_active = false;
            $budget->save();

            return $budget;
        }

        if (! $budget->current_period_start || ! $budget->current_period_end) {
            $period = $budget->calculateCurrentPeriod();
            $budget->current_period_start = $period['start'];
            $budget->current_period_end = $period['end'];
            $budget->alert_sent = false;
        } elseif ($budget->needsPeriodRollover()) {
            $budget = $this->rolloverPeriod($budget);
        }

        $expectedPeriod = $budget->calculateCurrentPeriod();
        if (
            ! $budget->current_period_start
            || ! $budget->current_period_end
            || $budget->current_period_start->toDateString() !== $expectedPeriod['start']->toDateString()
            || $budget->current_period_end->toDateString() !== $expectedPeriod['end']->toDateString()
        ) {
            $budget->current_period_start = $expectedPeriod['start'];
            $budget->current_period_end = $expectedPeriod['end'];
            $budget->alert_sent = false;
        }

        $budget->current_period_spent = $this->calculateSpending(
            $budget,
            $budget->current_period_start,
            $budget->current_period_end,
        );

        if ($budget->isDirty()) {
            $budget->save();
        }

        return $budget;
    }

    /**
     * Synchronize a set of budgets.
     *
     * @param  EloquentCollection<int, Budget>  $budgets
     * @return EloquentCollection<int, Budget>
     */
    public function syncBudgets(EloquentCollection $budgets): EloquentCollection
    {
        return $budgets->map(function (Budget $budget) {
            return $this->syncBudget($budget);
        });
    }

    /**
     * Check and process all budgets that need period rollover.
     */
    public function checkAndProcessRollovers(): int
    {
        $processed = 0;

        $budgetsNeedingRollover = Budget::query()
            ->active()
            ->whereNotNull('current_period_end')
            ->where('current_period_end', '<', now())
            ->get();

        foreach ($budgetsNeedingRollover as $budget) {
            // Check if budget has an end date and has expired
            if ($budget->end_date && now()->gt($budget->end_date)) {
                $budget->is_active = false;
                $budget->save();

                continue;
            }

            $this->rolloverPeriod($budget);
            $processed++;
        }

        return $processed;
    }

    /**
     * Calculate spending for a budget within a date range.
     */
    public function calculateSpending(Budget $budget, ?Carbon $start = null, ?Carbon $end = null): float
    {
        $start = $start ?? $budget->current_period_start;
        $end = $end ?? $budget->current_period_end;

        if (! $start || ! $end) {
            return 0;
        }

        return (float) $this->buildSpendingQuery($budget, $start, $end)->sum('amount');
    }

    /**
     * Get spending breakdown for a budget.
     */
    public function getSpendingBreakdown(Budget $budget): array
    {
        $budget = $this->syncBudget($budget);

        $query = $this->buildSpendingQuery(
            $budget,
            $budget->current_period_start,
            $budget->current_period_end,
        );

        if (! $budget->category_id) {
            // Overall budget - breakdown by category
            $transactions = $query->with('category')->get();

            $breakdown = $transactions
                ->groupBy('category_id')
                ->map(function ($transactions) {
                    $category = $transactions->first()->category;

                    return [
                        'id' => $category?->id,
                        'name' => $category?->name ?? 'Uncategorized',
                        'icon' => $category?->icon,
                        'color' => $category?->color,
                        'amount' => round($transactions->sum('amount'), 2),
                        'count' => $transactions->count(),
                    ];
                })
                ->sortByDesc('amount')
                ->values()
                ->toArray();
        } else {
            // Category-specific budget - breakdown by merchant
            $categoryIds = Category::where('id', $budget->category_id)
                ->orWhere('parent_id', $budget->category_id)
                ->pluck('id');

            $query->whereIn('category_id', $categoryIds);
            
            $transactions = $query->with('merchant')->get();

            $breakdown = $transactions
                ->groupBy('merchant_id')
                ->map(function ($transactions) {
                    $merchant = $transactions->first()->merchant;

                    return [
                        'id' => $merchant?->id,
                        'name' => $merchant?->name ?? 'Unknown Merchant',
                        'image_url' => $merchant?->image_url,
                        'amount' => round($transactions->sum('amount'), 2),
                        'count' => $transactions->count(),
                    ];
                })
                ->sortByDesc('amount')
                ->values()
                ->toArray();
        }

        return $breakdown;
    }

    /**
     * Get recent budget periods with spending totals.
     */
    public function getPeriodHistory(Budget $budget, int $limit = 6): array
    {
        $budget = $this->syncBudget($budget);

        if (! $budget->current_period_start || ! $budget->current_period_end) {
            return [];
        }

        $history = [];
        $cursor = $budget->current_period_start->copy();

        for ($i = 0; $i < $limit; $i++) {
            $period = $budget->getPeriodBoundaries($cursor->copy());
            $periodStart = $period['start']->copy();
            $periodEnd = $period['end']->copy();

            if ($periodEnd->lt($budget->start_date)) {
                break;
            }

            if ($periodStart->lt($budget->start_date)) {
                $periodStart = $budget->start_date->copy();
            }

            if ($budget->end_date && $periodStart->gt($budget->end_date)) {
                $cursor = $this->getPreviousPeriodStart($cursor, $budget->period);

                continue;
            }

            if ($budget->end_date && $periodEnd->gt($budget->end_date)) {
                $periodEnd = $budget->end_date->copy();
            }

            $query = $this->buildSpendingQuery($budget, $periodStart, $periodEnd);
            $spent = (float) (clone $query)->sum('amount');
            $transactionCount = (clone $query)->count();
            $budgetAmount = (float) $budget->amount;
            $spentPercentage = $budgetAmount > 0
                ? round(($spent / $budgetAmount) * 100, 1)
                : 0;

            $history[] = [
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'budget_amount' => round($budgetAmount, 2),
                'spent' => round($spent, 2),
                'remaining' => round($budgetAmount - $spent, 2),
                'spent_percentage' => $spentPercentage,
                'transaction_count' => $transactionCount,
                'is_over_budget' => $budgetAmount > 0 && $spent >= $budgetAmount,
                'is_current' => $periodStart->toDateString() === $budget->current_period_start->toDateString(),
            ];

            $cursor = $this->getPreviousPeriodStart($cursor, $budget->period);
        }

        return $history;
    }

    /**
     * Get budget comparison with previous period.
     */
    public function getBudgetComparison(Budget $budget): array
    {
        $budget = $this->syncBudget($budget);

        // Calculate previous period boundaries
        $previousStart = match ($budget->period) {
            'monthly' => $budget->current_period_start->copy()->subMonth(),
            'quarterly' => $budget->current_period_start->copy()->subMonths(3),
            'yearly' => $budget->current_period_start->copy()->subYear(),
            default => $budget->current_period_start->copy()->subMonth(),
        };

        $previousEnd = $budget->current_period_start->copy()->subDay();

        // Make sure previous period doesn't go before budget start
        if ($previousStart->lt($budget->start_date)) {
            return [
                'has_previous' => false,
                'previous_spending' => 0,
                'current_spending' => (float) $budget->current_period_spent,
                'difference' => 0,
                'percentage_change' => 0,
            ];
        }

        $previousSpending = $this->calculateSpending($budget, $previousStart, $previousEnd);
        $currentSpending = (float) $budget->current_period_spent;
        $difference = $currentSpending - $previousSpending;

        $percentageChange = 0;
        if ($previousSpending > 0) {
            $percentageChange = (($currentSpending - $previousSpending) / $previousSpending) * 100;
        }

        return [
            'has_previous' => true,
            'previous_period_start' => $previousStart->toDateString(),
            'previous_period_end' => $previousEnd->toDateString(),
            'previous_spending' => round($previousSpending, 2),
            'current_spending' => round($currentSpending, 2),
            'difference' => round($difference, 2),
            'percentage_change' => round($percentageChange, 1),
            'trend' => $difference > 0 ? 'up' : ($difference < 0 ? 'down' : 'flat'),
        ];
    }

    /**
     * Calculate budget health metrics.
     */
    public function calculateBudgetHealth(Budget $budget): array
    {
        $percentage = $budget->getSpentPercentage();
        $remaining = $budget->getRemainingAmount();
        $dailyAvgSpent = $budget->getDailyAverageSpent();
        $dailyAvgRemaining = $budget->getDailyAverageRemaining();
        $projectedSpending = $budget->getProjectedSpending();
        $effectiveBudget = $budget->getEffectiveBudget();

        return [
            'status' => $budget->getBudgetHealth(),
            'color' => $budget->getHealthColor(),
            'percentage' => round($percentage, 1),
            'spent' => (float) $budget->current_period_spent,
            'remaining' => round($remaining, 2),
            'effective_budget' => round($effectiveBudget, 2),
            'daily_avg_spent' => round($dailyAvgSpent, 2),
            'daily_avg_remaining' => round($dailyAvgRemaining, 2),
            'projected_spending' => round($projectedSpending, 2),
            'will_exceed' => $projectedSpending > $effectiveBudget,
            'days_left' => $budget->getDaysLeftInPeriod(),
        ];
    }

    /**
     * Get statistics for all user budgets.
     */
    public function getUserBudgetStats(User $user): array
    {
        $activeBudgets = $this->syncBudgets($user->budgets()->active()->get());

        $totalBudgeted = $activeBudgets->sum(fn ($b) => $b->getEffectiveBudget());
        $totalSpent = $activeBudgets->sum('current_period_spent');
        $totalRemaining = $activeBudgets->sum(fn ($b) => $b->getRemainingAmount());

        $overBudgetCount = $activeBudgets->filter(fn ($b) => $b->isOverBudget())->count();
        $warningCount = $activeBudgets->filter(fn ($b) => $b->isNearLimit() && ! $b->isOverBudget())->count();

        $overallPercentage = 0;
        if ($totalBudgeted > 0) {
            $overallPercentage = ($totalSpent / $totalBudgeted) * 100;
        }

        return [
            'active_count' => $activeBudgets->count(),
            'total_budgeted' => round($totalBudgeted, 2),
            'total_spent' => round($totalSpent, 2),
            'total_remaining' => round($totalRemaining, 2),
            'over_budget_count' => $overBudgetCount,
            'warning_count' => $warningCount,
            'overall_percentage' => round($overallPercentage, 1),
        ];
    }

    /**
     * Get budget for a specific category and user.
     */
    public function getBudgetForCategory(int $userId, ?int $categoryId): ?Budget
    {
        $budget = Budget::where('user_id', $userId)
            ->byCategory($categoryId)
            ->active()
            ->first();

        if (! $budget) {
            return null;
        }

        return $this->syncBudget($budget);
    }

    /**
     * Check how a transaction amount would affect a budget.
     */
    public function checkTransactionImpact(Budget $budget, float $transactionAmount): array
    {
        $budget = $this->syncBudget($budget);

        $currentSpent = (float) $budget->current_period_spent;
        $effectiveBudget = $budget->getEffectiveBudget();
        $projectedSpent = $currentSpent + $transactionAmount;
        $projectedRemaining = $effectiveBudget - $projectedSpent;
        $projectedPercentage = ($effectiveBudget > 0) ? ($projectedSpent / $effectiveBudget) * 100 : 0;

        $currentlyOverBudget = $budget->isOverBudget();
        $willBeOverBudget = $projectedSpent >= $effectiveBudget;
        $exceedsBy = max(0, $projectedSpent - $effectiveBudget);

        return [
            'current_spent' => round($currentSpent, 2),
            'transaction_amount' => round($transactionAmount, 2),
            'projected_spent' => round($projectedSpent, 2),
            'projected_remaining' => round($projectedRemaining, 2),
            'projected_percentage' => round($projectedPercentage, 1),
            'effective_budget' => round($effectiveBudget, 2),
            'currently_over_budget' => $currentlyOverBudget,
            'will_be_over_budget' => $willBeOverBudget,
            'exceeds_by' => round($exceedsBy, 2),
        ];
    }

    private function buildSpendingQuery(Budget $budget, Carbon $start, Carbon $end): Builder
    {
        $query = Transaction::query()
            ->where('user_id', $budget->user_id)
            ->where('type', 'expense')
            ->forDateRange($start, $end);

        if ($budget->category_id) {
            $categoryIds = Category::where('id', $budget->category_id)
                ->orWhere('parent_id', $budget->category_id)
                ->pluck('id');

            $query->whereIn('category_id', $categoryIds);
        }

        return $query;
    }

    private function getPreviousPeriodStart(Carbon $periodStart, string $period): Carbon
    {
        return match ($period) {
            'monthly' => $periodStart->copy()->subMonth(),
            'quarterly' => $periodStart->copy()->subMonths(3),
            'yearly' => $periodStart->copy()->subYear(),
            default => $periodStart->copy()->subMonth(),
        };
    }
}
