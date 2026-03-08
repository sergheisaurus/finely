<?php

use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    $this->user = User::factory()->create();
});

afterEach(function () {
    Carbon::setTestNow();
});

test('creating a past monthly subscription keeps the first unpaid billing date', function () {
    Carbon::setTestNow('2026-03-08');

    $response = $this->actingAs($this->user)
        ->postJson('/api/subscriptions', [
            'name' => 'Claude Pro',
            'amount' => 16.76,
            'currency' => 'CHF',
            'billing_cycle' => 'monthly',
            'billing_day' => 26,
            'start_date' => '2026-02-01',
            'is_active' => true,
            'auto_create_transaction' => true,
            'reminder_days_before' => 3,
        ]);

    $response->assertOk()
        ->assertJsonPath('data.next_billing_date', '2026-02-26');
});

test('processing an overdue payment advances from the due cycle instead of today', function () {
    $subscription = Subscription::create([
        'user_id' => $this->user->id,
        'name' => 'Claude Pro',
        'amount' => 16.76,
        'currency' => 'CHF',
        'billing_cycle' => 'monthly',
        'billing_day' => 26,
        'start_date' => '2026-02-01',
        'next_billing_date' => '2026-02-26',
        'is_active' => true,
        'auto_create_transaction' => true,
        'reminder_days_before' => 3,
    ]);

    Carbon::setTestNow('2026-03-08');

    $response = $this->actingAs($this->user)
        ->postJson("/api/subscriptions/{$subscription->id}/process", [
            'transaction_date' => '2026-03-08',
        ]);

    $response->assertOk()
        ->assertJsonPath('transaction.transaction_date', '2026-03-08')
        ->assertJsonPath('transaction.amount', 16.76);

    $subscription->refresh();

    expect($subscription->last_billed_date->toDateString())->toBe('2026-02-26')
        ->and($subscription->next_billing_date->toDateString())->toBe('2026-03-26');
});
