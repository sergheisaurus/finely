<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\Budget;
use App\Models\Invoice;
use App\Models\RecurringIncome;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ForecastService
{
    private function parseBool(mixed $value, bool $default): bool
    {
        if ($value === null || $value === '') {
            return $default;
        }

        if (is_bool($value)) {
            return $value;
        }

        $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        return $parsed ?? $default;
    }

    /**
     * @return array{
     *   from: string,
     *   to: string,
     *   currency: string,
     *   starting_balance: float,
     *   projected_balance: float,
     *   points: array<int, array{
     *     date: string,
     *     balance: float,
     *     income: float,
     *     expenses: float,
     *     subscription_expenses: float,
     *     budget_expenses: float
     *     discretionary_expenses: float
     *   }>,
     *   totals: array{
     *     income: float,
     *     expenses: float,
     *     subscription_expenses: float,
     *     budget_expenses: float,
     *     discretionary_expenses: float,
     *     net: float
     *   }
     * }
     */
    public function getForecast(
        User $user,
        Carbon $from,
        Carbon $to,
        array $options = [],
    ): array {
        $includeBudgets = $this->parseBool($options['include_budgets'] ?? null, true);
        $includeSubscriptions = $this->parseBool($options['include_subscriptions'] ?? null, true);
        $includeRecurringIncomes = $this->parseBool($options['include_recurring_incomes'] ?? null, true);
        $includeDiscretionary = $this->parseBool($options['include_discretionary'] ?? null, false);

        $currency = (string) ($options['currency'] ?? 'CHF');

        $startingBalance = array_key_exists('starting_balance', $options)
            ? (float) $options['starting_balance']
            : (float) BankAccount::query()->where('user_id', $user->id)->sum('balance');

        $from = $from->copy()->startOfDay();
        $to = $to->copy()->startOfDay();

        $eventsIncome = [];
        $eventsSubExpenses = [];
        $dailyBudgetExpense = [];
        $dailyDiscretionaryExpense = [];
        $eventsScenarioIncome = [];
        $eventsScenarioExpenses = [];

        if ($includeRecurringIncomes) {
            $incomes = RecurringIncome::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->get();

            foreach ($incomes as $income) {
                foreach ($this->generateRecurringIncomeEvents($income, $from, $to) as $date => $amount) {
                    $eventsIncome[$date] = ($eventsIncome[$date] ?? 0.0) + $amount;
                }
            }
        }

        if ($includeSubscriptions) {
            $subs = Subscription::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->get();

            foreach ($subs as $sub) {
                foreach ($this->generateSubscriptionEvents($sub, $from, $to) as $date => $amount) {
                    $eventsSubExpenses[$date] = ($eventsSubExpenses[$date] ?? 0.0) + $amount;
                }
            }
        }

        $budgets = new Collection();
        $excludeBudgetCats = $this->parseBool(
            $options['discretionary_exclude_budget_categories'] ?? null,
            true,
        );

        if ($includeBudgets || ($includeDiscretionary && $excludeBudgetCats)) {
            $budgets = Budget::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->get();
        }

        if ($includeBudgets) {
            $dailyBudgetExpense = $this->distributeBudgetsPerDay($budgets, $from, $to);
        }

        if ($includeDiscretionary) {
            $dailyDiscretionaryExpense = $this->buildDiscretionaryDailyExpenses(
                $user,
                $from,
                $to,
                [
                    'lookback_days' => (int) ($options['discretionary_lookback_days'] ?? 90),
                    'method' => (string) ($options['discretionary_method'] ?? 'dow'),
                    'exclude_budget_categories' => $excludeBudgetCats,
                    'extra_exclude_category_ids' => is_array($options['discretionary_exclude_category_ids'] ?? null)
                        ? $options['discretionary_exclude_category_ids']
                        : [],
                    'active_budgets' => $budgets,
                ],
            );
        }

        $scenarioItems = $options['scenario_items'] ?? [];
        if (is_array($scenarioItems) && count($scenarioItems) > 0) {
            $scenario = $this->generateScenarioEvents($scenarioItems, $from, $to);
            $eventsScenarioIncome = $scenario['income'];
            $eventsScenarioExpenses = $scenario['expenses'];
        }

        $points = [];
        $runningBalance = $startingBalance;

        $totalIncome = 0.0;
        $totalExpenses = 0.0;
        $totalSubscriptionExpenses = 0.0;
        $totalBudgetExpenses = 0.0;
        $totalDiscretionaryExpenses = 0.0;

        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $key = $cursor->format('Y-m-d');

            $income = (float) ($eventsIncome[$key] ?? 0.0);
            $subExpense = (float) ($eventsSubExpenses[$key] ?? 0.0);
            $budgetExpense = (float) ($dailyBudgetExpense[$key] ?? 0.0);
            $discretionaryExpense = (float) ($dailyDiscretionaryExpense[$key] ?? 0.0);
            $scenarioIncome = (float) ($eventsScenarioIncome[$key] ?? 0.0);
            $scenarioExpense = (float) ($eventsScenarioExpenses[$key] ?? 0.0);

            $income += $scenarioIncome;
            $expenses = $subExpense + $budgetExpense + $discretionaryExpense + $scenarioExpense;

            $runningBalance += $income - $expenses;

            $totalIncome += $income;
            $totalSubscriptionExpenses += $subExpense;
            $totalBudgetExpenses += $budgetExpense;
            $totalDiscretionaryExpenses += $discretionaryExpense;
            $totalExpenses += $expenses;

            $points[] = [
                'date' => $key,
                'balance' => round($runningBalance, 2),
                'income' => round($income, 2),
                'expenses' => round($expenses, 2),
                'subscription_expenses' => round($subExpense, 2),
                'budget_expenses' => round($budgetExpense, 2),
                'discretionary_expenses' => round($discretionaryExpense, 2),
            ];

            $cursor->addDay();
        }

        $projectedBalance = count($points) > 0
            ? (float) $points[count($points) - 1]['balance']
            : $startingBalance;

        return [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'currency' => $currency,
            'starting_balance' => round($startingBalance, 2),
            'projected_balance' => round($projectedBalance, 2),
            'points' => $points,
            'totals' => [
                'income' => round($totalIncome, 2),
                'expenses' => round($totalExpenses, 2),
                'subscription_expenses' => round($totalSubscriptionExpenses, 2),
                'budget_expenses' => round($totalBudgetExpenses, 2),
                'discretionary_expenses' => round($totalDiscretionaryExpenses, 2),
                'net' => round($totalIncome - $totalExpenses, 2),
            ],
        ];
    }

    /**
     * @return array<string, float> map[YYYY-MM-DD] = amount
     */
    private function generateSubscriptionEvents(Subscription $subscription, Carbon $from, Carbon $to): array
    {
        $events = [];

        $date = $subscription->next_billing_date
            ? $subscription->next_billing_date->copy()
            : $subscription->calculateNextBillingDate();

        $guard = 0;
        while ($date->lt($from) && $guard < 5000) {
            $date = $subscription->calculateNextBillingDate($date);
            $guard++;
        }

        while ($date->lte($to)) {
            if ($subscription->end_date && $date->gt($subscription->end_date)) {
                break;
            }

            $events[$date->toDateString()] = (float) $subscription->amount;
            $date = $subscription->calculateNextBillingDate($date);
        }

        return $events;
    }

    /**
     * @return array<string, float> map[YYYY-MM-DD] = amount
     */
    private function generateRecurringIncomeEvents(RecurringIncome $income, Carbon $from, Carbon $to): array
    {
        $events = [];

        $date = $income->next_expected_date
            ? $income->next_expected_date->copy()
            : $income->calculateNextExpectedDate();

        $guard = 0;
        while ($date->lt($from) && $guard < 5000) {
            $date = $income->calculateNextExpectedDate($date);
            $guard++;
        }

        while ($date->lte($to)) {
            if ($income->end_date && $date->gt($income->end_date)) {
                break;
            }

            $events[$date->toDateString()] = (float) $income->amount;
            $date = $income->calculateNextExpectedDate($date);
        }

        return $events;
    }

    /**
     * Budgets are treated as "planned spend" and distributed evenly across days.
     *
     * @param  \Illuminate\Support\Collection<int, Budget>  $budgets
     * @return array<string, float> map[YYYY-MM-DD] = amount
     */
    private function distributeBudgetsPerDay($budgets, Carbon $from, Carbon $to): array
    {
        $daily = [];

        $monthCursor = $from->copy()->startOfMonth();
        $lastMonth = $to->copy()->startOfMonth();

        while ($monthCursor->lte($lastMonth)) {
            $monthStart = $monthCursor->copy()->startOfMonth();
            $monthEnd = $monthCursor->copy()->endOfMonth();

            $monthlyTotal = 0.0;
            foreach ($budgets as $budget) {
                if ($budget->start_date && $monthEnd->lt($budget->start_date)) {
                    continue;
                }
                if ($budget->end_date && $monthStart->gt($budget->end_date)) {
                    continue;
                }

                $monthlyTotal += $budget->getMonthlyEquivalent();
            }

            $daysInMonth = max(1, $monthCursor->daysInMonth);
            $perDay = $monthlyTotal / $daysInMonth;

            $dayCursor = $monthStart->copy();
            while ($dayCursor->lte($monthEnd)) {
                if ($dayCursor->lt($from) || $dayCursor->gt($to)) {
                    $dayCursor->addDay();
                    continue;
                }

                $key = $dayCursor->toDateString();
                $daily[$key] = ($daily[$key] ?? 0.0) + $perDay;
                $dayCursor->addDay();
            }

            $monthCursor->addMonth();
        }

        return $daily;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{income: array<string, float>, expenses: array<string, float>}
     */
    private function generateScenarioEvents(array $items, Carbon $from, Carbon $to): array
    {
        $income = [];
        $expenses = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $kind = (string) ($item['kind'] ?? '');
            $frequency = (string) ($item['frequency'] ?? '');
            $amount = (float) ($item['amount'] ?? 0);
            if ($amount <= 0) {
                continue;
            }

            $itemStart = isset($item['start_date']) && $item['start_date']
                ? Carbon::parse($item['start_date'])->startOfDay()
                : $from->copy();
            $itemEnd = isset($item['end_date']) && $item['end_date']
                ? Carbon::parse($item['end_date'])->startOfDay()
                : $to->copy();

            $effectiveFrom = $itemStart->gt($from) ? $itemStart->copy() : $from->copy();
            $effectiveTo = $itemEnd->lt($to) ? $itemEnd->copy() : $to->copy();

            if ($effectiveTo->lt($effectiveFrom)) {
                continue;
            }

            $dates = [];

            if ($frequency === 'once') {
                if (! isset($item['date']) || ! $item['date']) {
                    continue;
                }
                $d = Carbon::parse($item['date'])->startOfDay();
                if ($d->betweenIncluded($effectiveFrom, $effectiveTo)) {
                    $dates[] = $d;
                }
            } elseif ($frequency === 'weekly') {
                $targetDow = isset($item['day_of_week']) && is_numeric($item['day_of_week'])
                    ? (int) $item['day_of_week']
                    : $effectiveFrom->dayOfWeek;

                $cursor = $effectiveFrom->copy();
                while ($cursor->dayOfWeek !== $targetDow) {
                    $cursor->addDay();
                    if ($cursor->gt($effectiveTo)) {
                        break;
                    }
                }

                while ($cursor->lte($effectiveTo)) {
                    $dates[] = $cursor->copy();
                    $cursor->addWeek();
                }
            } elseif ($frequency === 'monthly') {
                $dom = isset($item['day_of_month']) && is_numeric($item['day_of_month'])
                    ? (int) $item['day_of_month']
                    : $effectiveFrom->day;

                $monthCursor = $effectiveFrom->copy()->startOfMonth();
                $lastMonth = $effectiveTo->copy()->startOfMonth();

                while ($monthCursor->lte($lastMonth)) {
                    $candidate = $monthCursor->copy();
                    $day = min(max(1, $dom), $candidate->daysInMonth);
                    $candidate->day($day);
                    if ($candidate->betweenIncluded($effectiveFrom, $effectiveTo)) {
                        $dates[] = $candidate;
                    }
                    $monthCursor->addMonth();
                }
            } elseif ($frequency === 'yearly') {
                $dom = isset($item['day_of_month']) && is_numeric($item['day_of_month'])
                    ? (int) $item['day_of_month']
                    : $effectiveFrom->day;

                $moy = isset($item['month_of_year']) && is_numeric($item['month_of_year'])
                    ? (int) $item['month_of_year']
                    : $effectiveFrom->month;
                $moy = min(12, max(1, $moy));

                $cursor = $effectiveFrom->copy()->startOfYear();
                $lastYear = $effectiveTo->copy()->startOfYear();

                while ($cursor->lte($lastYear)) {
                    $candidate = $cursor->copy();
                    $candidate->month($moy);
                    $day = min(max(1, $dom), $candidate->daysInMonth);
                    $candidate->day($day);
                    if ($candidate->betweenIncluded($effectiveFrom, $effectiveTo)) {
                        $dates[] = $candidate;
                    }
                    $cursor->addYear();
                }
            }

            foreach ($dates as $d) {
                $k = $d->toDateString();
                if ($kind === 'income') {
                    $income[$k] = ($income[$k] ?? 0.0) + $amount;
                } elseif ($kind === 'expense') {
                    $expenses[$k] = ($expenses[$k] ?? 0.0) + $amount;
                }
            }
        }

        return [
            'income' => $income,
            'expenses' => $expenses,
        ];
    }

    /**
     * Build daily expenses from historical discretionary spending.
     *
     * By default this excludes transactions generated by subscriptions/invoices
     * and also excludes categories that have an active budget (to avoid
     * double-counting planned spending).
     *
     * @return array<string, float> map[YYYY-MM-DD] = amount
     */
    private function buildDiscretionaryDailyExpenses(User $user, Carbon $from, Carbon $to, array $options): array
    {
        $lookbackDays = max(7, min(365, (int) ($options['lookback_days'] ?? 90)));
        $method = (string) ($options['method'] ?? 'dow');
        $excludeBudgetCategories = (bool) ($options['exclude_budget_categories'] ?? true);

        /** @var \Illuminate\Support\Collection<int, Budget> $activeBudgets */
        $activeBudgets = $options['active_budgets'] ?? new Collection();
        if (! $activeBudgets instanceof Collection) {
            $activeBudgets = new Collection();
        }
        $excludeCategoryIds = [];

        if ($excludeBudgetCategories) {
            $excludeCategoryIds = $activeBudgets
                ->pluck('category_id')
                ->filter(fn ($v) => is_int($v) && $v > 0)
                ->values()
                ->all();
        }

        $extraExclude = $options['extra_exclude_category_ids'] ?? [];
        if (is_array($extraExclude) && count($extraExclude) > 0) {
            foreach ($extraExclude as $id) {
                if (is_numeric($id) && (int) $id > 0) {
                    $excludeCategoryIds[] = (int) $id;
                }
            }
        }

        $excludeCategoryIds = array_values(array_unique($excludeCategoryIds));

        $historyFrom = now()->subDays($lookbackDays)->startOfDay();
        $historyTo = now()->subDay()->endOfDay();

        $q = \App\Models\Transaction::query()
            ->where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$historyFrom, $historyTo])
            ->where(function (Builder $qb) {
                $qb->whereNull('transactionable_type')
                    ->orWhereNotIn('transactionable_type', [Subscription::class, Invoice::class]);
            });

        if (count($excludeCategoryIds) > 0) {
            $q->where(function (Builder $qb) use ($excludeCategoryIds) {
                $qb->whereNull('category_id')
                    ->orWhereNotIn('category_id', $excludeCategoryIds);
            });
        }

        $transactions = $q->get(['amount', 'transaction_date']);

        // Build averages
        $daily = [];
        if ($method === 'flat') {
            $total = (float) $transactions->sum('amount');
            $perDay = $total / max(1, $lookbackDays);

            $cursor = $from->copy();
            while ($cursor->lte($to)) {
                $daily[$cursor->toDateString()] = $perDay;
                $cursor->addDay();
            }

            return $daily;
        }

        // Default: day-of-week profile
        $dowTotals = array_fill(0, 7, 0.0);
        foreach ($transactions as $t) {
            $dt = Carbon::parse($t->transaction_date);
            $dowTotals[$dt->dayOfWeek] += (float) $t->amount;
        }

        $dowDayCounts = array_fill(0, 7, 0);
        $cursor = $historyFrom->copy()->startOfDay();
        while ($cursor->lte($historyTo)) {
            $dowDayCounts[$cursor->dayOfWeek] += 1;
            $cursor->addDay();
        }

        $dowAvg = [];
        for ($i = 0; $i < 7; $i++) {
            $dowAvg[$i] = $dowTotals[$i] / max(1, $dowDayCounts[$i]);
        }

        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $daily[$cursor->toDateString()] = (float) $dowAvg[$cursor->dayOfWeek];
            $cursor->addDay();
        }

        return $daily;
    }
}
