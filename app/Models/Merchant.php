<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Merchant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'image_path',
        'is_secret',
        'cover_merchant_id',
    ];

    protected function casts(): array
    {
        return [
            'is_secret' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function coverMerchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class, 'cover_merchant_id');
    }

    public function isCompany(): bool
    {
        return $this->type === 'company';
    }

    public function isPerson(): bool
    {
        return $this->type === 'person';
    }

    public function scopeCompanies($query)
    {
        return $query->where('type', 'company');
    }

    public function scopePeople($query)
    {
        return $query->where('type', 'person');
    }

    public function scopeVisibleForSecretMode($query, bool $isSecretMode)
    {
        if ($isSecretMode) {
            return $query;
        }

        return $query->where('is_secret', false);
    }
}
