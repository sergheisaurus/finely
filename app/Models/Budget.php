<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Budget extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'category_id',
        'name',
        'description',
        'amount',
        'currency',
        'period',
        'start_date',
        'end_date',
        'current_period_start',
        'current_period_end',
        'current_period_spent',
        'rollover_unused',
        'rollover_amount',
        'alert_threshold',
        'alert_sent',
        'is_active',
        'color',
        'icon',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'current_period_spent' => 'decimal:2',
            'rollover_amount' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'current_period_start' => 'date',
            'current_period_end' => 'date',
            'is_active' => 'boolean',
            'rollover_unused' => 'boolean',
            'alert_threshold' => 'integer',
            'alert_sent' => 'boolean',
        ];
    }

    // Relationships

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // Scopes

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeOverBudget($query)
    {
        return $query->whereRaw('current_period_spent >= (amount + rollover_amount)');
    }

    public function scopeNearLimit($query, int $threshold = 80)
    {
        return $query->whereRaw(
            'current_period_spent >= ((amount + rollover_amount) * ? / 100)',
            [$threshold]
        )->whereRaw('current_period_spent < (amount + rollover_amount)');
    }

    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('current_period_start', [$startDate, $endDate])
            ->orWhereBetween('current_period_end', [$startDate, $endDate]);
    }

    public function scopeByCategory($query, ?int $categoryId)
    {
        if ($categoryId === null) {
            return $query->whereNull('category_id');
        }

        return $query->where('category_id', $categoryId);
    }

    // Period Calculation Methods

    /**
     * Calculate the current period boundaries based on start_date and period.
     *
     * @return array{start: Carbon, end: Carbon}
     */
    public function calculateCurrentPeriod(): array
    {
        $now = now();
        $startDate = $this->start_date;

        // If start_date is in the future, return the first period starting from start_date
        if ($startDate->isFuture()) {
            return $this->getPeriodBoundaries($startDate);
        }

        // Calculate how many complete periods have passed since start_date
        $periodsSinceStart = $this->calculatePeriodsSinceStart($now);

        // Get the start of the current period
        $periodStart = match ($this->period) {
            'monthly' => $startDate->copy()->addMonths($periodsSinceStart),
            'quarterly' => $startDate->copy()->addMonths($periodsSinceStart * 3),
            'yearly' => $startDate->copy()->addYears($periodsSinceStart),
            default => $startDate->copy()->addMonths($periodsSinceStart),
        };

        return $this->getPeriodBoundaries($periodStart);
    }

    /**
     * Calculate the number of complete periods since the start date.
     */
    protected function calculatePeriodsSinceStart(Carbon $now): int
    {
        $startDate = $this->start_date;

        return match ($this->period) {
            'monthly' => $startDate->diffInMonths($now),
            'quarterly' => (int) floor($startDate->diffInMonths($now) / 3),
            'yearly' => $startDate->diffInYears($now),
            default => $startDate->diffInMonths($now),
        };
    }

    /**
     * Get the period boundaries (start and end) for a given period start date.
     *
     * @return array{start: Carbon, end: Carbon}
     */
    public function getPeriodBoundaries(Carbon $periodStart): array
    {
        $periodEnd = match ($this->period) {
            'monthly' => $periodStart->copy()->addMonth()->subDay(),
            'quarterly' => $periodStart->copy()->addMonths(3)->subDay(),
            'yearly' => $periodStart->copy()->addYear()->subDay(),
            default => $periodStart->copy()->addMonth()->subDay(),
        };

        return [
            'start' => $periodStart,
            'end' => $periodEnd,
        ];
    }

    /**
     * Check if the current period is still active (hasn't ended).
     */
    public function isCurrentPeriodActive(): bool
    {
        if (! $this->current_period_end) {
            return false;
        }

        return now()->lte($this->current_period_end);
    }

    /**
     * Check if the budget needs to roll over to the next period.
     */
    public function needsPeriodRollover(): bool
    {
        if (! $this->is_active || ! $this->current_period_end) {
            return false;
        }

        return now()->gt($this->current_period_end);
    }

    // Spending Calculation Methods

    /**
     * Get the current spending for this budget period by querying transactions.
     */
    public function getCurrentSpending(): float
    {
        $query = Transaction::where('user_id', $this->user_id)
            ->where('type', 'expense')
            ->forDateRange($this->current_period_start, $this->current_period_end);

        // If category-specific budget, filter by category (including children)
        if ($this->category_id) {
            $categoryIds = Category::where('id', $this->category_id)
                ->orWhere('parent_id', $this->category_id)
                ->pluck('id');

            $query->whereIn('category_id', $categoryIds);
        }

        return (float) $query->sum('amount');
    }

    /**
     * Get the effective budget amount (base amount + rollover).
     */
    public function getEffectiveBudget(): float
    {
        return (float) $this->amount + (float) $this->rollover_amount;
    }

    /**
     * Get the remaining budget amount.
     */
    public function getRemainingAmount(): float
    {
        return $this->getEffectiveBudget() - (float) $this->current_period_spent;
    }

    /**
     * Get the percentage of budget spent.
     */
    public function getSpentPercentage(): float
    {
        $effectiveBudget = $this->getEffectiveBudget();
        if ($effectiveBudget <= 0) {
            return 0;
        }

        return ((float) $this->current_period_spent / $effectiveBudget) * 100;
    }

    /**
     * Check if the budget has been exceeded.
     */
    public function isOverBudget(): bool
    {
        return (float) $this->current_period_spent >= $this->getEffectiveBudget();
    }

    /**
     * Check if spending is near the alert threshold.
     */
    public function isNearLimit(?int $threshold = null): bool
    {
        $threshold = $threshold ?? $this->alert_threshold;
        $percentage = $this->getSpentPercentage();

        return $percentage >= $threshold && ! $this->isOverBudget();
    }

    // Budget Health Methods

    /**
     * Get the budget health status.
     */
    public function getBudgetHealth(): string
    {
        $percentage = $this->getSpentPercentage();
        $threshold = $this->alert_threshold;

        return match (true) {
            $percentage >= 100 => 'exceeded',
            $percentage >= $threshold => 'danger',
            $percentage >= ($threshold - 20) => 'warning',
            default => 'healthy',
        };
    }

    /**
     * Get the color corresponding to the budget health.
     */
    public function getHealthColor(): string
    {
        return match ($this->getBudgetHealth()) {
            'exceeded' => 'red',
            'danger' => 'orange',
            'warning' => 'yellow',
            default => 'green',
        };
    }

    /**
     * Get the daily average spending in the current period.
     */
    public function getDailyAverageSpent(): float
    {
        if (! $this->current_period_start) {
            return 0;
        }

        $daysElapsed = max(1, $this->current_period_start->diffInDays(now()));

        return (float) $this->current_period_spent / $daysElapsed;
    }

    /**
     * Get the daily average budget remaining for the rest of the period.
     */
    public function getDailyAverageRemaining(): float
    {
        $daysLeft = $this->getDaysLeftInPeriod();
        if ($daysLeft <= 0) {
            return 0;
        }

        $remaining = $this->getRemainingAmount();
        if ($remaining <= 0) {
            return 0;
        }

        return $remaining / $daysLeft;
    }

    /**
     * Get the number of days left in the current period.
     */
    public function getDaysLeftInPeriod(): int
    {
        if (! $this->current_period_end) {
            return 0;
        }

        return max(0, now()->diffInDays($this->current_period_end, false));
    }

    /**
     * Project the total spending by end of period based on current daily average.
     */
    public function getProjectedSpending(): float
    {
        if (! $this->current_period_start || ! $this->current_period_end) {
            return (float) $this->current_period_spent;
        }

        $totalDays = max(1, $this->current_period_start->diffInDays($this->current_period_end));
        $dailyAverage = $this->getDailyAverageSpent();

        return $dailyAverage * $totalDays;
    }

    /**
     * Check if spending is projected to exceed the budget.
     */
    public function willExceedBudget(): bool
    {
        return $this->getProjectedSpending() > $this->getEffectiveBudget();
    }

    // Rollover Methods

    /**
     * Calculate the amount to roll over to the next period.
     */
    public function calculateRolloverAmount(): float
    {
        if (! $this->rollover_unused) {
            return 0;
        }

        $remaining = $this->getRemainingAmount();

        return max(0, $remaining);
    }

    // Alert Methods

    /**
     * Check if an alert should be sent for this budget.
     */
    public function shouldAlert(): bool
    {
        if ($this->alert_sent) {
            return false;
        }

        return $this->isNearLimit() || $this->isOverBudget();
    }
}
