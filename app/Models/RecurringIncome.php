<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RecurringIncome extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'category_id',
        'to_account_id',
        'name',
        'description',
        'source',
        'amount',
        'currency',
        'frequency',
        'payment_day',
        'payment_month',
        'start_date',
        'end_date',
        'last_received_date',
        'next_expected_date',
        'is_active',
        'auto_create_transaction',
        'reminder_days_before',
        'color',
        'icon',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'last_received_date' => 'date',
            'next_expected_date' => 'date',
            'is_active' => 'boolean',
            'auto_create_transaction' => 'boolean',
            'payment_day' => 'integer',
            'payment_month' => 'integer',
            'reminder_days_before' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function toAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'to_account_id');
    }

    public function transactions(): MorphMany
    {
        return $this->morphMany(Transaction::class, 'transactionable');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeExpectedSoon($query, int $days = 7)
    {
        return $query->where('is_active', true)
            ->whereNotNull('next_expected_date')
            ->whereBetween('next_expected_date', [now(), now()->addDays($days)]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('is_active', true)
            ->whereNotNull('next_expected_date')
            ->where('next_expected_date', '<', now());
    }

    public function scopeForCalendarRange($query, $startDate, $endDate)
    {
        return $query->where('is_active', true)
            ->whereNotNull('next_expected_date')
            ->whereBetween('next_expected_date', [$startDate, $endDate]);
    }

    public function isOverdue(): bool
    {
        return $this->is_active
            && $this->next_expected_date
            && $this->next_expected_date->isPast();
    }

    public function isExpectedSoon(int $days = 7): bool
    {
        return $this->is_active
            && $this->next_expected_date
            && $this->next_expected_date->isBetween(now(), now()->addDays($days));
    }

    public function calculateNextExpectedDate(?Carbon $fromDate = null): Carbon
    {
        $fromDate = $fromDate ?? ($this->last_received_date ?? $this->start_date);

        return match ($this->frequency) {
            'weekly' => $this->calculateNextWeeklyDate($fromDate),
            'bi_weekly' => $this->calculateNextBiWeeklyDate($fromDate),
            'monthly' => $this->calculateNextMonthlyDate($fromDate),
            'quarterly' => $this->calculateNextQuarterlyDate($fromDate),
            'yearly' => $this->calculateNextYearlyDate($fromDate),
            default => $fromDate->copy()->addMonth(),
        };
    }

    protected function calculateNextWeeklyDate(Carbon $fromDate): Carbon
    {
        $next = $fromDate->copy()->addWeek();
        if ($this->payment_day !== null) {
            $next->startOfWeek()->addDays($this->payment_day);
            if ($next->lte($fromDate)) {
                $next->addWeek();
            }
        }

        return $next;
    }

    protected function calculateNextBiWeeklyDate(Carbon $fromDate): Carbon
    {
        $next = $fromDate->copy()->addWeeks(2);
        if ($this->payment_day !== null) {
            $next->startOfWeek()->addDays($this->payment_day);
            if ($next->lte($fromDate)) {
                $next->addWeeks(2);
            }
        }

        return $next;
    }

    protected function calculateNextMonthlyDate(Carbon $fromDate): Carbon
    {
        $next = $fromDate->copy()->addMonth();
        if ($this->payment_day !== null) {
            $day = min($this->payment_day, $next->daysInMonth);
            $next->day($day);
            if ($next->lte($fromDate)) {
                $next->addMonth();
                $day = min($this->payment_day, $next->daysInMonth);
                $next->day($day);
            }
        }

        return $next;
    }

    protected function calculateNextQuarterlyDate(Carbon $fromDate): Carbon
    {
        $next = $fromDate->copy()->addMonths(3);
        if ($this->payment_day !== null) {
            $day = min($this->payment_day, $next->daysInMonth);
            $next->day($day);
        }

        return $next;
    }

    protected function calculateNextYearlyDate(Carbon $fromDate): Carbon
    {
        $next = $fromDate->copy()->addYear();
        if ($this->payment_month !== null) {
            $next->month($this->payment_month);
        }
        if ($this->payment_day !== null) {
            $day = min($this->payment_day, $next->daysInMonth);
            $next->day($day);
        }

        return $next;
    }

    public function getMonthlyEquivalent(): float
    {
        return match ($this->frequency) {
            'weekly' => $this->amount * 4.33,
            'bi_weekly' => $this->amount * 2.17,
            'monthly' => $this->amount,
            'quarterly' => $this->amount / 3,
            'yearly' => $this->amount / 12,
            default => $this->amount,
        };
    }

    public function getYearlyTotal(): float
    {
        return match ($this->frequency) {
            'weekly' => $this->amount * 52,
            'bi_weekly' => $this->amount * 26,
            'monthly' => $this->amount * 12,
            'quarterly' => $this->amount * 4,
            'yearly' => $this->amount,
            default => $this->amount * 12,
        };
    }
}
