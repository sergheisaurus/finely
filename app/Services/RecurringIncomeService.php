<?php

namespace App\Services;

use App\Models\RecurringIncome;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RecurringIncomeService
{
    public function create(array $data): RecurringIncome
    {
        return DB::transaction(function () use ($data) {
            $income = new RecurringIncome($data);

            // Calculate next expected date
            $startDate = Carbon::parse($data['start_date']);
            if ($startDate->isFuture() || $startDate->isToday()) {
                $income->next_expected_date = $startDate;
            } else {
                $income->next_expected_date = $income->calculateNextExpectedDate($startDate);
            }

            $income->save();

            return $income;
        });
    }

    public function update(RecurringIncome $income, array $data): RecurringIncome
    {
        return DB::transaction(function () use ($income, $data) {
            $income->fill($data);

            // Recalculate next expected date if frequency changed
            if ($income->isDirty(['frequency', 'payment_day', 'payment_month', 'start_date'])) {
                $baseDate = $income->last_received_date ?? Carbon::parse($data['start_date'] ?? $income->start_date);
                $income->next_expected_date = $income->calculateNextExpectedDate($baseDate);
            }

            $income->save();

            return $income;
        });
    }

    public function toggle(RecurringIncome $income): RecurringIncome
    {
        $income->is_active = ! $income->is_active;

        // If activating, recalculate next expected date
        if ($income->is_active) {
            $baseDate = $income->last_received_date ?? $income->start_date;
            $nextDate = $income->calculateNextExpectedDate($baseDate);

            // If next date is in the past, find the next upcoming date
            while ($nextDate->isPast()) {
                $nextDate = $income->calculateNextExpectedDate($nextDate);
            }

            $income->next_expected_date = $nextDate;
        }

        $income->save();

        return $income;
    }

    public function markReceived(RecurringIncome $income, array $data = []): ?Transaction
    {
        if (! $income->is_active) {
            return null;
        }

        return DB::transaction(function () use ($income, $data) {
            $receivedDate = isset($data['date']) ? Carbon::parse($data['date']) : now();
            
            // Amount provided or default
            $grossAmount = isset($data['amount']) ? (float) $data['amount'] : (float) $income->amount;
            $netAmount = $grossAmount;
            
            $deductions = $data['deductions'] ?? null;
            $deductionsMetadata = null;

            if ($deductions && is_array($deductions)) {
                $totalDeductions = 0;
                $formattedDeductions = [];

                foreach ($deductions as $deduction) {
                    $amount = (float) ($deduction['amount'] ?? 0);
                    $totalDeductions += $amount;
                    $formattedDeductions[] = [
                        'name' => $deduction['name'],
                        'amount' => $amount,
                    ];
                }

                $netAmount = $grossAmount - $totalDeductions;
                
                $deductionsMetadata = [
                    'gross_amount' => $grossAmount,
                    'total_deductions' => $totalDeductions,
                    'net_amount' => $netAmount,
                    'deductions' => $formattedDeductions,
                ];

                // If user opted to save these deductions as default for the future
                if (!empty($data['save_deductions'])) {
                    $income->deductions = $formattedDeductions;
                    $income->amount = $grossAmount; // Update default gross amount
                }
            }

            // Create the transaction
            $transaction = Transaction::create([
                'user_id' => $income->user_id,
                'type' => 'income',
                'amount' => $netAmount, // Save actual received net amount
                'currency' => $income->currency,
                'title' => $income->name,
                'description' => $income->source ? "Income from: {$income->source}" : "Recurring income: {$income->name}",
                'transaction_date' => $receivedDate,
                'to_account_id' => $income->to_account_id,
                'category_id' => $income->category_id,
                'transactionable_type' => $income->getMorphClass(),
                'transactionable_id' => $income->id,
                'metadata' => $deductionsMetadata ? ['salary_breakdown' => $deductionsMetadata] : null,
            ]);

            // Update account balance
            if ($income->toAccount) {
                $income->toAccount->updateBalance($netAmount, 'add');
            }

            // Update income dates
            $income->last_received_date = $receivedDate;
            $income->next_expected_date = $income->calculateNextExpectedDate($receivedDate);

            // Check if income has ended
            if ($income->end_date && $income->next_expected_date->gt($income->end_date)) {
                $income->is_active = false;
                $income->next_expected_date = null;
            }

            $income->save();

            return $transaction;
        });
    }

    public function processExpectedIncomes(): int
    {
        $processed = 0;

        $dueIncomes = RecurringIncome::query()
            ->active()
            ->where('auto_create_transaction', true)
            ->whereNotNull('next_expected_date')
            ->where('next_expected_date', '<=', now())
            ->get();

        foreach ($dueIncomes as $income) {
            // Auto processor doesn't submit a form, so it receives the defaults
            $transaction = $this->markReceived($income, [
                'date' => $income->next_expected_date->toDateString(),
                'amount' => $income->amount,
                'deductions' => $income->deductions,
            ]);
            if ($transaction) {
                $processed++;
            }
        }

        return $processed;
    }
}
