<?php

namespace Database\Factories;

use App\Models\BankAccount;
use App\Models\Card;
use App\Models\Category;
use App\Models\Merchant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        $type = fake()->randomElement(['income', 'expense']);

        return [
            'user_id' => User::factory(),
            'type' => $type,
            'amount' => fake()->randomFloat(2, 5, 500),
            'currency' => 'EUR',
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'transaction_date' => fake()->dateTimeBetween('-3 months', 'now'),
            'from_account_id' => $type === 'expense' ? BankAccount::factory() : null,
            'from_card_id' => null,
            'to_account_id' => $type === 'income' ? BankAccount::factory() : null,
            'to_card_id' => null,
            'category_id' => null,
            'merchant_id' => null,
            'transactionable_type' => null,
            'transactionable_id' => null,
        ];
    }

    public function income(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'income',
            'from_account_id' => null,
            'from_card_id' => null,
            'to_account_id' => BankAccount::factory(),
        ]);
    }

    public function expense(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'expense',
            'from_account_id' => BankAccount::factory(),
            'to_account_id' => null,
        ]);
    }

    public function expenseWithCard(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'expense',
            'from_account_id' => null,
            'from_card_id' => Card::factory(),
            'to_account_id' => null,
        ]);
    }

    public function transfer(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'transfer',
            'from_account_id' => BankAccount::factory(),
            'to_account_id' => BankAccount::factory(),
            'category_id' => null,
            'merchant_id' => null,
        ]);
    }

    public function cardPayment(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'card_payment',
            'from_account_id' => BankAccount::factory(),
            'to_card_id' => Card::factory()->credit(),
            'category_id' => null,
            'merchant_id' => null,
            'title' => 'Credit Card Payment',
        ]);
    }

    public function withCategory(Category $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => $category->id,
        ]);
    }

    public function withMerchant(Merchant $merchant): static
    {
        return $this->state(fn (array $attributes) => [
            'merchant_id' => $merchant->id,
        ]);
    }
}
