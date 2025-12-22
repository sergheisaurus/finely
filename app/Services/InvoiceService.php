<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceAttachment;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class InvoiceService
{
    public function __construct(
        protected SwissQrParserService $qrParser
    ) {}

    /**
     * Create a new invoice with optional items.
     */
    public function create(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'] ?? [];
            unset($data['items']);

            $invoice = new Invoice($data);

            // Set next_due_date for recurring invoices
            if ($invoice->is_recurring && $invoice->due_date) {
                $invoice->next_due_date = $invoice->calculateNextDueDate($invoice->due_date);
            }

            $invoice->save();

            // Create line items
            if (! empty($items)) {
                $this->syncItems($invoice, $items);
            }

            return $invoice;
        });
    }

    /**
     * Update an existing invoice.
     */
    public function update(Invoice $invoice, array $data): Invoice
    {
        return DB::transaction(function () use ($invoice, $data) {
            $items = $data['items'] ?? null;
            unset($data['items']);

            $invoice->fill($data);

            // Recalculate next_due_date if recurring settings changed
            if ($invoice->is_recurring && $invoice->isDirty(['frequency', 'billing_day', 'due_date'])) {
                $invoice->next_due_date = $invoice->calculateNextDueDate($invoice->due_date);
            }

            // Clear recurring fields if not recurring
            if (! $invoice->is_recurring) {
                $invoice->frequency = null;
                $invoice->billing_day = null;
                $invoice->next_due_date = null;
            }

            $invoice->save();

            // Update line items if provided
            if ($items !== null) {
                $this->syncItems($invoice, $items);
            }

            return $invoice;
        });
    }

    /**
     * Sync invoice line items.
     */
    protected function syncItems(Invoice $invoice, array $items): void
    {
        // Delete existing items
        $invoice->items()->delete();

        // Create new items
        foreach ($items as $index => $itemData) {
            $invoice->items()->create([
                'description' => $itemData['description'],
                'quantity' => $itemData['quantity'] ?? 1,
                'unit_price' => $itemData['unit_price'],
                'amount' => ($itemData['quantity'] ?? 1) * $itemData['unit_price'],
                'sort_order' => $itemData['sort_order'] ?? $index,
            ]);
        }
    }

    /**
     * Delete an invoice.
     */
    public function delete(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            // Delete attachments from storage
            foreach ($invoice->attachments as $attachment) {
                Storage::delete($attachment->file_path);
            }

            $invoice->delete();
        });
    }

    /**
     * Mark an invoice as paid and optionally create a transaction.
     */
    public function markAsPaid(
        Invoice $invoice,
        ?Carbon $paidDate = null,
        ?array $transactionData = null
    ): Invoice {
        return DB::transaction(function () use ($invoice, $paidDate, $transactionData) {
            $paidDate = $paidDate ?? now();

            $invoice->status = 'paid';
            $invoice->paid_date = $paidDate;
            $invoice->times_paid++;

            // Calculate next due date for recurring invoices
            if ($invoice->is_recurring) {
                $invoice->next_due_date = $invoice->calculateNextDueDate($invoice->due_date);
            }

            $invoice->save();

            // Create a transaction if payment details provided
            if ($transactionData) {
                $this->createPaymentTransaction($invoice, $paidDate, $transactionData);
            }

            return $invoice;
        });
    }

    /**
     * Create a transaction for the invoice payment.
     */
    protected function createPaymentTransaction(
        Invoice $invoice,
        Carbon $paidDate,
        array $transactionData
    ): Transaction {
        $transaction = Transaction::create([
            'user_id' => $invoice->user_id,
            'type' => 'expense',
            'amount' => $invoice->amount,
            'currency' => $invoice->currency,
            'title' => $invoice->creditor_name ?? $invoice->invoice_number ?? 'Invoice Payment',
            'description' => $invoice->notes ?? "Payment for invoice {$invoice->invoice_number}",
            'transaction_date' => $paidDate,
            'from_account_id' => $transactionData['from_account_id'] ?? null,
            'from_card_id' => $transactionData['from_card_id'] ?? null,
            'category_id' => $invoice->category_id,
            'merchant_id' => $invoice->merchant_id,
            'transactionable_type' => Invoice::class,
            'transactionable_id' => $invoice->id,
        ]);

        // Update account balance if paying from bank account
        if (isset($transactionData['from_account_id'])) {
            $account = \App\Models\BankAccount::find($transactionData['from_account_id']);
            $account?->updateBalance($invoice->amount, 'subtract');
        }

        // Update card balance if paying from card
        if (isset($transactionData['from_card_id'])) {
            $card = \App\Models\Card::find($transactionData['from_card_id']);
            $card?->updateBalance($invoice->amount, 'add');
        }

        return $transaction;
    }

    /**
     * Mark an invoice as cancelled.
     */
    public function cancel(Invoice $invoice): Invoice
    {
        $invoice->status = 'cancelled';
        $invoice->save();

        return $invoice;
    }

    /**
     * Advance recurring invoices to their next period.
     * Should be called by a scheduled job after due dates pass.
     *
     * @return int Number of invoices advanced
     */
    public function advanceRecurringInvoices(): int
    {
        $count = 0;

        $invoices = Invoice::query()
            ->recurring()
            ->paid()
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->startOfDay())
            ->get();

        foreach ($invoices as $invoice) {
            $this->advanceToNextPeriod($invoice);
            $count++;
        }

        return $count;
    }

    /**
     * Advance a single recurring invoice to its next billing period.
     */
    public function advanceToNextPeriod(Invoice $invoice): Invoice
    {
        return DB::transaction(function () use ($invoice) {
            // Move to next period
            $invoice->status = 'pending';
            $invoice->due_date = $invoice->next_due_date;
            $invoice->next_due_date = $invoice->calculateNextDueDate($invoice->due_date);
            $invoice->paid_date = null;

            $invoice->save();

            return $invoice;
        });
    }

    /**
     * Mark overdue invoices.
     * Should be called by a scheduled job.
     *
     * @return int Number of invoices marked as overdue
     */
    public function markOverdueInvoices(): int
    {
        return Invoice::query()
            ->pending()
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->startOfDay())
            ->update(['status' => 'overdue']);
    }

    /**
     * Parse QR code data from raw text.
     *
     * @return array<string, mixed>|null
     */
    public function parseQrData(string $rawQrText): ?array
    {
        return $this->qrParser->parse($rawQrText);
    }

    /**
     * Extract QR data from an uploaded file.
     *
     * @return array{data: array<string, mixed>, raw_text: string}|null
     */
    public function extractQrFromFile(UploadedFile $file): ?array
    {
        return $this->qrParser->parseFromFile($file);
    }

    /**
     * Upload an attachment to an invoice.
     */
    public function uploadAttachment(
        Invoice $invoice,
        UploadedFile $file,
        bool $isPrimary = false
    ): InvoiceAttachment {
        $path = $file->store("invoices/{$invoice->id}", 'public');

        // If this is the primary attachment, unset any existing primary
        if ($isPrimary) {
            $invoice->attachments()->update(['is_primary' => false]);
        }

        return $invoice->attachments()->create([
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'is_primary' => $isPrimary,
        ]);
    }

    /**
     * Delete an attachment.
     */
    public function deleteAttachment(InvoiceAttachment $attachment): void
    {
        Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();
    }

    /**
     * Create an invoice from parsed QR data.
     */
    public function createFromQrData(int $userId, array $qrData, array $additionalData = []): Invoice
    {
        $data = array_merge([
            'user_id' => $userId,
            'amount' => $qrData['amount'] ?? 0,
            'currency' => $qrData['currency'] ?? 'CHF',
            'creditor_name' => $qrData['creditor_name'] ?? null,
            'creditor_iban' => $qrData['iban'] ?? null,
            'payment_reference' => $qrData['reference'] ?? null,
            'qr_data' => $qrData,
            'issue_date' => now(),
            'status' => 'pending',
        ], $additionalData);

        return $this->create($data);
    }
}
