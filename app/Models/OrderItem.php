<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'name',
        'quantity',
        'unit_price',
        'amount',
        'product_url',
        'external_item_id',
        'ordered_at',
        'delivered_at',
        'returned_at',
        'status',
        'sort_order',
        'cdn_folder_id',
        'cover_image_id',
        'cover_image_settings',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'amount' => 'decimal:2',
            'ordered_at' => 'date',
            'delivered_at' => 'date',
            'returned_at' => 'date',
            'sort_order' => 'integer',
            'cover_image_settings' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function coverImage(): BelongsTo
    {
        return $this->belongsTo(CdnAsset::class, 'cover_image_id');
    }

    public function cdnAssets(): MorphMany
    {
        return $this->morphMany(CdnAsset::class, 'attachable');
    }

    public function latestImageAsset(): MorphOne
    {
        return $this->morphOne(CdnAsset::class, 'attachable')->latestOfMany();
    }
}
