<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'merchant_id',
        'category_id',
        'provider',
        'order_site',
        'order_number',
        'order_url',
        'ordered_at',
        'delivered_at',
        'status',
        'amount',
        'currency',
        'source_currency',
        'fx_rate',
        'fx_fee_amount',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'ordered_at' => 'date',
            'delivered_at' => 'date',
            'fx_rate' => 'decimal:8',
            'fx_fee_amount' => 'decimal:2',
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

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('sort_order');
    }

    public function transactions(): MorphMany
    {
        return $this->morphMany(Transaction::class, 'transactionable');
    }

    public function getComputedItemsTotal(): float
    {
        return (float) $this->items
            ->sum(function (OrderItem $item): float {
                return (float) ($item->amount ?? ($item->quantity * ($item->unit_price ?? 0)));
            });
    }
}
