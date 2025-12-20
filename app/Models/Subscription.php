<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subscription extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'merchant_id',
        'category_id',
        'payment_method_type',
        'payment_method_id',
        'name',
        'description',
        'amount',
        'currency',
        'billing_cycle',
        'billing_day',
        'billing_month',
        'start_date',
        'end_date',
        'last_billed_date',
        'next_billing_date',
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
            'last_billed_date' => 'date',
            'next_billing_date' => 'date',
            'is_active' => 'boolean',
            'auto_create_transaction' => 'boolean',
            'billing_day' => 'integer',
            'billing_month' => 'integer',
            'reminder_days_before' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function paymentMethod(): MorphTo
    {
        return $this->morphTo('payment_method', 'payment_method_type', 'payment_method_id');
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

    public function scopeDueSoon($query, int $days = 7)
    {
        return $query->where('is_active', true)
            ->whereNotNull('next_billing_date')
            ->whereBetween('next_billing_date', [now(), now()->addDays($days)]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('is_active', true)
            ->whereNotNull('next_billing_date')
            ->where('next_billing_date', '<', now());
    }

    public function scopeForCalendarRange($query, $startDate, $endDate)
    {
        return $query->where('is_active', true)
            ->whereNotNull('next_billing_date')
            ->whereBetween('next_billing_date', [$startDate, $endDate]);
    }

    public function isOverdue(): bool
    {
        return $this->is_active
            && $this->next_billing_date
            && $this->next_billing_date->isPast();
    }

    public function isDueSoon(int $days = 7): bool
    {
        return $this->is_active
            && $this->next_billing_date
            && $this->next_billing_date->isBetween(now(), now()->addDays($days));
    }

    public function calculateNextBillingDate(?Carbon $fromDate = null): Carbon
    {
        $fromDate = $fromDate ?? ($this->last_billed_date ?? $this->start_date);

        return match ($this->billing_cycle) {
            'daily' => $fromDate->copy()->addDay(),
            'weekly' => $this->calculateNextWeeklyDate($fromDate),
            'monthly' => $this->calculateNextMonthlyDate($fromDate),
            'quarterly' => $this->calculateNextQuarterlyDate($fromDate),
            'yearly' => $this->calculateNextYearlyDate($fromDate),
            default => $fromDate->copy()->addMonth(),
        };
    }

    protected function calculateNextWeeklyDate(Carbon $fromDate): Carbon
    {
        $next = $fromDate->copy()->addWeek();
        if ($this->billing_day !== null) {
            $next->startOfWeek()->addDays($this->billing_day);
            if ($next->lte($fromDate)) {
                $next->addWeek();
            }
        }

        return $next;
    }

    protected function calculateNextMonthlyDate(Carbon $fromDate): Carbon
    {
        $next = $fromDate->copy()->addMonth();
        if ($this->billing_day !== null) {
            $day = min($this->billing_day, $next->daysInMonth);
            $next->day($day);
            if ($next->lte($fromDate)) {
                $next->addMonth();
                $day = min($this->billing_day, $next->daysInMonth);
                $next->day($day);
            }
        }

        return $next;
    }

    protected function calculateNextQuarterlyDate(Carbon $fromDate): Carbon
    {
        $next = $fromDate->copy()->addMonths(3);
        if ($this->billing_day !== null) {
            $day = min($this->billing_day, $next->daysInMonth);
            $next->day($day);
        }

        return $next;
    }

    protected function calculateNextYearlyDate(Carbon $fromDate): Carbon
    {
        $next = $fromDate->copy()->addYear();
        if ($this->billing_month !== null) {
            $next->month($this->billing_month);
        }
        if ($this->billing_day !== null) {
            $day = min($this->billing_day, $next->daysInMonth);
            $next->day($day);
        }

        return $next;
    }

    public function getMonthlyEquivalent(): float
    {
        return match ($this->billing_cycle) {
            'daily' => $this->amount * 30,
            'weekly' => $this->amount * 4.33,
            'monthly' => $this->amount,
            'quarterly' => $this->amount / 3,
            'yearly' => $this->amount / 12,
            default => $this->amount,
        };
    }

    public function getYearlyTotal(): float
    {
        return match ($this->billing_cycle) {
            'daily' => $this->amount * 365,
            'weekly' => $this->amount * 52,
            'monthly' => $this->amount * 12,
            'quarterly' => $this->amount * 4,
            'yearly' => $this->amount,
            default => $this->amount * 12,
        };
    }
}
