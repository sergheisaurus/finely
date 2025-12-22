<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'merchant_id',
        'category_id',
        'invoice_number',
        'reference',
        'amount',
        'currency',
        'issue_date',
        'due_date',
        'paid_date',
        'status',
        'is_recurring',
        'frequency',
        'billing_day',
        'next_due_date',
        'times_paid',
        'qr_data',
        'qr_raw_text',
        'creditor_name',
        'creditor_iban',
        'payment_reference',
        'notes',
        'color',
        'icon',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'issue_date' => 'date',
            'due_date' => 'date',
            'paid_date' => 'date',
            'next_due_date' => 'date',
            'is_recurring' => 'boolean',
            'billing_day' => 'integer',
            'times_paid' => 'integer',
            'qr_data' => 'array',
        ];
    }

    // Relationships

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

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('sort_order');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(InvoiceAttachment::class);
    }

    public function transactions(): MorphMany
    {
        return $this->morphMany(Transaction::class, 'transactionable');
    }

    // Scopes

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeRecurring($query)
    {
        return $query->where('is_recurring', true);
    }

    public function scopeOneOff($query)
    {
        return $query->where('is_recurring', false);
    }

    public function scopeDueSoon($query, int $days = 7)
    {
        return $query->where('status', 'pending')
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [now()->startOfDay(), now()->addDays($days)->endOfDay()]);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('due_date', [$startDate, $endDate]);
    }

    public function scopeUnpaid($query)
    {
        return $query->whereIn('status', ['pending', 'overdue']);
    }

    // Helper Methods

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isOverdue(): bool
    {
        return $this->status === 'overdue';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isRecurring(): bool
    {
        return $this->is_recurring;
    }

    public function getDaysUntilDue(): ?int
    {
        if (! $this->due_date || $this->isPaid() || $this->isCancelled()) {
            return null;
        }

        $days = now()->startOfDay()->diffInDays($this->due_date, false);

        return $days >= 0 ? $days : null;
    }

    public function getDaysOverdue(): ?int
    {
        if (! $this->due_date || $this->isPaid() || $this->isCancelled()) {
            return null;
        }

        $days = $this->due_date->diffInDays(now()->startOfDay(), false);

        return $days > 0 ? $days : null;
    }

    public function calculateNextDueDate(?Carbon $fromDate = null): Carbon
    {
        $fromDate = $fromDate ?? $this->due_date ?? now();

        $next = match ($this->frequency) {
            'monthly' => $fromDate->copy()->addMonth(),
            'quarterly' => $fromDate->copy()->addMonths(3),
            'yearly' => $fromDate->copy()->addYear(),
            default => $fromDate->copy()->addMonth(),
        };

        // Adjust to billing day if set
        if ($this->billing_day !== null) {
            $day = min($this->billing_day, $next->daysInMonth);
            $next->day($day);
        }

        return $next;
    }

    public function shouldBeMarkedOverdue(): bool
    {
        return $this->isPending()
            && $this->due_date
            && $this->due_date->isPast();
    }

    public function shouldAdvanceToNextPeriod(): bool
    {
        return $this->is_recurring
            && $this->isPaid()
            && $this->due_date
            && $this->due_date->isPast();
    }

    public function getPrimaryAttachment(): ?InvoiceAttachment
    {
        return $this->attachments()->where('is_primary', true)->first()
            ?? $this->attachments()->first();
    }
}
