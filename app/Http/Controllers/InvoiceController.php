<?php

namespace App\Http\Controllers;

use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $invoices = Invoice::where('user_id', $user->id)
            ->with(['merchant', 'category'])
            ->orderBy('due_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate stats
        $stats = [
            'total_count' => $invoices->count(),
            'pending_count' => $invoices->where('status', 'pending')->count(),
            'paid_count' => $invoices->where('status', 'paid')->count(),
            'overdue_count' => $invoices->where('status', 'overdue')->count(),
            'pending_total' => (float) $invoices->where('status', 'pending')->sum('amount'),
            'overdue_total' => (float) $invoices->where('status', 'overdue')->sum('amount'),
            'recurring_count' => $invoices->where('is_recurring', true)->count(),
            // Simplified "upcoming this week" - in a real app would use a query
            'upcoming_this_week' => $invoices->filter(fn($i) => 
                $i->status === 'pending' && 
                $i->due_date && 
                \Illuminate\Support\Carbon::parse($i->due_date)->isBetween(\now(), \now()->addDays(7))
            )->count(),
        ];

        return Inertia::render('invoices/index', [
            'invoices' => InvoiceResource::collection($invoices),
            'stats' => $stats,
        ]);
    }
}
