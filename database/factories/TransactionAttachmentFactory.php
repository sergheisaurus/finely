<?php

namespace Database\Factories;

use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TransactionAttachment>
 */
class TransactionAttachmentFactory extends Factory
{
    public function definition(): array
    {
        $fileTypes = [
            'image/jpeg' => 'receipt.jpg',
            'image/png' => 'screenshot.png',
            'application/pdf' => 'invoice.pdf',
        ];

        $fileType = fake()->randomElement(array_keys($fileTypes));

        return [
            'transaction_id' => Transaction::factory(),
            'file_path' => 'attachments/'.fake()->uuid().'/'.$fileTypes[$fileType],
            'file_name' => $fileTypes[$fileType],
            'file_type' => $fileType,
            'file_size' => fake()->numberBetween(10000, 5000000),
        ];
    }

    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'file_name' => 'receipt.jpg',
            'file_type' => 'image/jpeg',
        ]);
    }

    public function pdf(): static
    {
        return $this->state(fn (array $attributes) => [
            'file_name' => 'invoice.pdf',
            'file_type' => 'application/pdf',
        ]);
    }
}
