<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreTransactionRequest;
use App\Http\Requests\Api\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TransactionController extends Controller
{
    public function __construct(
        protected TransactionService $transactionService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $transactions = $this->transactionService->getFilteredTransactions($request, $request->user()->id);

        return TransactionResource::collection($transactions);
    }

    public function store(StoreTransactionRequest $request): TransactionResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $transaction = $this->transactionService->createTransaction($data);

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

        $transaction = $this->transactionService->updateTransaction($transaction, $request->validated());

        $transaction->load(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard']);

        return new TransactionResource($transaction);
    }

    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorize('delete', $transaction);

        $this->transactionService->deleteTransaction($transaction);

        return response()->json(['message' => 'Transaction deleted successfully']);
    }
}
