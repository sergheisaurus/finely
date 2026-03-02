<?php

namespace App\Http\Controllers;

use App\Http\Resources\BudgetResource;
use App\Models\Budget;
use App\Services\BudgetService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BudgetController extends Controller
{
    public function __construct(
        protected BudgetService $budgetService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        // Fetch all budgets for the user
        $budgets = Budget::where('user_id', $user->id)
            ->with(['category'])
            ->orderBy('current_period_end')
            ->orderBy('name')
            ->get();

        // Fetch stats
        $stats = $this->budgetService->getUserBudgetStats($user);

        return Inertia::render('budgets/index', [
            'budgets' => BudgetResource::collection($budgets),
            'stats' => $stats,
        ]);
    }
}
