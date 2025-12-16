<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BankAccount>
 */
class BankAccountFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['Main Account', 'Savings', 'Emergency Fund', 'Travel Fund', 'Investment Account']),
            'type' => fake()->randomElement(['checking', 'savings']),
            'balance' => fake()->randomFloat(2, 100, 50000),
            'currency' => 'EUR',
            'account_number' => fake()->iban(),
            'bank_name' => fake()->randomElement(['ING', 'Revolut', 'N26', 'Deutsche Bank', 'Chase', 'HSBC']),
            'color' => fake()->hexColor(),
            'icon' => null,
            'is_default' => false,
        ];
    }

    public function checking(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'checking',
        ]);
    }

    public function savings(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'savings',
        ]);
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }
}
