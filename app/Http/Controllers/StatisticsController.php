<?php

namespace App\Http\Controllers;

use App\Services\StatisticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StatisticsController extends Controller
{
    public function __construct(
        private readonly StatisticsService $statisticsService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $filters = $request->all();
        // Default to 'month' if not provided, matching the frontend default
        $groupBy = $request->get('group_by', 'month'); 

        // Pre-fetch Overview data
        $overviewData = [
            'snapshot' => $this->statisticsService->getFinancialSnapshot($user, $filters),
            'cash_flow' => $this->statisticsService->getCashFlowAnalysis($user, $groupBy, $filters),
            'top_categories' => $this->statisticsService->getTopSpendingCategories($user, 10, $filters),
            'top_merchants' => $this->statisticsService->getTopMerchants($user, 10, $filters),
        ];

        return Inertia::render('statistics/index', [
            'overviewData' => $overviewData,
            'filters' => $filters,
        ]);
    }
}
