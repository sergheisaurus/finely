<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreInvoiceRequest;
use App\Http\Requests\Api\UpdateInvoiceRequest;
use App\Http\Resources\InvoiceAttachmentResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\TransactionResource;
use App\Models\Invoice;
use App\Models\InvoiceAttachment;
use App\Services\InvoiceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvoiceController extends Controller
{
    public function __construct(
        protected InvoiceService $invoiceService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->invoices();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by recurring
        if ($request->has('is_recurring')) {
            $query->where('is_recurring', $request->boolean('is_recurring'));
        }

        // Filter by merchant
        if ($request->has('merchant_id')) {
            $query->where('merchant_id', $request->merchant_id);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('creditor_name', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        // Date range filter
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->forDateRange($request->from_date, $request->to_date);
        }

        $invoices = $query->with(['merchant', 'category'])
            ->withCount(['items', 'attachments', 'transactions'])
            ->orderByRaw("CASE status WHEN 'overdue' THEN 1 WHEN 'pending' THEN 2 WHEN 'paid' THEN 3 WHEN 'cancelled' THEN 4 ELSE 5 END")
            ->orderBy('due_date')
            ->get();

        return InvoiceResource::collection($invoices);
    }

    public function store(StoreInvoiceRequest $request): InvoiceResource
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $invoice = $this->invoiceService->create($data);

        return new InvoiceResource($invoice->load(['merchant', 'category', 'items', 'attachments']));
    }

    public function show(Request $request, Invoice $invoice): InvoiceResource
    {
        $this->authorize('view', $invoice);

        $invoice->load(['merchant', 'category', 'items', 'attachments'])
            ->loadCount('transactions');

        return new InvoiceResource($invoice);
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): InvoiceResource
    {
        $this->authorize('update', $invoice);

        $invoice = $this->invoiceService->update($invoice, $request->validated());

        return new InvoiceResource($invoice->load(['merchant', 'category', 'items', 'attachments']));
    }

    public function destroy(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('delete', $invoice);

        $this->invoiceService->delete($invoice);

        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    /**
     * Mark an invoice as paid.
     */
    public function pay(Request $request, Invoice $invoice): InvoiceResource
    {
        $this->authorize('update', $invoice);

        $request->validate([
            'paid_date' => ['nullable', 'date'],
            'from_account_id' => ['nullable', 'exists:bank_accounts,id'],
            'from_card_id' => ['nullable', 'exists:cards,id'],
            'create_transaction' => ['boolean'],
        ]);

        $paidDate = $request->paid_date ? Carbon::parse($request->paid_date) : null;

        $transactionData = null;
        if ($request->boolean('create_transaction', true)) {
            $transactionData = [
                'from_account_id' => $request->from_account_id,
                'from_card_id' => $request->from_card_id,
            ];
        }

        $invoice = $this->invoiceService->markAsPaid($invoice, $paidDate, $transactionData);

        return new InvoiceResource($invoice->load(['merchant', 'category', 'items', 'attachments']));
    }

    /**
     * Cancel an invoice.
     */
    public function cancel(Request $request, Invoice $invoice): InvoiceResource
    {
        $this->authorize('update', $invoice);

        $invoice = $this->invoiceService->cancel($invoice);

        return new InvoiceResource($invoice->load(['merchant', 'category', 'items', 'attachments']));
    }

    /**
     * Get transactions linked to this invoice.
     */
    public function transactions(Request $request, Invoice $invoice): AnonymousResourceCollection
    {
        $this->authorize('view', $invoice);

        $transactions = $invoice->transactions()
            ->with(['category', 'merchant', 'fromAccount', 'toAccount', 'fromCard', 'toCard'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return TransactionResource::collection($transactions);
    }

    /**
     * Get upcoming invoices due within specified days.
     */
    public function upcoming(Request $request): AnonymousResourceCollection
    {
        $days = $request->get('days', 30);

        $invoices = $request->user()->invoices()
            ->dueSoon($days)
            ->with(['merchant', 'category'])
            ->orderBy('due_date')
            ->get();

        return InvoiceResource::collection($invoices);
    }

    /**
     * Get overdue invoices.
     */
    public function overdue(Request $request): AnonymousResourceCollection
    {
        $invoices = $request->user()->invoices()
            ->overdue()
            ->with(['merchant', 'category'])
            ->orderBy('due_date')
            ->get();

        return InvoiceResource::collection($invoices);
    }

    /**
     * Get invoice statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalCount = $user->invoices()->count();
        $pendingCount = $user->invoices()->pending()->count();
        $paidCount = $user->invoices()->paid()->count();
        $overdueCount = $user->invoices()->overdue()->count();

        $pendingTotal = $user->invoices()->pending()->sum('amount');
        $overdueTotal = $user->invoices()->overdue()->sum('amount');

        $recurringCount = $user->invoices()->recurring()->count();
        $upcomingThisWeek = $user->invoices()->dueSoon(7)->count();

        return response()->json([
            'total_count' => $totalCount,
            'pending_count' => $pendingCount,
            'paid_count' => $paidCount,
            'overdue_count' => $overdueCount,
            'pending_total' => round($pendingTotal, 2),
            'overdue_total' => round($overdueTotal, 2),
            'recurring_count' => $recurringCount,
            'upcoming_this_week' => $upcomingThisWeek,
        ]);
    }

    /**
     * Parse QR code data from text.
     */
    public function parseQr(Request $request): JsonResponse
    {
        $request->validate([
            'qr_text' => ['required_without:file', 'nullable', 'string'],
            'file' => ['required_without:qr_text', 'nullable', 'file', 'mimes:png,jpg,jpeg,gif,webp', 'max:2048'], // 2MB max
        ]);

        $qrData = null;
        $rawText = null;
        $errorMessage = 'Could not parse QR code data';

        if ($request->has('qr_text')) {
            $rawText = $request->qr_text;
            $qrData = $this->invoiceService->parseQrData($rawText);
            if (! $qrData) {
                $errorMessage = 'Invalid Swiss QR-Invoice format. Make sure the text starts with "SPC" and contains valid QR data.';
            }
        } elseif ($request->hasFile('file')) {
            $result = $this->invoiceService->extractQrFromFile($request->file('file'));
            if ($result) {
                $qrData = $result['data'];
                $rawText = $result['raw_text'];
            } else {
                $errorMessage = 'No QR code found in the image, or the QR code is not a valid Swiss QR-Invoice. Try taking a clearer photo or pasting the QR text instead.';
            }
        }

        if (! $qrData) {
            return response()->json([
                'message' => $errorMessage,
            ], 422);
        }

        return response()->json([
            'message' => 'QR code parsed successfully',
            'data' => $qrData,
            'raw_text' => $rawText,
        ]);
    }

    /**
     * Upload an attachment to an invoice.
     */
    public function uploadAttachment(Request $request, Invoice $invoice): InvoiceAttachmentResource
    {
        $this->authorize('update', $invoice);

        $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB max
            'is_primary' => ['boolean'],
        ]);

        $attachment = $this->invoiceService->uploadAttachment(
            $invoice,
            $request->file('file'),
            $request->boolean('is_primary', false)
        );

        return new InvoiceAttachmentResource($attachment);
    }

    /**
     * Delete an attachment from an invoice.
     */
    public function deleteAttachment(Request $request, Invoice $invoice, InvoiceAttachment $attachment): JsonResponse
    {
        $this->authorize('update', $invoice);

        // Verify the attachment belongs to this invoice
        if ($attachment->invoice_id !== $invoice->id) {
            abort(404);
        }

        $this->invoiceService->deleteAttachment($attachment);

        return response()->json(['message' => 'Attachment deleted successfully']);
    }
}
