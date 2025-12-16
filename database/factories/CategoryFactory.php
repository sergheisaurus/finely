<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'parent_id' => null,
            'name' => fake()->randomElement([
                'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
                'Bills & Utilities', 'Health & Fitness', 'Travel', 'Education',
                'Personal Care', 'Gifts & Donations',
            ]),
            'icon' => fake()->randomElement(['utensils', 'car', 'shopping-bag', 'film', 'home', 'heart', 'plane', 'book', 'scissors', 'gift']),
            'color' => fake()->hexColor(),
            'type' => 'expense',
        ];
    }

    public function income(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'income',
            'name' => fake()->randomElement(['Salary', 'Freelance', 'Investments', 'Rental Income', 'Side Business', 'Refunds']),
            'icon' => fake()->randomElement(['briefcase', 'laptop', 'trending-up', 'home', 'store', 'rotate-ccw']),
        ]);
    }

    public function expense(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'expense',
        ]);
    }

    public function child(Category $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parent->id,
            'user_id' => $parent->user_id,
            'type' => $parent->type,
        ]);
    }
}
