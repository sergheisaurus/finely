<?php

namespace App\Http\Controllers;

use App\Http\Requests\Onboarding\StoreBankAccountRequest;
use App\Http\Requests\Onboarding\StoreCardsRequest;
use App\Http\Requests\Onboarding\StoreRecurringIncomeRequest;
use App\Http\Requests\Onboarding\StoreSubscriptionsRequest;
use App\Models\BankAccount;
use App\Models\Card;
use App\Models\Transaction;
use App\Services\RecurringIncomeService;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService,
        protected RecurringIncomeService $recurringIncomeService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('onboarding/wizard', [
            'user' => $user,
            'accounts' => $user->bankAccounts()->get(),
            'cards' => $user->cards()->with('bankAccount')->get(),
            'categories' => $user->categories()->get(),
            'merchants' => $user->merchants()->get(),
        ]);
    }

    public function storeAccount(StoreBankAccountRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $result = DB::transaction(function () use ($user, $data) {
            $openingBalance = $data['balance'] ?? 0;

            // Create the bank account with zero balance initially
            $account = BankAccount::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'type' => $data['type'],
                'balance' => 0,
                'currency' => $data['currency'] ?? 'CHF',
                'account_number' => $data['account_number'] ?? null,
                'bank_name' => $data['bank_name'] ?? null,
                'color' => $data['color'] ?? '#6366f1',
                'is_default' => true,
            ]);

            // Create opening balance transaction if balance > 0
            if ($openingBalance > 0) {
                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'income',
                    'amount' => $openingBalance,
                    'currency' => $data['currency'] ?? 'CHF',
                    'title' => 'Opening Balance',
                    'description' => 'Initial account balance',
                    'transaction_date' => now(),
                    'to_account_id' => $account->id,
                ]);

                $account->update(['balance' => $openingBalance]);
            }

            return $account;
        });

        return response()->json([
            'account' => $result,
            'message' => 'Bank account created successfully',
        ]);
    }

    public function storeCards(StoreCardsRequest $request): JsonResponse
    {
        $user = $request->user();
        $cards = $request->validated()['cards'] ?? [];

        $createdCards = [];
        foreach ($cards as $index => $cardData) {
            $createdCards[] = Card::create([
                'user_id' => $user->id,
                'bank_account_id' => $cardData['bank_account_id'] ?? null,
                'type' => $cardData['type'],
                'card_holder_name' => $cardData['card_holder_name'],
                'card_number' => $cardData['card_number'],
                'card_network' => $cardData['card_network'],
                'expiry_month' => $cardData['expiry_month'],
                'expiry_year' => $cardData['expiry_year'],
                'credit_limit' => $cardData['credit_limit'] ?? null,
                'current_balance' => $cardData['current_balance'] ?? 0,
                'color' => $cardData['color'] ?? '#1e293b',
                'is_default' => $index === 0,
            ]);
        }

        return response()->json([
            'cards' => $createdCards,
            'message' => 'Cards saved successfully',
        ]);
    }

    public function storeSubscriptions(StoreSubscriptionsRequest $request): JsonResponse
    {
        $user = $request->user();
        $subscriptions = $request->validated()['subscriptions'] ?? [];

        $created = [];
        foreach ($subscriptions as $subData) {
            $subData['user_id'] = $user->id;
            $created[] = $this->subscriptionService->create($subData);
        }

        return response()->json([
            'subscriptions' => $created,
            'message' => 'Subscriptions saved successfully',
        ]);
    }

    public function storeIncomes(StoreRecurringIncomeRequest $request): JsonResponse
    {
        $user = $request->user();
        $incomes = $request->validated()['incomes'] ?? [];

        $created = [];
        foreach ($incomes as $incomeData) {
            $incomeData['user_id'] = $user->id;
            $created[] = $this->recurringIncomeService->create($incomeData);
        }

        return response()->json([
            'incomes' => $created,
            'message' => 'Recurring incomes saved successfully',
        ]);
    }

    public function complete(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->bankAccounts()->count() === 0) {
            return response()->json([
                'message' => 'You must create at least one bank account',
            ], 422);
        }

        $user->update(['onboarding_completed_at' => now()]);

        return response()->json([
            'message' => 'Onboarding completed!',
            'redirect' => route('dashboard'),
        ]);
    }

    public function skip(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->update(['onboarding_completed_at' => now()]);

        return response()->json([
            'message' => 'Onboarding skipped',
            'redirect' => route('dashboard'),
        ]);
    }
}
