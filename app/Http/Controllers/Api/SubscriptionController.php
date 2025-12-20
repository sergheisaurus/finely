<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreSubscriptionRequest;
use App\Http\Requests\Api\UpdateSubscriptionRequest;
use App\Http\Resources\SubscriptionResource;
use App\Http\Resources\TransactionResource;
use App\Models\Subscription;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SubscriptionController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->subscriptions();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('billing_cycle')) {
            $query->where('billing_cycle', $request->billing_cycle);
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        // For calendar integration: filter by date range
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->forCalendarRange($request->from_date, $request->to_date);
        }

        $subscriptions = $query->with(['merchant', 'category', 'paymentMethod'])
            ->withCount('transactions')
            ->orderBy('next_billing_date')
            ->get();

        return SubscriptionResource::collection($subscriptions);
    }

    public function store(StoreSubscriptionRequest $request): SubscriptionResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $subscription = $this->subscriptionService->create($data);

        return new SubscriptionResource($subscription->load(['merchant', 'category', 'paymentMethod']));
    }

    public function show(Request $request, Subscription $subscription): SubscriptionResource
    {
        $this->authorize('view', $subscription);

        $subscription->load(['merchant', 'category', 'paymentMethod'])
            ->loadCount('transactions');

        return new SubscriptionResource($subscription);
    }

    public function update(UpdateSubscriptionRequest $request, Subscription $subscription): SubscriptionResource
    {
        $this->authorize('update', $subscription);

        $subscription = $this->subscriptionService->update($subscription, $request->validated());

        return new SubscriptionResource($subscription->load(['merchant', 'category', 'paymentMethod']));
    }

    public function destroy(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('delete', $subscription);

        $subscription->delete();

        return response()->json(['message' => 'Subscription deleted successfully']);
    }

    public function toggle(Request $request, Subscription $subscription): SubscriptionResource
    {
        $this->authorize('update', $subscription);

        $subscription = $this->subscriptionService->toggle($subscription);

        return new SubscriptionResource($subscription->load(['merchant', 'category', 'paymentMethod']));
    }

    public function process(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('update', $subscription);

        $transaction = $this->subscriptionService->processPayment($subscription);

        if ($transaction) {
            return response()->json([
                'message' => 'Payment processed successfully',
                'transaction' => new TransactionResource($transaction),
            ]);
        }

        return response()->json([
            'message' => 'Subscription is not active or not due',
        ], 422);
    }

    public function transactions(Request $request, Subscription $subscription): AnonymousResourceCollection
    {
        $this->authorize('view', $subscription);

        $transactions = $subscription->transactions()
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return TransactionResource::collection($transactions);
    }

    public function upcoming(Request $request): AnonymousResourceCollection
    {
        $days = $request->get('days', 30);

        $subscriptions = $request->user()->subscriptions()
            ->dueSoon($days)
            ->with(['merchant', 'category', 'paymentMethod'])
            ->orderBy('next_billing_date')
            ->get();

        return SubscriptionResource::collection($subscriptions);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeSubscriptions = $user->subscriptions()->active()->get();

        $monthlyTotal = $activeSubscriptions->sum(fn ($sub) => $sub->getMonthlyEquivalent());
        $yearlyTotal = $activeSubscriptions->sum(fn ($sub) => $sub->getYearlyTotal());

        $upcomingThisWeek = $user->subscriptions()->dueSoon(7)->count();
        $overdueCount = $user->subscriptions()->overdue()->count();

        return response()->json([
            'active_count' => $activeSubscriptions->count(),
            'monthly_total' => round($monthlyTotal, 2),
            'yearly_total' => round($yearlyTotal, 2),
            'upcoming_this_week' => $upcomingThisWeek,
            'overdue_count' => $overdueCount,
        ]);
    }
}
