<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ForecastService;
use App\Services\StatisticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StatisticsController extends Controller
{
    public function __construct(
        private readonly StatisticsService $statisticsService,
        private readonly ForecastService $forecastService,
    ) {}

    /**
     * Get comprehensive overview statistics
     */
    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->all();

        $data = [
            'snapshot' => $this->statisticsService->getFinancialSnapshot($user, $filters),
            'cash_flow' => $this->statisticsService->getCashFlowAnalysis($user, $request->get('group_by', 'month'), $filters),
            'top_categories' => $this->statisticsService->getTopSpendingCategories($user, 10, $filters),
            'top_merchants' => $this->statisticsService->getTopMerchants($user, 10, $filters),
        ];

        return response()->json($data);
    }

    /**
     * Get financial snapshot (KPI cards)
     */
    public function snapshot(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->all();

        $snapshot = $this->statisticsService->getFinancialSnapshot($user, $filters);

        return response()->json($snapshot);
    }

    /**
     * Get net worth trend over time
     */
    public function netWorthTrend(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->all();
        $groupBy = $request->get('group_by', 'day');

        $trend = $this->statisticsService->getNetWorthTrend($user, $groupBy, $filters);

        return response()->json($trend);
    }

    /**
     * Get cash flow analysis
     */
    public function cashFlow(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->all();
        $groupBy = $request->get('group_by', 'month');

        $cashFlow = $this->statisticsService->getCashFlowAnalysis($user, $groupBy, $filters);

        return response()->json($cashFlow);
    }

    /**
     * Get top spending categories
     */
    public function topCategories(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->all();
        $limit = $request->get('limit', 10);

        $categories = $this->statisticsService->getTopSpendingCategories($user, $limit, $filters);

        return response()->json($categories);
    }

    /**
     * Get top merchants by spending
     */
    public function topMerchants(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->all();
        $limit = $request->get('limit', 15);

        $merchants = $this->statisticsService->getTopMerchants($user, $limit, $filters);

        return response()->json($merchants);
    }

    /**
     * Get a forward-looking forecast based on recurring items.
     */
    public function forecast(Request $request): JsonResponse
    {
        $boolish = Rule::in([0, 1, '0', '1', true, false, 'true', 'false']);

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'include_budgets' => ['nullable', $boolish],
            'include_subscriptions' => ['nullable', $boolish],
            'include_recurring_incomes' => ['nullable', $boolish],
            'include_discretionary' => ['nullable', $boolish],
            'discretionary_lookback_days' => ['nullable', 'integer', 'min:7', 'max:365'],
            'discretionary_method' => ['nullable', 'string', 'in:flat,dow'],
            'discretionary_exclude_budget_categories' => ['nullable', $boolish],
            'discretionary_exclude_category_ids' => ['nullable', 'array'],
            'discretionary_exclude_category_ids.*' => ['integer', 'min:1'],
            'scenario_items' => ['nullable', 'array', 'max:50'],
            'scenario_items.*.id' => ['required', 'string', 'max:64'],
            'scenario_items.*.name' => ['required', 'string', 'max:120'],
            'scenario_items.*.kind' => ['required', 'string', 'in:income,expense'],
            'scenario_items.*.amount' => ['required', 'numeric', 'min:0'],
            'scenario_items.*.frequency' => ['required', 'string', 'in:once,weekly,monthly,yearly'],
            'scenario_items.*.date' => ['nullable', 'date'],
            'scenario_items.*.start_date' => ['nullable', 'date'],
            'scenario_items.*.end_date' => ['nullable', 'date'],
            'scenario_items.*.day_of_month' => ['nullable', 'integer', 'min:1', 'max:31'],
            'scenario_items.*.day_of_week' => ['nullable', 'integer', 'min:0', 'max:6'],
            'scenario_items.*.month_of_year' => ['nullable', 'integer', 'min:1', 'max:12'],
            'starting_balance' => ['nullable', 'numeric'],
            'currency' => ['nullable', 'string', 'max:8'],
            'max_days' => ['nullable', 'integer', 'min:1', 'max:1825'],
        ]);

        $user = $request->user();
        $from = isset($validated['from'])
            ? \Carbon\Carbon::parse($validated['from'])->startOfDay()
            : now()->startOfDay();
        $to = isset($validated['to'])
            ? \Carbon\Carbon::parse($validated['to'])->startOfDay()
            : now()->addYear()->startOfDay();

        // Forecasting only makes sense for future timelines.
        if ($from->lt(now()->startOfDay())) {
            $from = now()->startOfDay();
        }

        if ($to->lt($from)) {
            $to = $from->copy();
        }

        $maxDays = (int) ($validated['max_days'] ?? 370);
        if ($from->diffInDays($to) > $maxDays) {
            $to = $from->copy()->addDays($maxDays);
        }

        $includeBudgets = $this->parseBool($validated['include_budgets'] ?? null, true);
        $includeSubscriptions = $this->parseBool($validated['include_subscriptions'] ?? null, true);
        $includeRecurringIncomes = $this->parseBool($validated['include_recurring_incomes'] ?? null, true);
        $includeDiscretionary = $this->parseBool($validated['include_discretionary'] ?? null, false);
        $excludeBudgetCategories = $this->parseBool(
            $validated['discretionary_exclude_budget_categories'] ?? null,
            true,
        );

        $options = [
            'include_budgets' => $includeBudgets,
            'include_subscriptions' => $includeSubscriptions,
            'include_recurring_incomes' => $includeRecurringIncomes,
            'include_discretionary' => $includeDiscretionary,
            'currency' => $validated['currency'] ?? 'CHF',
        ];

        if (array_key_exists('discretionary_lookback_days', $validated) && $validated['discretionary_lookback_days'] !== null) {
            $options['discretionary_lookback_days'] = (int) $validated['discretionary_lookback_days'];
        }

        if (array_key_exists('discretionary_method', $validated) && $validated['discretionary_method'] !== null) {
            $options['discretionary_method'] = (string) $validated['discretionary_method'];
        }

        $options['discretionary_exclude_budget_categories'] = $excludeBudgetCategories;

        if (array_key_exists('discretionary_exclude_category_ids', $validated) && is_array($validated['discretionary_exclude_category_ids'])) {
            $options['discretionary_exclude_category_ids'] = $validated['discretionary_exclude_category_ids'];
        }

        if (array_key_exists('starting_balance', $validated) && $validated['starting_balance'] !== null) {
            $options['starting_balance'] = $validated['starting_balance'];
        }

        if (array_key_exists('scenario_items', $validated) && is_array($validated['scenario_items'])) {
            $options['scenario_items'] = $validated['scenario_items'];
        }

        $data = $this->forecastService->getForecast(
            $user,
            $from,
            $to,
            $options,
        );

        return response()->json($data);
    }

    private function parseBool(mixed $value, bool $default): bool
    {
        if ($value === null || $value === '') {
            return $default;
        }

        $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        return $parsed ?? $default;
    }
}
