<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create([
        'onboarding_completed_at' => now(),
    ]);

    // Create a bank account so onboarding is complete
    \App\Models\BankAccount::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user);

    $this->get(route('dashboard'))->assertOk();
});

test('authenticated users without onboarding are redirected', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('dashboard'))->assertRedirect(route('onboarding.index'));
});
