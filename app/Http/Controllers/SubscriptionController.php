<?php

namespace App\Http\Controllers;

use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Fetch all subscriptions
        $subscriptions = Subscription::where('user_id', $user->id)
            ->with(['merchant', 'category', 'paymentMethod'])
            ->withCount('transactions')
            ->orderBy('next_billing_date')
            ->get();

        // Calculate stats
        $activeSubscriptions = $subscriptions->where('is_active', true);
        
        $monthlyTotal = $activeSubscriptions->sum(fn ($sub) => $sub->getMonthlyEquivalent());
        $yearlyTotal = $activeSubscriptions->sum(fn ($sub) => $sub->getYearlyTotal());
        
        // For "due soon" we need to check the logic. 
        // The model method is scopes, but here we have a collection.
        // We can use the model helper isDueSoon on each item.
        $upcomingThisWeek = $activeSubscriptions->filter(fn ($sub) => $sub->isDueSoon(7))->count();
        $overdueCount = $activeSubscriptions->filter(fn ($sub) => $sub->isOverdue())->count();

        $stats = [
            'active_count' => $activeSubscriptions->count(),
            'monthly_total' => round($monthlyTotal, 2),
            'yearly_total' => round($yearlyTotal, 2),
            'upcoming_this_week' => $upcomingThisWeek,
            'overdue_count' => $overdueCount,
        ];

        return Inertia::render('subscriptions/index', [
            'subscriptions' => SubscriptionResource::collection($subscriptions),
            'stats' => $stats,
        ]);
    }
}
