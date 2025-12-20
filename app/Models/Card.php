<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Card extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'bank_account_id',
        'type',
        'card_holder_name',
        'card_number',
        'card_network',
        'expiry_month',
        'expiry_year',
        'credit_limit',
        'current_balance',
        'payment_due_day',
        'billing_cycle_day',
        'color',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'card_number' => 'encrypted', // Encrypt card numbers for security
            'expiry_month' => 'integer',
            'expiry_year' => 'integer',
            'credit_limit' => 'decimal:2',
            'current_balance' => 'decimal:2',
            'payment_due_day' => 'integer',
            'billing_cycle_day' => 'integer',
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function outgoingTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'from_card_id');
    }

    public function incomingTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'to_card_id');
    }

    public function isCredit(): bool
    {
        return $this->type === 'credit';
    }

    public function isDebit(): bool
    {
        return $this->type === 'debit';
    }

    public function getAvailableCreditAttribute(): ?float
    {
        if (! $this->isCredit() || $this->credit_limit === null) {
            return null;
        }

        return $this->credit_limit - $this->current_balance;
    }

    public function getExpiryDateAttribute(): string
    {
        return sprintf('%02d/%d', $this->expiry_month, $this->expiry_year);
    }

    public function isExpired(): bool
    {
        $now = now();
        $expiryDate = now()->setYear($this->expiry_year)->setMonth($this->expiry_month)->endOfMonth();

        return $now->greaterThan($expiryDate);
    }

    public function updateBalance(float $amount, string $operation = 'add'): void
    {
        if ($operation === 'add') {
            $this->increment('current_balance', $amount);
        } else {
            $this->decrement('current_balance', $amount);
        }
    }
}
