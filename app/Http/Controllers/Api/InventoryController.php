<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UploadInventoryItemImageRequest;
use App\Http\Resources\InventoryItemResource;
use App\Models\CdnAsset;
use App\Models\OrderItem;
use App\Services\Cdn\CdnClient;
use App\Services\InventoryImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Collection;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryImageService $inventoryImageService,
        protected CdnClient $cdn,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $userId = $request->user()->id;

        $items = OrderItem::query()
            ->whereHas('order', fn ($q) => $q->where('user_id', $userId))
            ->with(['order.merchant', 'latestImageAsset', 'coverImage', 'cdnAssets'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 50));

        foreach ($items->getCollection() as $item) {
            foreach ($item->cdnAssets as $asset) {
                if (! $asset->url) {
                    $this->inventoryImageService->repairAssetUrls($asset);
                }
            }
        }

        $items->getCollection()->load(['latestImageAsset', 'coverImage', 'cdnAssets']);

        $orderIds = $items->getCollection()->pluck('order_id')->unique()->values();

        /** @var Collection<int, \App\Models\Order> $ordersById */
        $ordersById = $items->getCollection()
            ->pluck('order')
            ->filter()
            ->keyBy('id');

        $itemsByOrder = OrderItem::query()
            ->whereIn('order_id', $orderIds)
            ->get()
            ->groupBy('order_id');

        $computedByOrder = [];

        foreach ($orderIds as $orderId) {
            $order = $ordersById->get($orderId);
            if (! $order) {
                continue;
            }

            $orderCurrency = $order->currency ?? 'CHF';
            $fxRate = (float) ($order->fx_rate ?? 1);
            $baseCurrency = $order->source_currency;
            $quoteCurrency = $orderCurrency;

            $allItems = $itemsByOrder->get($orderId, collect());

            $convertedTotal = 0.0;
            $convertedPerItem = [];

            foreach ($allItems as $it) {
                $qty = (int) ($it->quantity ?? 1);
                $raw = $it->amount !== null
                    ? (float) $it->amount
                    : ($it->unit_price !== null ? ((float) $it->unit_price) * max(1, $qty) : 0.0);

                $rate = ($baseCurrency && $orderCurrency && strtoupper($baseCurrency) === strtoupper($orderCurrency))
                    ? 1.0
                    : ($fxRate ?: 1.0);

                $converted = $raw * $rate;
                $convertedPerItem[$it->id] = $converted;
                $convertedTotal += $converted;
            }

            $charged = (float) ($order->amount ?? 0);
            $fee = $charged - $convertedTotal;

            $feeShares = [];

            if ($convertedTotal > 0) {
                $feeRounded = round($fee, 2);

                $exact = [];
                $rounded = [];
                $remainders = [];

                foreach ($convertedPerItem as $itemId => $converted) {
                    $share = $fee * ($converted / $convertedTotal);
                    $exact[$itemId] = $share;
                    $rounded[$itemId] = round($share, 2);
                    $remainders[$itemId] = $share - $rounded[$itemId];
                }

                $sumRounded = array_sum($rounded);
                $deltaCents = (int) round(($feeRounded - $sumRounded) * 100);

                if ($deltaCents !== 0) {
                    $sortedIds = array_keys($rounded);

                    usort($sortedIds, function (int $a, int $b) use ($deltaCents, $remainders, $convertedPerItem): int {
                        if ($deltaCents > 0) {
                            // Prefer items rounded down the most.
                            $cmp = ($remainders[$b] <=> $remainders[$a]);
                            if ($cmp !== 0) {
                                return $cmp;
                            }
                        } else {
                            // Prefer items rounded up the most.
                            $cmp = ($remainders[$a] <=> $remainders[$b]);
                            if ($cmp !== 0) {
                                return $cmp;
                            }
                        }

                        // Stable fallback: higher converted value first.
                        return ($convertedPerItem[$b] <=> $convertedPerItem[$a]);
                    });

                    $step = $deltaCents > 0 ? 0.01 : -0.01;
                    $remaining = abs($deltaCents);

                    for ($i = 0; $i < $remaining; $i++) {
                        $id = $sortedIds[$i % max(1, count($sortedIds))] ?? null;
                        if ($id === null) {
                            break;
                        }
                        $rounded[$id] += $step;
                    }
                }

                $feeShares = $rounded;
            }

            $computedByOrder[$orderId] = [
                'order_currency' => $orderCurrency,
                'base_currency' => $baseCurrency,
                'quote_currency' => $quoteCurrency,
                'fx_rate' => $order->fx_rate,
                'charged' => $charged,
                'converted_total' => $convertedTotal,
                'fee' => $fee,
                'converted_per_item' => $convertedPerItem,
                'fee_shares' => $feeShares,
            ];
        }

        foreach ($items->getCollection() as $item) {
            $computed = $computedByOrder[$item->order_id] ?? null;
            if (! $computed) {
                continue;
            }

            $orderCurrency = $computed['order_currency'];
            $baseCurrency = $computed['base_currency'];
            $quoteCurrency = $computed['quote_currency'];
            $charged = (float) $computed['charged'];
            $convertedTotal = (float) $computed['converted_total'];
            $fee = (float) $computed['fee'];

            $thisConverted = (float) ($computed['converted_per_item'][$item->id] ?? 0.0);
            $feeShare = (float) ($computed['fee_shares'][$item->id] ?? 0.0);
            $finalTotal = $thisConverted + $feeShare;
            $qty = (int) ($item->quantity ?? 1);
            $finalUnit = $qty > 0 ? $finalTotal / $qty : 0.0;

            $item->setAttribute('computed_chf', [
                'order_currency' => $orderCurrency,
                'base_currency' => $baseCurrency,
                'quote_currency' => $quoteCurrency,
                'fx_rate' => $computed['fx_rate'],
                'converted_subtotal' => round($thisConverted, 2),
                'fee_allocated' => round($feeShare, 2),
                'total_charged_subtotal' => round($finalTotal, 2),
                'unit_cost_charged' => round($finalUnit, 2),
                'order_charged_total' => round($charged, 2),
                'order_items_total_converted' => round($convertedTotal, 2),
                'order_fee_total' => round($fee, 2),
            ]);
        }

        return InventoryItemResource::collection($items);
    }

    public function uploadImage(UploadInventoryItemImageRequest $request, OrderItem $item): JsonResponse
    {
        $ownsItem = $item->order()
            ->where('user_id', $request->user()->id)
            ->exists();

        if (! $ownsItem) {
            abort(404);
        }

        try {
            $this->inventoryImageService->upload($item->load('order'), $request->file('image'));
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to upload item image to CDN.',
                'error' => $e->getMessage(),
            ], 422);
        }

        $item->load(['order.merchant', 'latestImageAsset', 'coverImage', 'cdnAssets']);

        return response()->json([
            'message' => 'Image uploaded.',
            'data' => (new InventoryItemResource($item))->toArray($request),
        ]);
    }

    public function setCoverImage(Request $request, OrderItem $item): JsonResponse
    {
        $ownsItem = $item->order()
            ->where('user_id', $request->user()->id)
            ->exists();

        if (! $ownsItem) {
            abort(404);
        }

        $request->validate([
            'asset_id' => 'required|exists:cdn_assets,id',
            'crop' => 'nullable|array',
            'crop.x' => 'required_with:crop|numeric|min:0|max:100',
            'crop.y' => 'required_with:crop|numeric|min:0|max:100',
            'crop.width' => 'required_with:crop|numeric|min:0.1|max:100',
            'crop.height' => 'required_with:crop|numeric|min:0.1|max:100',
        ]);

        $assetId = $request->input('asset_id');

        // Verify the asset belongs to this item (optional but good for security)
        $belongsToItem = $item->cdnAssets()->where('id', $assetId)->exists();
        if (! $belongsToItem) {
             return response()->json([
                'message' => 'The selected image does not belong to this item.',
            ], 422);
        }

        $item->update([
            'cover_image_id' => $assetId,
            'cover_image_settings' => $request->input('crop'),
        ]);

        $item->load(['order.merchant', 'latestImageAsset', 'coverImage', 'cdnAssets']);

        return response()->json([
            'message' => 'Cover image updated.',
            'data' => (new InventoryItemResource($item))->toArray($request),
        ]);
    }

    public function deleteImage(Request $request, OrderItem $item, CdnAsset $asset): JsonResponse
    {
        $ownsItem = $item->order()
            ->where('user_id', $request->user()->id)
            ->exists();

        if (! $ownsItem) {
            abort(404);
        }

        $belongsToItem = in_array($asset->attachable_type, [
            OrderItem::class,
            (new OrderItem())->getMorphClass(),
        ], true) && (int) $asset->attachable_id === (int) $item->id;

        if (! $belongsToItem) {
            return response()->json([
                'message' => 'The selected image does not belong to this item.',
            ], 422);
        }

        $item->loadMissing('latestImageAsset');

        if ($item->cover_image_id === $asset->id) {
            $nextCoverId = $item->cdnAssets()
                ->where('id', '!=', $asset->id)
                ->latest('id')
                ->value('id');

            $item->update([
                'cover_image_id' => $nextCoverId,
                'cover_image_settings' => null,
            ]);
        }

        if ($asset->cdn_file_id) {
            try {
                $this->cdn->deleteFile($asset->cdn_file_id);
            } catch (\Throwable $e) {
                report($e);

                return response()->json([
                    'message' => 'Failed to delete image from CDN.',
                    'error' => $e->getMessage(),
                ], 422);
            }
        }

        $asset->delete();

        $item->load(['order.merchant', 'latestImageAsset', 'coverImage', 'cdnAssets']);

        return response()->json([
            'message' => 'Image deleted.',
            'data' => (new InventoryItemResource($item))->toArray($request),
        ]);
    }
}
