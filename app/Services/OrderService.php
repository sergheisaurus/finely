<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(
        protected TransactionService $transactionService,
    ) {}

    public function create(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'] ?? [];
            $createTransaction = (bool) ($data['create_transaction'] ?? false);
            $linkTransactionId = $data['link_transaction_id'] ?? null;
            $transactionData = $data['transaction'] ?? [];

            unset($data['items'], $data['create_transaction'], $data['transaction'], $data['link_transaction_id']);

            $order = new Order($data);
            $order->save();

            if (! empty($items)) {
                $this->syncItems($order, $items);
            }

            if ($createTransaction) {
                $this->createExpenseTransaction($order, $transactionData);
            }

            if ($linkTransactionId) {
                $this->linkExistingTransaction($order, (int) $linkTransactionId);
            }

            return $order;
        });
    }

    public function update(Order $order, array $data): Order
    {
        return DB::transaction(function () use ($order, $data) {
            $items = $data['items'] ?? null;
            unset($data['items']);

            $order->fill($data);
            $order->save();

            if ($items !== null) {
                $this->syncItems($order, $items);
            }

            return $order;
        });
    }

    public function delete(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->delete();
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    protected function syncItems(Order $order, array $items): void
    {
        $order->items()->delete();

        foreach ($items as $index => $itemData) {
            $quantity = (int) ($itemData['quantity'] ?? 1);
            $unitPrice = array_key_exists('unit_price', $itemData) && $itemData['unit_price'] !== null
                ? (float) $itemData['unit_price']
                : null;

            $amount = array_key_exists('amount', $itemData) && $itemData['amount'] !== null
                ? (float) $itemData['amount']
                : ($unitPrice !== null ? ($quantity * $unitPrice) : null);

            $order->items()->create([
                'name' => $itemData['name'],
                'quantity' => max(1, $quantity),
                'unit_price' => $unitPrice,
                'amount' => $amount,
                'product_url' => $itemData['product_url'] ?? null,
                'external_item_id' => $itemData['external_item_id'] ?? null,
                'ordered_at' => $itemData['ordered_at'] ?? null,
                'delivered_at' => $itemData['delivered_at'] ?? null,
                'returned_at' => $itemData['returned_at'] ?? null,
                'status' => $itemData['status'] ?? 'ordered',
                'sort_order' => $itemData['sort_order'] ?? $index,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $transactionData
     */
    protected function createExpenseTransaction(Order $order, array $transactionData): Transaction
    {
        $transactionDate = $order->ordered_at
            ? Carbon::parse($order->ordered_at)->toDateString()
            : now()->toDateString();

        $title = $order->merchant?->name
            ? "{$order->merchant->name} Order"
            : 'Order';

        if ($order->order_number) {
            $title .= " #{$order->order_number}";
        }

        return $this->transactionService->createTransaction([
            'user_id' => $order->user_id,
            'type' => 'expense',
            'amount' => $order->amount,
            'currency' => $order->currency,
            'title' => $title,
            'description' => $order->notes,
            'transaction_date' => $transactionDate,
            'from_account_id' => $transactionData['from_account_id'] ?? null,
            'from_card_id' => $transactionData['from_card_id'] ?? null,
            'category_id' => $order->category_id,
            'merchant_id' => $order->merchant_id,
            'transactionable_type' => $order->getMorphClass(),
            'transactionable_id' => $order->id,
        ]);
    }

    protected function linkExistingTransaction(Order $order, int $transactionId): Transaction
    {
        $transaction = Transaction::query()
            ->where('user_id', $order->user_id)
            ->whereKey($transactionId)
            ->firstOrFail();

        if ($transaction->transactionable_type || $transaction->transactionable_id) {
            throw new \RuntimeException('Transaction is already linked to another record.');
        }

        $transaction->update([
            'transactionable_type' => $order->getMorphClass(),
            'transactionable_id' => $order->id,
        ]);

        return $transaction;
    }
}
