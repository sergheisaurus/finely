<?php

namespace App\Console\Commands;

use App\Models\Budget;
use App\Services\BudgetService;
use Illuminate\Console\Command;

class UpdateBudgetSpending extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'budgets:update-spending {--budget= : Specific budget ID to update}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update current period spending for all active budgets';

    /**
     * Execute the console command.
     */
    public function handle(BudgetService $budgetService): int
    {
        $budgetId = $this->option('budget');

        if ($budgetId) {
            $budget = Budget::find($budgetId);

            if (! $budget) {
                $this->error("Budget with ID {$budgetId} not found.");

                return Command::FAILURE;
            }

            $this->info("Updating spending for budget: {$budget->name}");
            $budgetService->updateCurrentPeriodSpending($budget);
            $this->info('Done.');

            return Command::SUCCESS;
        }

        $budgets = Budget::active()->get();
        $count = $budgets->count();

        if ($count === 0) {
            $this->info('No active budgets to update.');

            return Command::SUCCESS;
        }

        $this->info("Updating spending for {$count} active budget(s)...");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($budgets as $budget) {
            $budgetService->updateCurrentPeriodSpending($budget);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('All budgets updated successfully.');

        return Command::SUCCESS;
    }
}
