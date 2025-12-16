<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\TransferRequest;
use App\Http\Resources\TransactionResource;
use App\Models\BankAccount;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    public function store(TransferRequest $request): TransactionResource
    {
        $data = $request->validated();

        $fromAccount = BankAccount::findOrFail($data['from_account_id']);
        $toAccount = BankAccount::findOrFail($data['to_account_id']);

        $this->authorize('view', $fromAccount);
        $this->authorize('view', $toAccount);

        if ($fromAccount->balance < $data['amount']) {
            abort(422, 'Insufficient balance in the source account.');
        }

        $transaction = DB::transaction(function () use ($request, $fromAccount, $toAccount, $data) {
            $fromAccount->decrement('balance', $data['amount']);
            $toAccount->increment('balance', $data['amount']);

            return Transaction::create([
                'user_id' => $request->user()->id,
                'type' => 'transfer',
                'amount' => $data['amount'],
                'currency' => $fromAccount->currency,
                'title' => $data['title'] ?? "Transfer: {$fromAccount->name} → {$toAccount->name}",
                'description' => $data['description'] ?? null,
                'transaction_date' => $data['transaction_date'] ?? now(),
                'from_account_id' => $fromAccount->id,
                'to_account_id' => $toAccount->id,
            ]);
        });

        $transaction->load(['fromAccount', 'toAccount']);

        return new TransactionResource($transaction);
    }
}
