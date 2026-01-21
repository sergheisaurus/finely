<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\Budget;
use App\Models\Card;
use App\Models\Category;
use App\Models\Merchant;
use App\Models\RecurringIncome;
use App\Models\Subscription;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    /**
     * Cache TTL in seconds (15 minutes for most stats, 5 minutes for real-time data)
     */
    private const CACHE_TTL = 900; // 15 minutes
    private const CACHE_TTL_REALTIME = 300; // 5 minutes

    /**
     * Get a comprehensive financial snapshot for the user
     */
    public function getFinancialSnapshot(User $user, array $filters = []): array
    {
        $cacheKey = $this->getCacheKey('snapshot', $user->id, $filters);

        return Cache::remember($cacheKey, self::CACHE_TTL_REALTIME, function () use ($user, $filters) {
            $dateRange = $this->parseDateFilters($filters);

            // Get total balance across all accounts
            $totalBalance = BankAccount::where('user_id', $user->id)
                ->sum('balance');

            // Get total income for the period
            $totalIncome = Transaction::where('user_id', $user->id)
                ->where('type', 'income')
                ->when($dateRange, function ($q) use ($dateRange) {
                    return $q->whereBetween('transaction_date', [$dateRange['from'], $dateRange['to']]);
                })
                ->sum('amount');

            // Get total expenses for the period
            $totalExpenses = Transaction::where('user_id', $user->id)
                ->where('type', 'expense')
                ->when($dateRange, function ($q) use ($dateRange) {
                    return $q->whereBetween('transaction_date', [$dateRange['from'], $dateRange['to']]);
                })
                ->sum('amount');

            // Calculate net savings
            $netSavings = $totalIncome - $totalExpenses;
            $savingsRate = $totalIncome > 0 ? ($netSavings / $totalIncome) * 100 : 0;

            // Get previous period data for comparison
            $previousPeriod = $this->getPreviousPeriod($dateRange);
            $previousIncome = Transaction::where('user_id', $user->id)
                ->where('type', 'income')
                ->whereBetween('transaction_date', [$previousPeriod['from'], $previousPeriod['to']])
                ->sum('amount');

            $previousExpenses = Transaction::where('user_id', $user->id)
                ->where('type', 'expense')
                ->whereBetween('transaction_date', [$previousPeriod['from'], $previousPeriod['to']])
                ->sum('amount');

            return [
                'total_balance' => (float) $totalBalance,
                'total_income' => (float) $totalIncome,
                'total_expenses' => (float) $totalExpenses,
                'net_savings' => (float) $netSavings,
                'savings_rate' => round($savingsRate, 2),
                'income_trend' => $this->calculateTrend($totalIncome, $previousIncome),
                'expenses_trend' => $this->calculateTrend($totalExpenses, $previousExpenses),
                'period_days' => $dateRange ? $dateRange['from']->diffInDays($dateRange['to']) + 1 : 0,
            ];
        });
    }

    /**
     * Get net worth trend over time
     */
    public function getNetWorthTrend(User $user, string $groupBy = 'day', array $filters = []): array
    {
        $cacheKey = $this->getCacheKey('net_worth_trend', $user->id, array_merge($filters, ['group_by' => $groupBy]));

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $groupBy, $filters) {
            $dateRange = $this->parseDateFilters($filters);

            // Get all accounts balances (current snapshot)
            $currentBalance = BankAccount::where('user_id', $user->id)->sum('balance');

            // Calculate historical balance by subtracting/adding transactions
            $transactions = Transaction::where('user_id', $user->id)
                ->when($dateRange, function ($q) use ($dateRange) {
                    return $q->whereBetween('transaction_date', [$dateRange['from'], $dateRange['to']]);
                })
                ->orderBy('transaction_date', 'asc')
                ->get();

            $dateFormat = $this->getDateFormatForGrouping($groupBy);
            $trend = [];
            $runningBalance = $currentBalance;

            // Work backwards from current balance
            $groupedTransactions = $transactions->groupBy(function ($transaction) use ($dateFormat) {
                return Carbon::parse($transaction->transaction_date)->format($dateFormat);
            });

            foreach ($groupedTransactions as $period => $periodTransactions) {
                $periodChange = 0;
                foreach ($periodTransactions as $transaction) {
                    if ($transaction->type === 'income') {
                        $periodChange += $transaction->amount;
                    } elseif ($transaction->type === 'expense') {
                        $periodChange -= $transaction->amount;
                    }
                }

                $trend[] = [
                    'period' => $period,
                    'balance' => (float) $runningBalance,
                    'change' => (float) $periodChange,
                ];
            }

            return $trend;
        });
    }

    /**
     * Get cash flow analysis (income vs expenses over time)
     */
    public function getCashFlowAnalysis(User $user, string $groupBy = 'month', array $filters = []): array
    {
        $cacheKey = $this->getCacheKey('cash_flow', $user->id, array_merge($filters, ['group_by' => $groupBy]));

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $groupBy, $filters) {
            $dateRange = $this->parseDateFilters($filters);
            $dateFormatSql = $this->getDbDateFormatSql($groupBy);

            $cashFlow = Transaction::where('user_id', $user->id)
                ->whereIn('type', ['income', 'expense'])
                ->when($dateRange, function ($q) use ($dateRange) {
                    return $q->whereBetween('transaction_date', [$dateRange['from'], $dateRange['to']]);
                })
                ->select(
                    DB::raw("{$dateFormatSql} as period"),
                    'type',
                    DB::raw('SUM(amount) as total')
                )
                ->groupBy('period', 'type')
                ->orderBy('period', 'asc')
                ->get();

            // Restructure data for charting
            $result = [];
            foreach ($cashFlow as $item) {
                if (!isset($result[$item->period])) {
                    $result[$item->period] = [
                        'period' => $item->period,
                        'income' => 0,
                        'expenses' => 0,
                        'net_flow' => 0,
                    ];
                }

                if ($item->type === 'income') {
                    $result[$item->period]['income'] = (float) $item->total;
                } elseif ($item->type === 'expense') {
                    $result[$item->period]['expenses'] = (float) $item->total;
                }

                $result[$item->period]['net_flow'] = $result[$item->period]['income'] - $result[$item->period]['expenses'];
            }

            return array_values($result);
        });
    }

    /**
     * Get top spending categories
     */
    public function getTopSpendingCategories(User $user, int $limit = 10, array $filters = []): array
    {
        $cacheKey = $this->getCacheKey('top_categories', $user->id, array_merge($filters, ['limit' => $limit]));

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $limit, $filters) {
            $dateRange = $this->parseDateFilters($filters);

            $topCategories = Transaction::where('transactions.user_id', $user->id)
                ->where('transactions.type', 'expense')
                ->whereNotNull('transactions.category_id')
                ->when($dateRange, function ($q) use ($dateRange) {
                    return $q->whereBetween('transactions.transaction_date', [$dateRange['from'], $dateRange['to']]);
                })
                ->join('categories', 'transactions.category_id', '=', 'categories.id')
                ->select(
                    'categories.id',
                    'categories.name',
                    'categories.color',
                    'categories.icon',
                    DB::raw('SUM(transactions.amount) as total'),
                    DB::raw('COUNT(transactions.id) as transaction_count')
                )
                ->groupBy('categories.id', 'categories.name', 'categories.color', 'categories.icon')
                ->orderBy('total', 'desc')
                ->limit($limit)
                ->get();

            $totalSpending = $topCategories->sum('total');

            return $topCategories->map(function ($category) use ($totalSpending) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'color' => $category->color,
                    'icon' => $category->icon,
                    'total' => (float) $category->total,
                    'transaction_count' => $category->transaction_count,
                    'percentage' => $totalSpending > 0 ? round(($category->total / $totalSpending) * 100, 2) : 0,
                ];
            })->toArray();
        });
    }

    /**
     * Get top merchants by spending
     */
    public function getTopMerchants(User $user, int $limit = 15, array $filters = []): array
    {
        $cacheKey = $this->getCacheKey('top_merchants', $user->id, array_merge($filters, ['limit' => $limit]));

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $limit, $filters) {
            $dateRange = $this->parseDateFilters($filters);

            return Transaction::where('transactions.user_id', $user->id)
                ->where('transactions.type', 'expense')
                ->whereNotNull('transactions.merchant_id')
                ->when($dateRange, function ($q) use ($dateRange) {
                    return $q->whereBetween('transactions.transaction_date', [$dateRange['from'], $dateRange['to']]);
                })
                ->join('merchants', 'transactions.merchant_id', '=', 'merchants.id')
                ->select(
                    'merchants.id',
                    'merchants.name',
                    'merchants.type',
                    DB::raw('SUM(transactions.amount) as total'),
                    DB::raw('COUNT(transactions.id) as transaction_count'),
                    DB::raw('AVG(transactions.amount) as average_transaction')
                )
                ->groupBy('merchants.id', 'merchants.name', 'merchants.type')
                ->orderBy('total', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($merchant) {
                    return [
                        'id' => $merchant->id,
                        'name' => $merchant->name,
                        'type' => $merchant->type,
                        'total' => (float) $merchant->total,
                        'transaction_count' => $merchant->transaction_count,
                        'average_transaction' => (float) $merchant->average_transaction,
                    ];
                })
                ->toArray();
        });
    }

    /**
     * Parse date filters and return Carbon date range
     */
    private function parseDateFilters(array $filters): ?array
    {
        if (isset($filters['date_preset'])) {
            return $this->parseDatePreset($filters['date_preset']);
        }

        if (isset($filters['date_from']) && isset($filters['date_to'])) {
            return [
                'from' => Carbon::parse($filters['date_from'])->startOfDay(),
                'to' => Carbon::parse($filters['date_to'])->endOfDay(),
            ];
        }

        // Default to last 30 days if no filter specified
        return [
            'from' => Carbon::now()->subDays(30)->startOfDay(),
            'to' => Carbon::now()->endOfDay(),
        ];
    }

    /**
     * Parse date preset into date range
     */
    private function parseDatePreset(string $preset): array
    {
        return match ($preset) {
            'today' => [
                'from' => Carbon::today()->startOfDay(),
                'to' => Carbon::today()->endOfDay(),
            ],
            'yesterday' => [
                'from' => Carbon::yesterday()->startOfDay(),
                'to' => Carbon::yesterday()->endOfDay(),
            ],
            'last_7_days' => [
                'from' => Carbon::now()->subDays(7)->startOfDay(),
                'to' => Carbon::now()->endOfDay(),
            ],
            'last_30_days' => [
                'from' => Carbon::now()->subDays(30)->startOfDay(),
                'to' => Carbon::now()->endOfDay(),
            ],
            'this_month' => [
                'from' => Carbon::now()->startOfMonth(),
                'to' => Carbon::now()->endOfDay(),
            ],
            'last_month' => [
                'from' => Carbon::now()->subMonth()->startOfMonth(),
                'to' => Carbon::now()->subMonth()->endOfMonth(),
            ],
            'this_quarter' => [
                'from' => Carbon::now()->startOfQuarter(),
                'to' => Carbon::now()->endOfDay(),
            ],
            'last_quarter' => [
                'from' => Carbon::now()->subQuarter()->startOfQuarter(),
                'to' => Carbon::now()->subQuarter()->endOfQuarter(),
            ],
            'this_year' => [
                'from' => Carbon::now()->startOfYear(),
                'to' => Carbon::now()->endOfDay(),
            ],
            'last_year' => [
                'from' => Carbon::now()->subYear()->startOfYear(),
                'to' => Carbon::now()->subYear()->endOfYear(),
            ],
            'all_time' => [
                'from' => Carbon::create(2000, 1, 1)->startOfDay(),
                'to' => Carbon::now()->endOfDay(),
            ],
            default => [
                'from' => Carbon::now()->subDays(30)->startOfDay(),
                'to' => Carbon::now()->endOfDay(),
            ],
        };
    }

    /**
     * Get previous period based on current date range
     */
    private function getPreviousPeriod(?array $dateRange): array
    {
        if (!$dateRange) {
            return [
                'from' => Carbon::now()->subDays(60)->startOfDay(),
                'to' => Carbon::now()->subDays(30)->endOfDay(),
            ];
        }

        $daysDiff = $dateRange['from']->diffInDays($dateRange['to']);

        return [
            'from' => $dateRange['from']->copy()->subDays($daysDiff + 1),
            'to' => $dateRange['from']->copy()->subDay(),
        ];
    }

    /**
     * Calculate trend percentage
     */
    private function calculateTrend(float $current, float $previous): array
    {
        if ($previous == 0) {
            $percentage = $current > 0 ? 100 : 0;
        } else {
            $percentage = (($current - $previous) / $previous) * 100;
        }

        return [
            'percentage' => round($percentage, 2),
            'direction' => $percentage > 0 ? 'up' : ($percentage < 0 ? 'down' : 'neutral'),
            'current' => $current,
            'previous' => $previous,
        ];
    }

    /**
     * Get date format for grouping (for display)
     */
    private function getDateFormatForGrouping(string $groupBy): string
    {
        return match ($groupBy) {
            'day' => 'Y-m-d',
            'week' => 'Y-W',
            'month' => 'Y-m',
            'quarter' => 'Y-\QQ',
            'year' => 'Y',
            default => 'Y-m-d',
        };
    }

    /**
     * Get database-agnostic date format SQL for grouping
     */
    private function getDbDateFormatSql(string $groupBy): string
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            return match ($groupBy) {
                'day' => "strftime('%Y-%m-%d', transaction_date)",
                'week' => "strftime('%Y-%W', transaction_date)",
                'month' => "strftime('%Y-%m', transaction_date)",
                'quarter' => "strftime('%Y', transaction_date) || '-Q' || ((CAST(strftime('%m', transaction_date) AS INTEGER) - 1) / 3 + 1)",
                'year' => "strftime('%Y', transaction_date)",
                default => "strftime('%Y-%m-%d', transaction_date)",
            };
        }

        // MySQL/MariaDB
        $format = match ($groupBy) {
            'day' => '%Y-%m-%d',
            'week' => '%Y-%u',
            'month' => '%Y-%m',
            'quarter' => '%Y-Q%q',
            'year' => '%Y',
            default => '%Y-%m-%d',
        };

        return "DATE_FORMAT(transaction_date, '$format')";
    }

    /**
     * Generate cache key
     */
    private function getCacheKey(string $method, int $userId, array $params = []): string
    {
        $paramsHash = md5(json_encode($params));
        return "stats:{$userId}:{$method}:{$paramsHash}";
    }

    /**
     * Clear all statistics cache for a user
     */
    public function clearUserCache(int $userId): void
    {
        Cache::tags(["stats:user:{$userId}"])->flush();
    }
}
