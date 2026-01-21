<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'default_account_id',
        'default_card_id',
        'currency',
        'ai_model',
        'ai_system_prompt',
        'ai_user_context',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function defaultAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'default_account_id');
    }

    public function defaultCard(): BelongsTo
    {
        return $this->belongsTo(Card::class, 'default_card_id');
    }
}