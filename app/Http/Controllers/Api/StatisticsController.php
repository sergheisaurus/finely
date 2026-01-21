<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StatisticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function __construct(
        private readonly StatisticsService $statisticsService
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
}
