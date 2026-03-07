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

    $this->coverCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
        'is_secret' => false,
    ]);
    $this->secretCategory = Category::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
        'is_secret' => true,
        'cover_category_id' => $this->coverCategory->id,
    ]);

    $this->coverMerchant = Merchant::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'company',
        'is_secret' => false,
    ]);
    $this->secretMerchant = Merchant::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'company',
        'is_secret' => true,
        'cover_merchant_id' => $this->coverMerchant->id,
    ]);
});

test('secret categories are hidden unless secret mode is active', function () {
    $response = $this->actingAs($this->user)->getJson('/api/categories');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonMissingPath('data.1');

    $secretResponse = $this->actingAs($this->user)
        ->withHeader('X-Secret-Mode', 'true')
        ->getJson('/api/categories');

    $secretResponse->assertOk()
        ->assertJsonCount(2, 'data');
});

test('secret merchants are hidden unless secret mode is active', function () {
    $response = $this->actingAs($this->user)->getJson('/api/merchants');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonMissingPath('data.1');

    $secretResponse = $this->actingAs($this->user)
        ->withHeader('X-Secret-Mode', 'true')
        ->getJson('/api/merchants');

    $secretResponse->assertOk()
        ->assertJsonCount(2, 'data');
});

test('secret transaction details are only revealed in secret mode', function () {
    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
        'title' => 'Online shopping',
        'secret_title' => 'Private purchase',
        'from_account_id' => $this->account->id,
        'category_id' => $this->coverCategory->id,
        'secret_category_id' => $this->secretCategory->id,
        'merchant_id' => $this->coverMerchant->id,
        'secret_merchant_id' => $this->secretMerchant->id,
        'transaction_date' => now()->format('Y-m-d'),
    ]);

    $response = $this->actingAs($this->user)->getJson('/api/transactions');

    $response->assertOk()
        ->assertJsonPath('data.0.title', 'Online shopping')
        ->assertJsonPath('data.0.secret_title', null)
        ->assertJsonPath('data.0.category_id', $this->coverCategory->id)
        ->assertJsonPath('data.0.merchant_id', $this->coverMerchant->id)
        ->assertJsonPath('data.0.is_secret', true);

    $secretResponse = $this->actingAs($this->user)
        ->withHeader('X-Secret-Mode', 'true')
        ->getJson('/api/transactions');

    $secretResponse->assertOk()
        ->assertJsonPath('data.0.title', 'Private purchase')
        ->assertJsonPath('data.0.secret_title', 'Private purchase')
        ->assertJsonPath('data.0.category_id', $this->secretCategory->id)
        ->assertJsonPath('data.0.merchant_id', $this->secretMerchant->id);
});

test('secret mode search includes secret titles', function () {
    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'type' => 'expense',
        'title' => 'Online shopping',
        'secret_title' => 'Private purchase',
        'from_account_id' => $this->account->id,
        'category_id' => $this->coverCategory->id,
        'secret_category_id' => $this->secretCategory->id,
        'merchant_id' => $this->coverMerchant->id,
        'secret_merchant_id' => $this->secretMerchant->id,
        'transaction_date' => now()->format('Y-m-d'),
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/transactions?search=Private');

    $response->assertOk()->assertJsonCount(0, 'data');

    $secretResponse = $this->actingAs($this->user)
        ->withHeader('X-Secret-Mode', 'true')
        ->getJson('/api/transactions?search=Private');

    $secretResponse->assertOk()->assertJsonCount(1, 'data');
});

test('secret transaction can use cover values from secret category and merchant automatically', function () {
    $response = $this->actingAs($this->user)->postJson('/api/transactions', [
        'type' => 'expense',
        'amount' => 25.00,
        'title' => '',
        'secret_title' => 'Private purchase',
        'transaction_date' => now()->format('Y-m-d'),
        'from_account_id' => $this->account->id,
        'secret_category_id' => $this->secretCategory->id,
        'secret_merchant_id' => $this->secretMerchant->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.title', 'Private transaction')
        ->assertJsonPath('data.category_id', $this->coverCategory->id)
        ->assertJsonPath('data.merchant_id', $this->coverMerchant->id)
        ->assertJsonPath('data.secret_title', null);

    $transaction = Transaction::query()->latest('id')->first();

    expect($transaction)->not->toBeNull();
    expect($transaction->title)->toBe('Private transaction');
    expect($transaction->category_id)->toBe($this->coverCategory->id);
    expect($transaction->merchant_id)->toBe($this->coverMerchant->id);
    expect($transaction->secret_category_id)->toBe($this->secretCategory->id);
    expect($transaction->secret_merchant_id)->toBe($this->secretMerchant->id);
});
