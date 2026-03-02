<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LinkOrderTransactionRequest;
use App\Http\Requests\Api\StoreOrderRequest;
use App\Http\Requests\Api\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\TransactionResource;
use App\Models\Order;
use App\Models\Transaction;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->orders();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('merchant_id')) {
            $query->where('merchant_id', $request->merchant_id);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $from = $request->get('from_date') ?? $request->get('date_from');
        $to = $request->get('to_date') ?? $request->get('date_to');
        if ($from) {
            $query->where('ordered_at', '>=', $from);
        }
        if ($to) {
            $query->where('ordered_at', '<=', $to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('provider', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $orders = $query
            ->with(['merchant', 'category'])
            ->withCount(['items', 'transactions'])
            ->orderBy('ordered_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return OrderResource::collection($orders);
    }

    public function store(StoreOrderRequest $request): OrderResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $order = $this->orderService->create($data);

        return new OrderResource($order->load(['merchant', 'category', 'items.latestImageAsset'])->loadCount(['items', 'transactions']));
    }

    public function show(Request $request, Order $order): OrderResource
    {
        $this->authorize('view', $order);

        $order->load(['merchant', 'category', 'items.latestImageAsset'])
            ->loadCount(['items', 'transactions']);

        return new OrderResource($order);
    }

    public function update(UpdateOrderRequest $request, Order $order): OrderResource
    {
        $this->authorize('update', $order);

        $order = $this->orderService->update($order, $request->validated());

        return new OrderResource($order->load(['merchant', 'category', 'items.latestImageAsset'])->loadCount(['items', 'transactions']));
    }

    public function destroy(Request $request, Order $order): JsonResponse
    {
        $this->authorize('delete', $order);

        $this->orderService->delete($order);

        return response()->json(['message' => 'Order deleted successfully']);
    }

    public function transactions(Request $request, Order $order): AnonymousResourceCollection
    {
        $this->authorize('view', $order);

        $transactions = $order->transactions()
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return TransactionResource::collection($transactions);
    }

    public function linkTransaction(LinkOrderTransactionRequest $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        $transaction = Transaction::query()
            ->where('user_id', $request->user()->id)
            ->whereKey((int) $request->validated()['transaction_id'])
            ->firstOrFail();

        if ($transaction->transactionable_type || $transaction->transactionable_id) {
            return response()->json([
                'message' => 'This transaction is already linked to another record.',
            ], 422);
        }

        $transaction->update([
            'transactionable_type' => $order->getMorphClass(),
            'transactionable_id' => $order->id,
        ]);

        return response()->json([
            'message' => 'Transaction linked to order.',
            'transaction' => new TransactionResource($transaction->fresh()->load([
                'category',
                'merchant',
                'fromAccount',
                'toAccount',
                'fromCard',
                'toCard',
            ])),
        ]);
    }
}
