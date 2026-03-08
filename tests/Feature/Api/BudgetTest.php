<?php

use App\Models\BankAccount;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Merchant;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-03-15 12:00:00'));

    $this->user = User::factory()->create();
    $this->account = BankAccount::factory()->create([
        'user_id' => $this->user->id,
        'balance' => 5000,
    ]);
    $this->category = Category::factory()->expense()->create([
        'user_id' => $this->user->id,
        'name' => 'Groceries',
    ]);
    $this->merchant = Merchant::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Migros',
    ]);
    $this->budget = Budget::create([
        'user_id' => $this->user->id,
        'category_id' => $this->category->id,
        'name' => 'Groceries Budget',
        'amount' => 500,
        'currency' => 'CHF',
        'period' => 'monthly',
        'start_date' => '2026-02-01',
        'current_period_start' => '2026-02-01',
        'current_period_end' => '2026-02-28',
        'current_period_spent' => 0,
        'alert_threshold' => 80,
        'is_active' => true,
    ]);
});

afterEach(function () {
    Carbon::setTestNow();
});

test('budget endpoints automatically sync the current period and breakdown', function () {
    Transaction::factory()->expense()->create([
        'user_id' => $this->user->id,
        'from_account_id' => $this->account->id,
        'category_id' => $this->category->id,
        'merchant_id' => $this->merchant->id,
        'amount' => 120,
        'currency' => 'CHF',
        'transaction_date' => '2026-03-10',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/budgets/{$this->budget->id}");

    $response->assertOk()
        ->assertJsonPath('data.current_period_start', '2026-03-01')
        ->assertJsonPath('data.current_period_end', '2026-03-31')
        ->assertJsonPath('data.current_period_spent', 120);

    $breakdownResponse = $this->actingAs($this->user)
        ->getJson("/api/budgets/{$this->budget->id}/breakdown");

    $breakdownResponse->assertOk()
        ->assertJsonPath('total', 120)
        ->assertJsonPath('data.0.name', 'Migros')
        ->assertJsonPath('data.0.amount', 120)
        ->assertJsonPath('data.0.count', 1);
});

test('budget history includes backfilled spending for previous periods', function () {
    Transaction::factory()->expense()->create([
        'user_id' => $this->user->id,
        'from_account_id' => $this->account->id,
        'category_id' => $this->category->id,
        'merchant_id' => $this->merchant->id,
        'amount' => 80,
        'currency' => 'CHF',
        'transaction_date' => '2026-02-18',
    ]);

    Transaction::factory()->expense()->create([
        'user_id' => $this->user->id,
        'from_account_id' => $this->account->id,
        'category_id' => $this->category->id,
        'merchant_id' => $this->merchant->id,
        'amount' => 120,
        'currency' => 'CHF',
        'transaction_date' => '2026-03-10',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/budgets/{$this->budget->id}/history?limit=2");

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.period_start', '2026-03-01')
        ->assertJsonPath('data.0.spent', 120)
        ->assertJsonPath('data.0.is_current', true)
        ->assertJsonPath('data.1.period_start', '2026-02-01')
        ->assertJsonPath('data.1.spent', 80)
        ->assertJsonPath('data.1.is_current', false);
});
