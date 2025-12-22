<?php

namespace App\Console\Commands;

use App\Services\BudgetService;
use Illuminate\Console\Command;

class ProcessBudgetRollovers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'budgets:process-rollovers';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process budget period rollovers for budgets that have ended their current period';

    /**
     * Execute the console command.
     */
    public function handle(BudgetService $budgetService): int
    {
        $this->info('Processing budget rollovers...');

        $count = $budgetService->checkAndProcessRollovers();

        $this->info("Processed {$count} budget rollover(s).");

        return Command::SUCCESS;
    }
}
