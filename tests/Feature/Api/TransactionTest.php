<?php

use App\Models\BankAccount;
use App\Models\Category;
use App\Models\Merchant;
use App\Models\Transaction;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->account = BankAccount::factory()->create([
        'user_id' => $this->user->id,
        'balance' => 5000,
    ]);
    $this->category = Category::factory()->create(['user_id' => $this->user->id]);
    $this->merchant = Merchant::factory()->create(['user_id' => $this->user->id]);
});

test('user can list their transactions', function () {
    Transaction::factory()->count(3)->create([
        'user_id' => $this->user->id,
        'from_account_id' => $this->account->id,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/transactions');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

test('user can create an expense transaction', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 50.00,
            'title' => 'Coffee',
            'transaction_date' => now()->format('Y-m-d'),
            'from_account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'merchant_id' => $this->merchant->id,
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.title', 'Coffee')
        ->assertJsonPath('data.amount', 50);

    $this->account->refresh();
    expect($this->account->balance)->toBe('4950.00');
});

test('user can create an income transaction', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/transactions', [
            'type' => 'income',
            'amount' => 3000.00,
            'title' => 'Salary',
            'transaction_date' => now()->format('Y-m-d'),
            'to_account_id' => $this->account->id,
        ]);

    $response->assertCreated();

    $this->account->refresh();
    expect($this->account->balance)->toBe('8000.00');
});

test('user can filter transactions by type', function () {
    Transaction::factory()->expense()->create([
        'user_id' => $this->user->id,
        'from_account_id' => $this->account->id,
    ]);
    Transaction::factory()->income()->create([
        'user_id' => $this->user->id,
        'to_account_id' => $this->account->id,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/transactions?type=expense');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

test('user can search transactions', function () {
    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Amazon Purchase',
        'from_account_id' => $this->account->id,
    ]);
    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Grocery Shopping',
        'from_account_id' => $this->account->id,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/transactions?search=Amazon');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});
