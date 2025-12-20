<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_incomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('to_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();

            $table->string('name');
            $table->text('description')->nullable();
            $table->string('source')->nullable(); // e.g., "Employer Name", "Client Name"
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('CHF');

            // Frequency configuration
            $table->enum('frequency', ['weekly', 'bi_weekly', 'monthly', 'quarterly', 'yearly']);
            $table->unsignedTinyInteger('payment_day')->nullable(); // Day of month (1-31) or day of week (0-6)
            $table->unsignedTinyInteger('payment_month')->nullable(); // For yearly frequency

            // Dates for calendar view
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->date('last_received_date')->nullable();
            $table->date('next_expected_date')->nullable();

            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('auto_create_transaction')->default(true);
            $table->unsignedTinyInteger('reminder_days_before')->default(0);

            // Visual customization
            $table->string('color', 7)->nullable();
            $table->string('icon')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for calendar queries
            $table->index(['user_id', 'is_active']);
            $table->index(['user_id', 'next_expected_date']);
            $table->index(['next_expected_date', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_incomes');
    }
};
