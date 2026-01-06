<?php

use App\Models\BankAccount;
use App\Models\Card;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('user can list their cards', function () {
    Card::factory()->count(3)->create(['user_id' => $this->user->id]);
    Card::factory()->create(); // Another user's card

    $response = $this->actingAs($this->user)
        ->getJson('/api/cards');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

test('user can create a card', function () {
    $bankAccount = BankAccount::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)
        ->postJson('/api/cards', [
            'type' => 'debit',
            'bank_account_id' => $bankAccount->id,
            'card_holder_name' => 'John Doe',
            'card_number' => '1234567890123456',
            'card_network' => 'visa',
            'expiry_month' => 12,
            'expiry_year' => 2030,
            'color' => '#000000',
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.card_holder_name', 'John Doe')
        ->assertJsonPath('data.card_number', '1234567890123456') // Verify card_number is returned
        ->assertJsonPath('data.last_four_digits', '3456');

    // Verify it's encrypted in DB (implicitly, as we rely on the model cast)
    // But we can check that we can retrieve it
    $card = Card::where('user_id', $this->user->id)->first();
    expect($card->card_number)->toBe('1234567890123456');
    expect($card->last_four_digits)->toBe('3456');
});

test('user can view their card', function () {
    $card = Card::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/cards/{$card->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $card->id)
        ->assertJsonPath('data.card_number', $card->card_number); // Verify card_number is returned
});

test('user cannot view another users card', function () {
    $card = Card::factory()->create();

    $response = $this->actingAs($this->user)
        ->getJson("/api/cards/{$card->id}");

    $response->assertForbidden();
});

test('user can update their card', function () {
    $card = Card::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)
        ->putJson("/api/cards/{$card->id}", [
            'card_holder_name' => 'Updated Name',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.card_holder_name', 'Updated Name');
});

test('user can delete their card', function () {
    $card = Card::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)
        ->deleteJson("/api/cards/{$card->id}");

    $response->assertOk();
    $this->assertSoftDeleted('cards', ['id' => $card->id]);
});
