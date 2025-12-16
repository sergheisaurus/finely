<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Merchant>
 */
class MerchantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->company(),
            'type' => 'company',
            'image_path' => null,
        ];
    }

    public function company(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'company',
            'name' => fake()->company(),
        ]);
    }

    public function person(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'person',
            'name' => fake()->name(),
        ]);
    }
}
