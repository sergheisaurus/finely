<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBudgetRequest;
use App\Http\Requests\Api\UpdateBudgetRequest;
use App\Http\Resources\BudgetResource;
use App\Models\Budget;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BudgetController extends Controller
{
    public function __construct(
        protected BudgetService $budgetService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->budgets();

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by period
        if ($request->has('period')) {
            $query->where('period', $request->period);
        }

        // Filter by category
        if ($request->has('category_id')) {
            if ($request->category_id === 'null' || $request->category_id === '') {
                $query->whereNull('category_id');
            } else {
                $query->where('category_id', $request->category_id);
            }
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        // Filter by budget status
        if ($request->has('status')) {
            match ($request->status) {
                'over_budget' => $query->overBudget(),
                'near_limit' => $query->nearLimit(),
                default => null,
            };
        }

        $budgets = $query->with(['category'])
            ->orderBy('current_period_end')
            ->orderBy('name')
            ->get();

        return BudgetResource::collection($budgets);
    }

    public function store(StoreBudgetRequest $request): BudgetResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $budget = $this->budgetService->create($data);

        return new BudgetResource($budget->load('category'));
    }

    public function show(Request $request, Budget $budget): BudgetResource
    {
        $this->authorize('view', $budget);

        $budget->load('category');

        return new BudgetResource($budget);
    }

    public function update(UpdateBudgetRequest $request, Budget $budget): BudgetResource
    {
        $this->authorize('update', $budget);

        $budget = $this->budgetService->update($budget, $request->validated());

        return new BudgetResource($budget->load('category'));
    }

    public function destroy(Request $request, Budget $budget): JsonResponse
    {
        $this->authorize('delete', $budget);

        $budget->delete();

        return response()->json(['message' => 'Budget deleted successfully']);
    }

    public function toggle(Request $request, Budget $budget): BudgetResource
    {
        $this->authorize('update', $budget);

        $budget = $this->budgetService->toggle($budget);

        return new BudgetResource($budget->load('category'));
    }

    public function refresh(Request $request, Budget $budget): BudgetResource
    {
        $this->authorize('update', $budget);

        $budget = $this->budgetService->updateCurrentPeriodSpending($budget);

        return new BudgetResource($budget->load('category'));
    }

    public function stats(Request $request): JsonResponse
    {
        $stats = $this->budgetService->getUserBudgetStats($request->user());

        return response()->json($stats);
    }

    public function health(Request $request): JsonResponse
    {
        $budgets = $request->user()->budgets()->active()->with('category')->get();

        $healthData = $budgets->map(function ($budget) {
            return [
                'id' => $budget->id,
                'name' => $budget->name,
                'category' => $budget->category?->name,
                'category_id' => $budget->category_id,
                'color' => $budget->color,
                'icon' => $budget->icon,
                'health' => $this->budgetService->calculateBudgetHealth($budget),
            ];
        });

        return response()->json($healthData);
    }

    public function breakdown(Request $request, Budget $budget): JsonResponse
    {
        $this->authorize('view', $budget);

        $breakdown = $this->budgetService->getSpendingBreakdown($budget);

        return response()->json([
            'breakdown' => $breakdown,
            'total' => (float) $budget->current_period_spent,
        ]);
    }

    public function comparison(Request $request, Budget $budget): JsonResponse
    {
        $this->authorize('view', $budget);

        $comparison = $this->budgetService->getBudgetComparison($budget);

        return response()->json($comparison);
    }

    public function forCategory(Request $request): JsonResponse
    {
        $categoryId = $request->get('category_id');

        $budget = $this->budgetService->getBudgetForCategory(
            $request->user()->id,
            $categoryId ? (int) $categoryId : null
        );

        if (! $budget) {
            return response()->json(['budget' => null]);
        }

        return response()->json([
            'budget' => new BudgetResource($budget->load('category')),
        ]);
    }

    public function checkImpact(Request $request, Budget $budget): JsonResponse
    {
        $this->authorize('view', $budget);

        $amount = (float) $request->get('amount', 0);
        $impact = $this->budgetService->checkTransactionImpact($budget, $amount);

        return response()->json($impact);
    }
}
