<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreRecurringIncomeRequest;
use App\Http\Requests\Api\UpdateRecurringIncomeRequest;
use App\Http\Resources\RecurringIncomeResource;
use App\Http\Resources\TransactionResource;
use App\Models\RecurringIncome;
use App\Services\RecurringIncomeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RecurringIncomeController extends Controller
{
    public function __construct(
        protected RecurringIncomeService $recurringIncomeService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->recurringIncomes();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('frequency')) {
            $query->where('frequency', $request->frequency);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('source', 'like', '%'.$request->search.'%');
            });
        }

        // For calendar integration: filter by date range
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->forCalendarRange($request->from_date, $request->to_date);
        }

        $incomes = $query->with(['category', 'toAccount'])
            ->withCount('transactions')
            ->orderBy('next_expected_date')
            ->get();

        return RecurringIncomeResource::collection($incomes);
    }

    public function store(StoreRecurringIncomeRequest $request): RecurringIncomeResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $income = $this->recurringIncomeService->create($data);

        return new RecurringIncomeResource($income->load(['category', 'toAccount']));
    }

    public function show(Request $request, RecurringIncome $recurringIncome): RecurringIncomeResource
    {
        $this->authorize('view', $recurringIncome);

        $recurringIncome->load(['category', 'toAccount'])
            ->loadCount('transactions');

        return new RecurringIncomeResource($recurringIncome);
    }

    public function update(UpdateRecurringIncomeRequest $request, RecurringIncome $recurringIncome): RecurringIncomeResource
    {
        $this->authorize('update', $recurringIncome);

        $income = $this->recurringIncomeService->update($recurringIncome, $request->validated());

        return new RecurringIncomeResource($income->load(['category', 'toAccount']));
    }

    public function destroy(Request $request, RecurringIncome $recurringIncome): JsonResponse
    {
        $this->authorize('delete', $recurringIncome);

        $recurringIncome->delete();

        return response()->json(['message' => 'Recurring income deleted successfully']);
    }

    public function toggle(Request $request, RecurringIncome $recurringIncome): RecurringIncomeResource
    {
        $this->authorize('update', $recurringIncome);

        $income = $this->recurringIncomeService->toggle($recurringIncome);

        return new RecurringIncomeResource($income->load(['category', 'toAccount']));
    }

    public function markReceived(Request $request, RecurringIncome $recurringIncome): JsonResponse
    {
        $this->authorize('update', $recurringIncome);

        $transaction = $this->recurringIncomeService->markReceived($recurringIncome);

        if ($transaction) {
            return response()->json([
                'message' => 'Income marked as received',
                'transaction' => new TransactionResource($transaction),
            ]);
        }

        return response()->json([
            'message' => 'Recurring income is not active',
        ], 422);
    }

    public function transactions(Request $request, RecurringIncome $recurringIncome): AnonymousResourceCollection
    {
        $this->authorize('view', $recurringIncome);

        $transactions = $recurringIncome->transactions()
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return TransactionResource::collection($transactions);
    }

    public function upcoming(Request $request): AnonymousResourceCollection
    {
        $days = $request->get('days', 30);

        $incomes = $request->user()->recurringIncomes()
            ->expectedSoon($days)
            ->with(['category', 'toAccount'])
            ->orderBy('next_expected_date')
            ->get();

        return RecurringIncomeResource::collection($incomes);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeIncomes = $user->recurringIncomes()->active()->get();

        $monthlyTotal = $activeIncomes->sum(fn ($income) => $income->getMonthlyEquivalent());
        $yearlyTotal = $activeIncomes->sum(fn ($income) => $income->getYearlyTotal());

        $expectedThisWeek = $user->recurringIncomes()->expectedSoon(7)->count();
        $overdueCount = $user->recurringIncomes()->overdue()->count();

        return response()->json([
            'active_count' => $activeIncomes->count(),
            'monthly_total' => round($monthlyTotal, 2),
            'yearly_total' => round($yearlyTotal, 2),
            'expected_this_week' => $expectedThisWeek,
            'overdue_count' => $overdueCount,
        ]);
    }
}
