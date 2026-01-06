<?php

namespace Database\Factories;

use App\Models\BankAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Card>
 */
class CardFactory extends Factory
{
    public function definition(): array
    {
        $type = fake()->randomElement(['debit', 'credit']);
        $expiryYear = fake()->numberBetween(date('Y'), date('Y') + 5);

        return [
            'user_id' => User::factory(),
            'bank_account_id' => $type === 'debit' ? BankAccount::factory() : null,
            'type' => $type,
            'card_holder_name' => fake()->name(),
            'card_number' => fake()->numerify('################'),
            'card_network' => fake()->randomElement(['visa', 'mastercard', 'amex']),
            'expiry_month' => fake()->numberBetween(1, 12),
            'expiry_year' => $expiryYear,
            'credit_limit' => $type === 'credit' ? fake()->randomFloat(2, 1000, 10000) : null,
            'current_balance' => $type === 'credit' ? fake()->randomFloat(2, 0, 5000) : 0,
            'payment_due_day' => $type === 'credit' ? fake()->numberBetween(1, 28) : null,
            'billing_cycle_day' => $type === 'credit' ? fake()->numberBetween(1, 28) : null,
            'color' => fake()->randomElement(['#1e293b', '#7c3aed', '#0891b2', '#059669', '#dc2626']),
            'is_default' => false,
        ];
    }

    public function debit(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'debit',
            'bank_account_id' => BankAccount::factory(),
            'credit_limit' => null,
            'current_balance' => 0,
            'payment_due_day' => null,
            'billing_cycle_day' => null,
        ]);
    }

    public function credit(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'credit',
            'bank_account_id' => null,
            'credit_limit' => fake()->randomFloat(2, 1000, 10000),
            'current_balance' => fake()->randomFloat(2, 0, 5000),
            'payment_due_day' => fake()->numberBetween(1, 28),
            'billing_cycle_day' => fake()->numberBetween(1, 28),
        ]);
    }

    public function visa(): static
    {
        return $this->state(fn (array $attributes) => [
            'card_network' => 'visa',
        ]);
    }

    public function mastercard(): static
    {
        return $this->state(fn (array $attributes) => [
            'card_network' => 'mastercard',
        ]);
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }
}
