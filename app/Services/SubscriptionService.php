<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SubscriptionService
{
    public function create(array $data): Subscription
    {
        return DB::transaction(function () use ($data) {
            $subscription = new Subscription($data);

            // Calculate next billing date
            $startDate = Carbon::parse($data['start_date']);
            if ($startDate->isFuture() || $startDate->isToday()) {
                $subscription->next_billing_date = $startDate;
            } else {
                $subscription->next_billing_date = $subscription->calculateNextBillingDate($startDate);
            }

            $subscription->save();

            return $subscription;
        });
    }

    public function update(Subscription $subscription, array $data): Subscription
    {
        return DB::transaction(function () use ($subscription, $data) {
            $subscription->fill($data);

            // Recalculate next billing date if billing cycle changed
            if ($subscription->isDirty(['billing_cycle', 'billing_day', 'billing_month', 'start_date'])) {
                $baseDate = $subscription->last_billed_date ?? Carbon::parse($data['start_date'] ?? $subscription->start_date);
                $subscription->next_billing_date = $subscription->calculateNextBillingDate($baseDate);
            }

            $subscription->save();

            return $subscription;
        });
    }

    public function toggle(Subscription $subscription): Subscription
    {
        $subscription->is_active = ! $subscription->is_active;

        // If activating, recalculate next billing date
        if ($subscription->is_active) {
            $baseDate = $subscription->last_billed_date ?? $subscription->start_date;
            $nextDate = $subscription->calculateNextBillingDate($baseDate);

            // If next date is in the past, find the next upcoming date
            while ($nextDate->isPast()) {
                $nextDate = $subscription->calculateNextBillingDate($nextDate);
            }

            $subscription->next_billing_date = $nextDate;
        }

        $subscription->save();

        return $subscription;
    }

    public function processPayment(Subscription $subscription, ?Carbon $transactionDate = null): ?Transaction
    {
        if (! $subscription->is_active) {
            return null;
        }

        return DB::transaction(function () use ($subscription, $transactionDate) {
            $transactionDate = $transactionDate ?? now();

            // Create the transaction
            $transaction = Transaction::create([
                'user_id' => $subscription->user_id,
                'type' => 'expense',
                'amount' => $subscription->amount,
                'currency' => $subscription->currency,
                'title' => $subscription->name,
                'description' => "Subscription payment: {$subscription->name}",
                'transaction_date' => $transactionDate,
                'from_account_id' => $subscription->payment_method_type === 'bank_account' ? $subscription->payment_method_id : null,
                'from_card_id' => $subscription->payment_method_type === 'card' ? $subscription->payment_method_id : null,
                'category_id' => $subscription->category_id,
                'merchant_id' => $subscription->merchant_id,
                'transactionable_type' => $subscription->getMorphClass(),
                'transactionable_id' => $subscription->id,
            ]);

            // Update account/card balance
            if ($subscription->payment_method_type === 'bank_account' && $subscription->paymentMethod) {
                $subscription->paymentMethod->updateBalance($subscription->amount, 'subtract');
            } elseif ($subscription->payment_method_type === 'card' && $subscription->paymentMethod) {
                $subscription->paymentMethod->updateBalance($subscription->amount, 'add');
            }

            // Update subscription dates
            $subscription->last_billed_date = $transactionDate;
            $subscription->next_billing_date = $subscription->calculateNextBillingDate($transactionDate);

            // Check if subscription has ended
            if ($subscription->end_date && $subscription->next_billing_date->gt($subscription->end_date)) {
                $subscription->is_active = false;
                $subscription->next_billing_date = null;
            }

            $subscription->save();

            return $transaction;
        });
    }

    public function processDueSubscriptions(): int
    {
        $processed = 0;

        $dueSubscriptions = Subscription::query()
            ->active()
            ->where('auto_create_transaction', true)
            ->whereNotNull('next_billing_date')
            ->where('next_billing_date', '<=', now())
            ->get();

        foreach ($dueSubscriptions as $subscription) {
            $transaction = $this->processPayment($subscription, $subscription->next_billing_date);
            if ($transaction) {
                $processed++;
            }
        }

        return $processed;
    }
}
