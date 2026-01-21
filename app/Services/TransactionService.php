<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TransactionService
{
    public function getFilteredTransactions(Request $request, int $userId): LengthAwarePaginator
    {
        $query = Transaction::where('user_id', $userId)
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

        if ($request->has('account_id')) {
            $accountId = $request->account_id;
            $query->where(function ($q) use ($accountId) {
                $q->where('from_account_id', $accountId)
                    ->orWhere('to_account_id', $accountId);
            });
        }

        if ($request->has('card_id')) {
            $cardId = $request->card_id;
            $query->where(function ($q) use ($cardId) {
                $q->where('from_card_id', $cardId)
                    ->orWhere('to_card_id', $cardId);
            });
        }

        // Support both from_date/to_date and date_from/date_to parameter names
        $fromDate = $request->get('from_date') ?? $request->get('date_from');
        $toDate = $request->get('to_date') ?? $request->get('date_to');

        if ($fromDate) {
            $query->where('transaction_date', '>=', $fromDate);
        }

        if ($toDate) {
            $query->where('transaction_date', '<=', $toDate);
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
        $sortDir = strtolower($request->get('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        // Use DATE() for transaction_date to ignore any time component
        if ($sortBy === 'transaction_date') {
            $query->orderByRaw('DATE(transaction_date) '.$sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        // Secondary sort to ensure consistent ordering within same-day transactions.
        // Use created_at for chronological order of entry, then id as final tiebreaker.
        if ($sortBy !== 'created_at') {
            $query->orderBy('created_at', $sortDir);
        }
        if ($sortBy !== 'id') {
            $query->orderBy('id', $sortDir);
        }

        return $query->paginate($request->get('per_page', 20));
    }

    public function createTransaction(array $data): Transaction
    {
        return DB::transaction(function () use ($data) {
            $transaction = Transaction::create($data);
            $this->updateBalances($transaction);

            return $transaction;
        });
    }

    public function updateTransaction(Transaction $transaction, array $data): Transaction
    {
        $oldTransaction = $transaction->replicate();

        return DB::transaction(function () use ($transaction, $oldTransaction, $data) {
            $this->reverseBalances($oldTransaction);
            $transaction->update($data);
            $this->updateBalances($transaction->fresh());

            return $transaction;
        });
    }

    public function deleteTransaction(Transaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $this->reverseBalances($transaction);
            $transaction->delete();
        });
    }

    public function updateBalances(Transaction $transaction): void
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
                        $card->increment('current_balance', $amount);
                    } elseif ($card->isDebit() && $card->bank_account_id) {
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
                        $card->decrement('current_balance', $amount);
                    } elseif ($card->isDebit() && $card->bank_account_id) {
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

    public function reverseBalances(Transaction $transaction): void
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
                        $card->decrement('current_balance', $amount);
                    } elseif ($card && $card->isDebit() && $card->bank_account_id) {
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
                        $card->increment('current_balance', $amount);
                    } elseif ($card && $card->isDebit() && $card->bank_account_id) {
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
