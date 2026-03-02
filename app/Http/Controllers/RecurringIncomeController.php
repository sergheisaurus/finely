<?php

namespace App\Http\Controllers;

use App\Http\Resources\RecurringIncomeResource;
use App\Models\RecurringIncome;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecurringIncomeController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Fetch all recurring incomes
        $incomes = RecurringIncome::where('user_id', $user->id)
            ->with(['category', 'toAccount'])
            ->withCount('transactions')
            ->orderBy('next_expected_date')
            ->get();

        // Calculate stats
        $activeIncomes = $incomes->where('is_active', true);

        $monthlyTotal = $activeIncomes->sum(fn ($income) => $income->getMonthlyEquivalent());
        $yearlyTotal = $activeIncomes->sum(fn ($income) => $income->getYearlyTotal());

        $expectedThisWeek = $activeIncomes->filter(fn ($income) => $income->isExpectedSoon(7))->count();
        $overdueCount = $activeIncomes->filter(fn ($income) => $income->isOverdue())->count();

        $stats = [
            'active_count' => $activeIncomes->count(),
            'monthly_total' => round($monthlyTotal, 2),
            'yearly_total' => round($yearlyTotal, 2),
            'expected_this_week' => $expectedThisWeek,
            'overdue_count' => $overdueCount,
        ];

        return Inertia::render('income/index', [
            'incomes' => RecurringIncomeResource::collection($incomes),
            'stats' => $stats,
        ]);
    }
}
