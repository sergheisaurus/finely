<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryItemResource extends JsonResource
{
    protected function proxyUrl(?string $fileId, string $variant = 'file'): ?string
    {
        if (! is_string($fileId) || $fileId === '') {
            return null;
        }

        return route('api.integrations.cdn.files.media', [
            'file' => $fileId,
            'variant' => $variant,
        ]);
    }

    public function toArray(Request $request): array
    {
        $coverFileId = $this->coverImage?->cdn_file_id;
        $latestFileId = $this->latestImageAsset?->cdn_file_id;

        $mainFileId = $coverFileId ?? $latestFileId;
        $mainAsset = $this->coverImage ?? $this->latestImageAsset;

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'name' => $this->name,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'amount' => $this->amount,
            'product_url' => $this->product_url,
            'cover_image_id' => $this->cover_image_id,
            'cover_image_settings' => $this->cover_image_settings,
            'image_url' => $this->proxyUrl($mainFileId, 'file')
                ?: $mainAsset?->url
                ?: $mainAsset?->thumbnail_url,
            'image_thumbnail_url' => $this->proxyUrl($mainFileId, 'thumbnail')
                ?: $mainAsset?->thumbnail_url
                ?: $mainAsset?->url,
            'image_gallery' => $this->whenLoaded('cdnAssets', function () {
                return $this->cdnAssets
                    ->sortByDesc('id')
                    ->values()
                    ->map(fn ($asset) => [
                        'id' => $asset->id,
                        'url' => $this->proxyUrl($asset->cdn_file_id, 'file')
                            ?: $asset->url
                            ?: $asset->thumbnail_url,
                        'thumbnail_url' => $this->proxyUrl($asset->cdn_file_id, 'thumbnail')
                            ?: $asset->thumbnail_url
                            ?: $asset->url,
                        'name' => $asset->name,
                    ])
                    ->toArray();
            }, []),
            'status' => $this->status,
            'ordered_at' => $this->ordered_at?->toDateString(),
            'delivered_at' => $this->delivered_at?->toDateString(),

            'order' => [
                'id' => $this->order?->id,
                'provider' => $this->order?->provider,
                'order_number' => $this->order?->order_number,
                'ordered_at' => $this->order?->ordered_at?->toDateString(),
                'amount' => $this->order?->amount,
                'currency' => $this->order?->currency,
                'fx_rate' => $this->order?->fx_rate,
                'source_currency' => $this->order?->source_currency,
                'merchant' => $this->order?->merchant
                    ? [
                        'id' => $this->order->merchant->id,
                        'name' => $this->order->merchant->name,
                    ]
                    : null,
            ],

            'computed' => $this->getAttribute('computed_chf') ?? null,
        ];
    }
}
