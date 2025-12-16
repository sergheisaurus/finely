<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBankAccountRequest;
use App\Http\Requests\Api\UpdateBankAccountRequest;
use App\Http\Resources\BankAccountResource;
use App\Http\Resources\TransactionResource;
use App\Models\BankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BankAccountController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $accounts = $request->user()
            ->bankAccounts()
            ->withCount('cards')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return BankAccountResource::collection($accounts);
    }

    public function store(StoreBankAccountRequest $request): BankAccountResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        if ($data['is_default'] ?? false) {
            $request->user()->bankAccounts()->update(['is_default' => false]);
        }

        $account = BankAccount::create($data);

        return new BankAccountResource($account);
    }

    public function show(Request $request, BankAccount $account): BankAccountResource
    {
        $this->authorize('view', $account);

        $account->load('cards');
        $account->loadCount('cards');

        return new BankAccountResource($account);
    }

    public function update(UpdateBankAccountRequest $request, BankAccount $account): BankAccountResource
    {
        $this->authorize('update', $account);

        $data = $request->validated();

        if ($data['is_default'] ?? false) {
            $request->user()->bankAccounts()->where('id', '!=', $account->id)->update(['is_default' => false]);
        }

        $account->update($data);

        return new BankAccountResource($account);
    }

    public function destroy(Request $request, BankAccount $account): JsonResponse
    {
        $this->authorize('delete', $account);

        $account->delete();

        return response()->json(['message' => 'Account deleted successfully']);
    }

    public function setDefault(Request $request, BankAccount $account): BankAccountResource
    {
        $this->authorize('update', $account);

        $request->user()->bankAccounts()->update(['is_default' => false]);
        $account->update(['is_default' => true]);

        return new BankAccountResource($account);
    }

    public function transactions(Request $request, BankAccount $account): AnonymousResourceCollection
    {
        $this->authorize('view', $account);

        $transactions = $account->user->transactions()
            ->where(function ($query) use ($account) {
                $query->where('from_account_id', $account->id)
                    ->orWhere('to_account_id', $account->id);
            })
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return TransactionResource::collection($transactions);
    }
}
