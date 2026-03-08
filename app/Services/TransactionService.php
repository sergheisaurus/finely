<?php

namespace App\Services;

use App\Models\RecurringIncome;
use App\Models\Transaction;
use App\Support\SecretMode;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransactionService
{
    public function __construct(
        protected RecurringIncomeService $recurringIncomeService
    ) {}

    public function getFilteredTransactions(Request $request, int $userId): LengthAwarePaginator
    {
        $isSecretMode = SecretMode::isActive($request);

        $query = Transaction::where('user_id', $userId)
            ->with([
                'category',
                'merchant',
                'secretCategory',
                'secretMerchant',
                'fromAccount',
                'toAccount',
                'fromCard',
                'toCard',
            ]);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('category_id')) {
            $query->where(function ($subQuery) use ($request, $isSecretMode) {
                $subQuery->where('category_id', $request->category_id);

                if ($isSecretMode) {
                    $subQuery->orWhere('secret_category_id', $request->category_id);
                }
            });
        }

        if ($request->has('merchant_id')) {
            $query->where(function ($subQuery) use ($request, $isSecretMode) {
                $subQuery->where('merchant_id', $request->merchant_id);

                if ($isSecretMode) {
                    $subQuery->orWhere('secret_merchant_id', $request->merchant_id);
                }
            });
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
            $query->where(function ($q) use ($search, $isSecretMode) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('amount', 'like', "%{$search}%");

                if ($isSecretMode) {
                    $q->orWhere('secret_title', 'like', "%{$search}%");
                }
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
            $splits = $data['splits'] ?? [];
            unset($data['splits']);

            if ($splits === []) {
                $transaction = Transaction::create($data);
                $this->updateBalances($transaction);

                return $transaction;
            }

            return $this->persistSplitTransactionSet($data, $splits);
        });
    }

    public function getSplitGroupTransactions(Transaction $transaction): EloquentCollection
    {
        $groupId = $this->extractSplitGroupId($transaction);

        if (! $groupId) {
            return new EloquentCollection([$transaction]);
        }

        return Transaction::query()
            ->where('user_id', $transaction->user_id)
            ->where('metadata->split->group_id', $groupId)
            ->orderByRaw("CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.split.index')) AS UNSIGNED)")
            ->get();
    }

    public function hasSplitGroup(Transaction $transaction): bool
    {
        return $this->extractSplitGroupId($transaction) !== null;
    }

    public function updateTransaction(Transaction $transaction, array $data): Transaction
    {
        $hasExistingSplitGroup = $this->hasSplitGroup($transaction);
        $hasSplitPayload = array_key_exists('splits', $data);

        if ($hasExistingSplitGroup || $hasSplitPayload) {
            return $this->updateSplitAwareTransaction($transaction, $data);
        }

        $oldTransaction = $transaction->replicate();
        $oldRecurringIncome = $this->resolveRecurringIncome($transaction);

        return DB::transaction(function () use ($transaction, $oldTransaction, $oldRecurringIncome, $data) {
            $this->reverseBalances($oldTransaction);
            $transaction->update($data);
            $updated = $transaction->fresh();
            $this->updateBalances($updated);

            $newRecurringIncome = $this->resolveRecurringIncome($updated);
            if ($oldRecurringIncome && (! $newRecurringIncome || $newRecurringIncome->id !== $oldRecurringIncome->id)) {
                $this->recurringIncomeService->recalculateScheduleFromTransactions($oldRecurringIncome);
            }
            if ($newRecurringIncome) {
                $this->recurringIncomeService->recalculateScheduleFromTransactions($newRecurringIncome);
            }

            return $transaction;
        });
    }

    public function deleteTransaction(Transaction $transaction): void
    {
        $transactions = $this->getSplitGroupTransactions($transaction);
        $linkedIncomes = $transactions
            ->map(fn (Transaction $item) => $this->resolveRecurringIncome($item))
            ->filter()
            ->unique(fn (RecurringIncome $income) => $income->id)
            ->values();

        DB::transaction(function () use ($transactions) {
            foreach ($transactions as $item) {
                $this->reverseBalances($item);
                $item->delete();
            }
        });

        foreach ($linkedIncomes as $income) {
            $this->recurringIncomeService->recalculateScheduleFromTransactions($income);
        }
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

    private function updateSplitAwareTransaction(Transaction $transaction, array $data): Transaction
    {
        $existingTransactions = $this->getSplitGroupTransactions($transaction);
        $linkedIncomes = $existingTransactions
            ->map(fn (Transaction $item) => $this->resolveRecurringIncome($item))
            ->filter()
            ->unique(fn (RecurringIncome $income) => $income->id)
            ->values();

        return DB::transaction(function () use ($transaction, $data, $existingTransactions, $linkedIncomes) {
            $splits = $data['splits'] ?? [];
            unset($data['splits']);

            $baseData = $this->buildTransactionPersistenceData($transaction, $data);
            $groupId = $this->extractSplitGroupId($transaction) ?? (count($splits) > 0 ? (string) Str::uuid() : null);

            foreach ($existingTransactions as $existingTransaction) {
                $this->reverseBalances($existingTransaction);
                $existingTransaction->delete();
            }

            $updatedTransaction = count($splits) > 0
                ? $this->persistSplitTransactionSet($baseData, $splits, $groupId)
                : tap(Transaction::create($baseData), fn (Transaction $created) => $this->updateBalances($created));

            $newRecurringIncome = $this->resolveRecurringIncome($updatedTransaction);

            foreach ($linkedIncomes as $income) {
                if (! $newRecurringIncome || $income->id !== $newRecurringIncome->id) {
                    $this->recurringIncomeService->recalculateScheduleFromTransactions($income);
                }
            }

            if ($newRecurringIncome) {
                $this->recurringIncomeService->recalculateScheduleFromTransactions($newRecurringIncome);
            }

            return $updatedTransaction;
        });
    }

    private function persistSplitTransactionSet(
        array $data,
        array $splits,
        ?string $groupId = null,
    ): Transaction {
        $totalAmount = round((float) $data['amount'], 2);
        $splitTotal = round(array_reduce(
            $splits,
            fn (float $total, array $split) => $total + (float) $split['amount'],
            0.0,
        ), 2);
        $remainingAmount = round($totalAmount - $splitTotal, 2);
        $splitGroupId = $groupId ?? (string) Str::uuid();

        $transactions = [];
        $payloads = [
            [
                ...$data,
                'amount' => $remainingAmount,
                'metadata' => $this->mergeSplitMetadata(
                    $data['metadata'] ?? null,
                    $splitGroupId,
                    1,
                    count($splits) + 1,
                    $totalAmount,
                    $remainingAmount,
                ),
            ],
        ];

        foreach ($splits as $index => $split) {
            $payloads[] = [
                ...$data,
                'amount' => round((float) $split['amount'], 2),
                'category_id' => $split['category_id'],
                'metadata' => $this->mergeSplitMetadata(
                    $data['metadata'] ?? null,
                    $splitGroupId,
                    $index + 2,
                    count($splits) + 1,
                    $totalAmount,
                    round((float) $split['amount'], 2),
                ),
            ];
        }

        foreach ($payloads as $payload) {
            $createdTransaction = Transaction::create($payload);
            $this->updateBalances($createdTransaction);
            $transactions[] = $createdTransaction;
        }

        return $transactions[0];
    }

    private function buildTransactionPersistenceData(Transaction $transaction, array $data): array
    {
        $baseData = [
            'user_id' => $transaction->user_id,
            'type' => $transaction->type,
            'amount' => (float) $transaction->amount,
            'currency' => $transaction->currency,
            'title' => $transaction->title,
            'description' => $transaction->description,
            'transaction_date' => $transaction->transaction_date->format('Y-m-d'),
            'from_account_id' => $transaction->from_account_id,
            'from_card_id' => $transaction->from_card_id,
            'to_account_id' => $transaction->to_account_id,
            'to_card_id' => $transaction->to_card_id,
            'category_id' => $transaction->category_id,
            'merchant_id' => $transaction->merchant_id,
            'transactionable_type' => $transaction->transactionable_type,
            'transactionable_id' => $transaction->transactionable_id,
            'secret_title' => $transaction->secret_title,
            'secret_category_id' => $transaction->secret_category_id,
            'secret_merchant_id' => $transaction->secret_merchant_id,
            'metadata' => $this->removeSplitMetadata($transaction->metadata),
        ];

        $merged = array_merge($baseData, $data);
        $merged['metadata'] = $this->removeSplitMetadata($merged['metadata'] ?? null);

        return $merged;
    }

    private function extractSplitGroupId(Transaction $transaction): ?string
    {
        $groupId = $transaction->metadata['split']['group_id'] ?? null;

        return is_string($groupId) && $groupId !== '' ? $groupId : null;
    }

    private function removeSplitMetadata(mixed $metadata): ?array
    {
        if (! is_array($metadata)) {
            return null;
        }

        unset($metadata['split']);

        return $metadata === [] ? null : $metadata;
    }

    private function resolveRecurringIncome(Transaction $transaction): ?RecurringIncome
    {
        if ($transaction->transactionable_type !== (new RecurringIncome)->getMorphClass()) {
            return null;
        }

        return RecurringIncome::query()
            ->where('id', $transaction->transactionable_id)
            ->first();
    }

    private function mergeSplitMetadata(
        mixed $metadata,
        string $groupId,
        int $index,
        int $count,
        float $totalAmount,
        float $allocatedAmount,
    ): array {
        $baseMetadata = is_array($metadata) ? $metadata : [];

        $baseMetadata['split'] = [
            'group_id' => $groupId,
            'index' => $index,
            'count' => $count,
            'total_amount' => $totalAmount,
            'allocated_amount' => $allocatedAmount,
        ];

        return $baseMetadata;
    }
}
