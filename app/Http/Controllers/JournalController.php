<?php

namespace App\Http\Controllers;

use App\Http\Resources\BankAccountResource;
use App\Http\Resources\CardResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\MerchantResource;
use App\Http\Resources\TransactionResource;
use App\Models\BankAccount;
use App\Models\Card;
use App\Models\Category;
use App\Models\Merchant;
use App\Models\Transaction;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JournalController extends Controller
{
    public function __construct(
        protected TransactionService $transactionService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        $transactions = $this->transactionService->getFilteredTransactions($request, $user->id);

        $accounts = BankAccount::where('user_id', $user->id)->orderBy('name')->get();
        $cards = Card::whereHas('bankAccount', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orderBy('card_holder_name')->get(); 
          
        $categories = Category::with('parent')->orderBy('name')->get();
        $merchants = Merchant::orderBy('name')->get();

        return Inertia::render('journal/index', [
            'transactions' => TransactionResource::collection($transactions),
            'accounts' => BankAccountResource::collection($accounts),
            'cards' => CardResource::collection($cards),
            'categories' => CategoryResource::collection($categories),
            'merchants' => MerchantResource::collection($merchants),
            'filters' => $request->only([
                'search', 'type', 'category_id', 'merchant_id', 'account_id', 
                'date_from', 'date_to', 'sort_by', 'sort_dir', 'per_page'
            ]),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();

        $accounts = BankAccount::where('user_id', $user->id)->orderBy('name')->get();
        $cards = Card::whereHas('bankAccount', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orderBy('card_holder_name')->get();
        
        $categories = Category::with('parent')->orderBy('name')->get();
        $merchants = Merchant::orderBy('name')->get();

        return Inertia::render('journal/create', [
            'accounts' => BankAccountResource::collection($accounts),
            'cards' => CardResource::collection($cards),
            'categories' => CategoryResource::collection($categories),
            'merchants' => MerchantResource::collection($merchants),
        ]);
    }

    public function edit(Request $request, string $id): Response
    {
        $user = $request->user();
        $transaction = Transaction::where('user_id', $user->id)->findOrFail($id);

        $accounts = BankAccount::where('user_id', $user->id)->orderBy('name')->get();
        $cards = Card::whereHas('bankAccount', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orderBy('card_holder_name')->get();
        
        $categories = Category::with('parent')->orderBy('name')->get();
        $merchants = Merchant::orderBy('name')->get();

        return Inertia::render('journal/edit', [
            'transaction' => new TransactionResource($transaction),
            'accounts' => BankAccountResource::collection($accounts),
            'cards' => CardResource::collection($cards),
            'categories' => CategoryResource::collection($categories),
            'merchants' => MerchantResource::collection($merchants),
        ]);
    }
}
