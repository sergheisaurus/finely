<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('merchant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

            // Polymorphic payment method (can be BankAccount or Card)
            $table->string('payment_method_type')->nullable(); // 'bank_account' or 'card'
            $table->unsignedBigInteger('payment_method_id')->nullable();

            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('CHF');

            // Billing cycle configuration
            $table->enum('billing_cycle', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
            $table->unsignedTinyInteger('billing_day')->nullable(); // 1-31 for monthly, day of week for weekly
            $table->unsignedTinyInteger('billing_month')->nullable(); // 1-12 for yearly

            // Dates for calendar view
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->date('last_billed_date')->nullable();
            $table->date('next_billing_date')->nullable();

            // Status and reminders
            $table->boolean('is_active')->default(true);
            $table->boolean('auto_create_transaction')->default(true);
            $table->unsignedTinyInteger('reminder_days_before')->default(3);

            // Visual customization
            $table->string('color', 7)->nullable();
            $table->string('icon')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for calendar queries
            $table->index(['user_id', 'is_active']);
            $table->index(['user_id', 'next_billing_date']);
            $table->index(['next_billing_date', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
