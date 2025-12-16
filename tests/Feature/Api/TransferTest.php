<?php

use App\Models\BankAccount;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->fromAccount = BankAccount::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Checking',
        'balance' => 5000,
    ]);
    $this->toAccount = BankAccount::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Savings',
        'balance' => 1000,
    ]);
});

test('user can transfer money between accounts', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/transfers', [
            'from_account_id' => $this->fromAccount->id,
            'to_account_id' => $this->toAccount->id,
            'amount' => 1000.00,
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.type', 'transfer')
        ->assertJsonPath('data.amount', 1000);

    $this->fromAccount->refresh();
    $this->toAccount->refresh();

    expect($this->fromAccount->balance)->toBe('4000.00');
    expect($this->toAccount->balance)->toBe('2000.00');
});

test('user cannot transfer more than account balance', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/transfers', [
            'from_account_id' => $this->fromAccount->id,
            'to_account_id' => $this->toAccount->id,
            'amount' => 10000.00,
        ]);

    $response->assertUnprocessable();
});

test('user cannot transfer to the same account', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/transfers', [
            'from_account_id' => $this->fromAccount->id,
            'to_account_id' => $this->fromAccount->id,
            'amount' => 100.00,
        ]);

    $response->assertUnprocessable();
});
