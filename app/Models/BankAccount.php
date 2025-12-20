<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BankAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'balance',
        'currency',
        'account_number',
        'bank_name',
        'color',
        'icon',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cards(): HasMany
    {
        return $this->hasMany(Card::class);
    }

    public function outgoingTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'from_account_id');
    }

    public function incomingTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'to_account_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'from_account_id')
            ->orWhere('to_account_id', $this->id);
    }

    public function updateBalance(float $amount, string $operation = 'add'): void
    {
        if ($operation === 'add') {
            $this->increment('balance', $amount);
        } else {
            $this->decrement('balance', $amount);
        }
    }

    public function subscriptions(): MorphMany
    {
        return $this->morphMany(Subscription::class, 'payment_method');
    }

    public function recurringIncomes(): HasMany
    {
        return $this->hasMany(RecurringIncome::class, 'to_account_id');
    }
}
