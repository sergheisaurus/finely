<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecurringIncomeSalaryAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'recurring_income_id',
        'effective_date',
        'gross_amount',
        'net_amount',
        'deduction_rules',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'effective_date' => 'date',
            'gross_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'deduction_rules' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recurringIncome(): BelongsTo
    {
        return $this->belongsTo(RecurringIncome::class);
    }
}
