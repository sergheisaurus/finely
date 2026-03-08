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

test('user can filter transactions by account', function () {
    $account2 = BankAccount::factory()->create(['user_id' => $this->user->id]);

    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'from_account_id' => $this->account->id,
        'title' => 'Account 1 Transaction',
    ]);

    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'from_account_id' => $account2->id,
        'title' => 'Account 2 Transaction',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/transactions?account_id={$this->account->id}");

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Account 1 Transaction');
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

test('user can create a split expense transaction', function () {
    $giftCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
    ]);
    $funCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
    ]);

    $response = $this->actingAs($this->user)
        ->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 60.00,
            'title' => 'Olivia Rodrigo records',
            'transaction_date' => now()->format('Y-m-d'),
            'from_account_id' => $this->account->id,
            'category_id' => $giftCategory->id,
            'merchant_id' => $this->merchant->id,
            'splits' => [
                [
                    'amount' => 30.00,
                    'category_id' => $funCategory->id,
                ],
            ],
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.amount', 30)
        ->assertJsonPath('data.category_id', $giftCategory->id);

    $transactions = Transaction::query()
        ->where('user_id', $this->user->id)
        ->orderBy('amount')
        ->get();

    expect($transactions)->toHaveCount(2);
    expect($transactions->pluck('amount')->map(fn ($amount) => (float) $amount)->all())
        ->toBe([30.0, 30.0]);
    expect($transactions->pluck('category_id')->all())
        ->toContain($giftCategory->id, $funCategory->id);

    $this->account->refresh();
    expect($this->account->balance)->toBe('4940.00');
});

test('split expense transaction must leave an amount on the main category', function () {
    $giftCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
    ]);
    $funCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
    ]);

    $response = $this->actingAs($this->user)
        ->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 60.00,
            'title' => 'Olivia Rodrigo records',
            'transaction_date' => now()->format('Y-m-d'),
            'from_account_id' => $this->account->id,
            'category_id' => $giftCategory->id,
            'merchant_id' => $this->merchant->id,
            'splits' => [
                [
                    'amount' => 60.00,
                    'category_id' => $funCategory->id,
                ],
            ],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['splits']);
});

test('user can update a split transaction group', function () {
    $giftCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
    ]);
    $funCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
    ]);
    $friendsCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
    ]);

    $createResponse = $this->actingAs($this->user)
        ->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 60.00,
            'title' => 'Olivia Rodrigo records',
            'transaction_date' => now()->format('Y-m-d'),
            'from_account_id' => $this->account->id,
            'category_id' => $giftCategory->id,
            'merchant_id' => $this->merchant->id,
            'splits' => [
                [
                    'amount' => 30.00,
                    'category_id' => $funCategory->id,
                ],
            ],
        ]);

    $transactionId = $createResponse->json('data.id');

    $response = $this->actingAs($this->user)
        ->putJson("/api/transactions/{$transactionId}", [
            'amount' => 60.00,
            'title' => 'Olivia Rodrigo records',
            'category_id' => $giftCategory->id,
            'merchant_id' => $this->merchant->id,
            'transaction_date' => now()->format('Y-m-d'),
            'from_account_id' => $this->account->id,
            'splits' => [
                [
                    'amount' => 15.00,
                    'category_id' => $funCategory->id,
                ],
                [
                    'amount' => 15.00,
                    'category_id' => $friendsCategory->id,
                ],
            ],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.amount', 30)
        ->assertJsonPath('data.category_id', $giftCategory->id);

    $transactions = Transaction::query()
        ->where('user_id', $this->user->id)
        ->orderBy('amount')
        ->get();

    expect($transactions)->toHaveCount(3);
    expect($transactions->pluck('amount')->map(fn ($amount) => (float) $amount)->all())
        ->toBe([15.0, 15.0, 30.0]);
    expect($transactions->pluck('category_id')->all())
        ->toContain($giftCategory->id, $funCategory->id, $friendsCategory->id);

    $this->account->refresh();
    expect($this->account->balance)->toBe('4940.00');
});

test('deleting one split transaction deletes the whole split group', function () {
    $giftCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
    ]);
    $funCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
    ]);

    $createResponse = $this->actingAs($this->user)
        ->postJson('/api/transactions', [
            'type' => 'expense',
            'amount' => 60.00,
            'title' => 'Olivia Rodrigo records',
            'transaction_date' => now()->format('Y-m-d'),
            'from_account_id' => $this->account->id,
            'category_id' => $giftCategory->id,
            'merchant_id' => $this->merchant->id,
            'splits' => [
                [
                    'amount' => 30.00,
                    'category_id' => $funCategory->id,
                ],
            ],
        ]);

    $transactionId = $createResponse->json('data.id');

    $this->actingAs($this->user)
        ->deleteJson("/api/transactions/{$transactionId}")
        ->assertOk();

    expect(Transaction::query()->where('user_id', $this->user->id)->count())
        ->toBe(0);

    $this->account->refresh();
    expect($this->account->balance)->toBe('5000.00');
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
