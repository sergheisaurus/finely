<?php

namespace App\Console\Commands;

use App\Services\InvoiceService;
use Illuminate\Console\Command;

class ProcessInvoicesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoices:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process invoices: advance recurring invoices to next period and mark overdue invoices';

    /**
     * Execute the console command.
     */
    public function handle(InvoiceService $invoiceService): int
    {
        $this->info('Processing invoices...');

        // Mark unpaid invoices past their due date as overdue
        $overdueCount = $invoiceService->markOverdueInvoices();
        $this->info("Marked {$overdueCount} invoice(s) as overdue.");

        // Advance recurring invoices that are paid and past their due date
        $advancedCount = $invoiceService->advanceRecurringInvoices();
        $this->info("Advanced {$advancedCount} recurring invoice(s) to next period.");

        $this->info('Invoice processing complete.');

        return Command::SUCCESS;
    }
}
