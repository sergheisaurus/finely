<?php

use App\Models\BankAccount;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('user can list their bank accounts', function () {
    BankAccount::factory()->count(3)->create(['user_id' => $this->user->id]);
    BankAccount::factory()->create(); // Another user's account

    $response = $this->actingAs($this->user)
        ->getJson('/api/accounts');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

test('user can create a bank account', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/accounts', [
            'name' => 'My Checking Account',
            'type' => 'checking',
            'balance' => 1000.50,
            'currency' => 'EUR',
            'bank_name' => 'ING',
            'color' => '#6366f1',
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'My Checking Account')
        ->assertJsonPath('data.balance', 1000.50);

    $this->assertDatabaseHas('bank_accounts', [
        'user_id' => $this->user->id,
        'name' => 'My Checking Account',
    ]);
});

test('user can view their bank account', function () {
    $account = BankAccount::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/accounts/{$account->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $account->id);
});

test('user cannot view another users bank account', function () {
    $account = BankAccount::factory()->create();

    $response = $this->actingAs($this->user)
        ->getJson("/api/accounts/{$account->id}");

    $response->assertForbidden();
});

test('user can update their bank account', function () {
    $account = BankAccount::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)
        ->putJson("/api/accounts/{$account->id}", [
            'name' => 'Updated Name',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Updated Name');
});

test('user can delete their bank account', function () {
    $account = BankAccount::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)
        ->deleteJson("/api/accounts/{$account->id}");

    $response->assertOk();
    $this->assertSoftDeleted('bank_accounts', ['id' => $account->id]);
});

test('user can set default bank account', function () {
    $account1 = BankAccount::factory()->create(['user_id' => $this->user->id, 'is_default' => true]);
    $account2 = BankAccount::factory()->create(['user_id' => $this->user->id, 'is_default' => false]);

    $response = $this->actingAs($this->user)
        ->postJson("/api/accounts/{$account2->id}/set-default");

    $response->assertOk()
        ->assertJsonPath('data.is_default', true);

    $this->assertDatabaseHas('bank_accounts', ['id' => $account1->id, 'is_default' => false]);
    $this->assertDatabaseHas('bank_accounts', ['id' => $account2->id, 'is_default' => true]);
});
