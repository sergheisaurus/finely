<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $orders = Order::query()
            ->where('user_id', $user->id)
            ->with(['merchant', 'category'])
            ->withCount(['items', 'transactions'])
            ->orderBy('ordered_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_count' => $orders->count(),
            'total_amount' => (float) $orders->sum('amount'),
            'delivered_count' => $orders->where('status', 'delivered')->count(),
        ];

        return Inertia::render('orders/index', [
            'orders' => OrderResource::collection($orders),
            'stats' => $stats,
        ]);
    }
}
