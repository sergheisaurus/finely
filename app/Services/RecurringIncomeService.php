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

    public function markReceived(RecurringIncome $income, ?Carbon $receivedDate = null): ?Transaction
    {
        if (! $income->is_active) {
            return null;
        }

        return DB::transaction(function () use ($income, $receivedDate) {
            $receivedDate = $receivedDate ?? now();

            // Create the transaction
            $transaction = Transaction::create([
                'user_id' => $income->user_id,
                'type' => 'income',
                'amount' => $income->amount,
                'currency' => $income->currency,
                'title' => $income->name,
                'description' => $income->source ? "Income from: {$income->source}" : "Recurring income: {$income->name}",
                'transaction_date' => $receivedDate,
                'to_account_id' => $income->to_account_id,
                'category_id' => $income->category_id,
                'transactionable_type' => RecurringIncome::class,
                'transactionable_id' => $income->id,
            ]);

            // Update account balance
            if ($income->toAccount) {
                $income->toAccount->updateBalance($income->amount, 'add');
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
            $transaction = $this->markReceived($income, $income->next_expected_date);
            if ($transaction) {
                $processed++;
            }
        }

        return $processed;
    }
}
