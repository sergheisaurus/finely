<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreTransactionRequest;
use App\Http\Requests\Api\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()
            ->transactions()
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('merchant_id')) {
            $query->where('merchant_id', $request->merchant_id);
        }

        if ($request->has('from_date')) {
            $query->where('transaction_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->where('transaction_date', '<=', $request->to_date);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('min_amount')) {
            $query->where('amount', '>=', $request->min_amount);
        }

        if ($request->has('max_amount')) {
            $query->where('amount', '<=', $request->max_amount);
        }

        $sortBy = $request->get('sort_by', 'transaction_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        if ($sortBy !== 'created_at') {
            $query->orderBy('created_at', 'desc');
        }

        $transactions = $query->paginate($request->get('per_page', 20));

        return TransactionResource::collection($transactions);
    }

    public function store(StoreTransactionRequest $request): TransactionResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $transaction = DB::transaction(function () use ($data) {
            $transaction = Transaction::create($data);

            $this->updateBalances($transaction);

            return $transaction;
        });

        $transaction->load(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard']);

        return new TransactionResource($transaction);
    }

    public function show(Request $request, Transaction $transaction): TransactionResource
    {
        $this->authorize('view', $transaction);

        $transaction->load([
            'category.parent',
            'merchant',
            'fromAccount',
            'toAccount',
            'fromCard',
            'toCard',
            'attachments',
        ]);

        return new TransactionResource($transaction);
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): TransactionResource
    {
        $this->authorize('update', $transaction);

        $oldTransaction = $transaction->replicate();

        DB::transaction(function () use ($request, $transaction, $oldTransaction) {
            $this->reverseBalances($oldTransaction);
            $transaction->update($request->validated());
            $this->updateBalances($transaction->fresh());
        });

        $transaction->load(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard']);

        return new TransactionResource($transaction);
    }

    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorize('delete', $transaction);

        DB::transaction(function () use ($transaction) {
            $this->reverseBalances($transaction);
            $transaction->delete();
        });

        return response()->json(['message' => 'Transaction deleted successfully']);
    }

    private function updateBalances(Transaction $transaction): void
    {
        $amount = $transaction->amount;

        switch ($transaction->type) {
            case 'expense':
                if ($transaction->from_account_id) {
                    $transaction->fromAccount->decrement('balance', $amount);
                }
                if ($transaction->from_card_id) {
                    $card = $transaction->fromCard;
                    if ($card->isCredit()) {
                        // Credit card: increase card balance (debt)
                        $card->increment('current_balance', $amount);
                    } elseif ($card->isDebit() && $card->bank_account_id) {
                        // Debit card: decrease linked bank account balance
                        $card->bankAccount->decrement('balance', $amount);
                    }
                }
                break;

            case 'income':
                if ($transaction->to_account_id) {
                    $transaction->toAccount->increment('balance', $amount);
                }
                if ($transaction->to_card_id) {
                    $card = $transaction->toCard;
                    if ($card->isCredit()) {
                        // Credit card: decrease card balance (cashback/refund reduces debt)
                        $card->decrement('current_balance', $amount);
                    } elseif ($card->isDebit() && $card->bank_account_id) {
                        // Debit card: increase linked bank account balance
                        $card->bankAccount->increment('balance', $amount);
                    }
                }
                break;

            case 'transfer':
                if ($transaction->from_account_id) {
                    $transaction->fromAccount->decrement('balance', $amount);
                }
                if ($transaction->to_account_id) {
                    $transaction->toAccount->increment('balance', $amount);
                }
                break;

            case 'card_payment':
                if ($transaction->from_account_id) {
                    $transaction->fromAccount->decrement('balance', $amount);
                }
                if ($transaction->to_card_id) {
                    $transaction->toCard->decrement('current_balance', $amount);
                }
                break;
        }
    }

    private function reverseBalances(Transaction $transaction): void
    {
        $amount = $transaction->amount;

        switch ($transaction->type) {
            case 'expense':
                if ($transaction->from_account_id) {
                    $transaction->fromAccount->increment('balance', $amount);
                }
                if ($transaction->from_card_id) {
                    $card = $transaction->fromCard;
                    if ($card && $card->isCredit()) {
                        // Credit card: reverse by decreasing card balance
                        $card->decrement('current_balance', $amount);
                    } elseif ($card && $card->isDebit() && $card->bank_account_id) {
                        // Debit card: reverse by increasing linked bank account balance
                        $card->bankAccount->increment('balance', $amount);
                    }
                }
                break;

            case 'income':
                if ($transaction->to_account_id) {
                    $transaction->toAccount->decrement('balance', $amount);
                }
                if ($transaction->to_card_id) {
                    $card = $transaction->toCard;
                    if ($card && $card->isCredit()) {
                        // Credit card: reverse by increasing card balance
                        $card->increment('current_balance', $amount);
                    } elseif ($card && $card->isDebit() && $card->bank_account_id) {
                        // Debit card: reverse by decreasing linked bank account balance
                        $card->bankAccount->decrement('balance', $amount);
                    }
                }
                break;

            case 'transfer':
                if ($transaction->from_account_id) {
                    $transaction->fromAccount->increment('balance', $amount);
                }
                if ($transaction->to_account_id) {
                    $transaction->toAccount->decrement('balance', $amount);
                }
                break;

            case 'card_payment':
                if ($transaction->from_account_id) {
                    $transaction->fromAccount->increment('balance', $amount);
                }
                if ($transaction->to_card_id) {
                    $transaction->toCard->increment('current_balance', $amount);
                }
                break;
        }
    }
}
