<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PayCardRequest;
use App\Http\Requests\Api\StoreCardRequest;
use App\Http\Requests\Api\UpdateCardRequest;
use App\Http\Resources\CardResource;
use App\Http\Resources\TransactionResource;
use App\Models\BankAccount;
use App\Models\Card;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class CardController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->cards()->with('bankAccount');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $cards = $query->orderBy('is_default', 'desc')
            ->orderBy('type')
            ->orderBy('card_holder_name')
            ->get();

        return CardResource::collection($cards);
    }

    public function store(StoreCardRequest $request): CardResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        if ($data['is_default'] ?? false) {
            $request->user()->cards()->update(['is_default' => false]);
        }

        $card = Card::create($data);
        $card->load('bankAccount');

        return new CardResource($card);
    }

    public function show(Request $request, Card $card): CardResource
    {
        $this->authorize('view', $card);

        $card->load('bankAccount');

        return new CardResource($card);
    }

    public function update(UpdateCardRequest $request, Card $card): CardResource
    {
        $this->authorize('update', $card);

        $data = $request->validated();

        if ($data['is_default'] ?? false) {
            $request->user()->cards()->where('id', '!=', $card->id)->update(['is_default' => false]);
        }

        $card->update($data);
        $card->load('bankAccount');

        return new CardResource($card);
    }

    public function destroy(Request $request, Card $card): JsonResponse
    {
        $this->authorize('delete', $card);

        $card->delete();

        return response()->json(['message' => 'Card deleted successfully']);
    }

    public function setDefault(Request $request, Card $card): CardResource
    {
        $this->authorize('update', $card);

        $request->user()->cards()->update(['is_default' => false]);
        $card->update(['is_default' => true]);

        return new CardResource($card);
    }

    public function payBalance(PayCardRequest $request, Card $card): TransactionResource
    {
        $this->authorize('update', $card);

        if (! $card->isCredit()) {
            abort(422, 'Only credit cards can have their balance paid.');
        }

        $data = $request->validated();
        $fromAccount = BankAccount::findOrFail($data['from_account_id']);

        $this->authorize('view', $fromAccount);

        if ($fromAccount->balance < $data['amount']) {
            abort(422, 'Insufficient balance in the source account.');
        }

        $transaction = DB::transaction(function () use ($request, $card, $fromAccount, $data) {
            $fromAccount->decrement('balance', $data['amount']);
            $card->decrement('current_balance', $data['amount']);

            return Transaction::create([
                'user_id' => $request->user()->id,
                'type' => 'card_payment',
                'amount' => $data['amount'],
                'currency' => $fromAccount->currency,
                'title' => 'Credit Card Payment - '.$card->card_network.' ****'.$card->last_four_digits,
                'description' => $data['description'] ?? null,
                'transaction_date' => $data['transaction_date'] ?? now(),
                'from_account_id' => $fromAccount->id,
                'to_card_id' => $card->id,
            ]);
        });

        $transaction->load(['fromAccount', 'toCard']);

        return new TransactionResource($transaction);
    }

    public function transactions(Request $request, Card $card): AnonymousResourceCollection
    {
        $this->authorize('view', $card);

        $transactions = $card->user->transactions()
            ->where(function ($query) use ($card) {
                $query->where('from_card_id', $card->id)
                    ->orWhere('to_card_id', $card->id);
            })
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return TransactionResource::collection($transactions);
    }
}
