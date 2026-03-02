<?php

namespace App\Http\Controllers;

use App\Http\Resources\BankAccountResource;
use App\Http\Resources\BudgetResource;
use App\Http\Resources\RecurringIncomeResource;
use App\Http\Resources\SubscriptionResource;
use App\Http\Resources\TransactionResource;
use App\Models\BankAccount;
use App\Models\Budget;
use App\Models\RecurringIncome;
use App\Models\Subscription;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // 1. Accounts
        $accounts = BankAccount::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        // 2. Recent Transactions (Top 5)
        $transactions = Transaction::where('user_id', $user->id)
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // 3. Upcoming Subscriptions (Next 14 days)
        $upcomingSubscriptions = Subscription::where('user_id', $user->id)
            ->dueSoon(14)
            ->with(['merchant', 'category', 'paymentMethod'])
            ->orderBy('next_billing_date')
            ->get();

        // 4. Upcoming Income (Next 14 days)
        $upcomingIncome = RecurringIncome::where('user_id', $user->id)
            ->expectedSoon(14)
            ->with(['category', 'toAccount'])
            ->orderBy('next_expected_date')
            ->get();

        // 5. Budgets (Active, Limit 5)
        $budgets = Budget::where('user_id', $user->id)
            ->active()
            ->with(['category'])
            ->orderBy('current_period_end')
            ->orderBy('name')
            ->take(5)
            ->get();

        // 6. Budgets Health (All active)
        $allActiveBudgets = Budget::where('user_id', $user->id)
            ->active()
            ->with('category')
            ->get();

        $budgetsAtRisk = $allActiveBudgets
            ->filter(fn (Budget $budget) => $budget->isNearLimit() || $budget->isOverBudget())
            ->values();

        return Inertia::render('dashboard', [
            'accounts' => BankAccountResource::collection($accounts),
            'transactions' => TransactionResource::collection($transactions),
            'upcomingSubscriptions' => SubscriptionResource::collection($upcomingSubscriptions),
            'upcomingIncome' => RecurringIncomeResource::collection($upcomingIncome),
            'budgets' => BudgetResource::collection($budgets),
            'budgetsAtRisk' => BudgetResource::collection($budgetsAtRisk),
        ]);
    }
}
