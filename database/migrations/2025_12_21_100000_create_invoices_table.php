<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('merchant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

            // Invoice identification
            $table->string('invoice_number')->nullable();
            $table->string('reference')->nullable();

            // Amounts
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('CHF');

            // Dates
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->date('paid_date')->nullable();

            // Status: pending, paid, overdue, cancelled
            $table->string('status')->default('pending');

            // Recurring invoice settings
            $table->boolean('is_recurring')->default(false);
            $table->string('frequency')->nullable(); // monthly, quarterly, yearly
            $table->unsignedTinyInteger('billing_day')->nullable();
            $table->date('next_due_date')->nullable();
            $table->unsignedInteger('times_paid')->default(0);

            // Swiss QR-Invoice data (JSON for flexibility)
            $table->json('qr_data')->nullable();

            // Payment details (extracted from QR or manual entry)
            $table->string('creditor_name')->nullable();
            $table->string('creditor_iban')->nullable();
            $table->string('payment_reference')->nullable();

            // Notes
            $table->text('notes')->nullable();

            // Visual
            $table->string('color', 7)->nullable();
            $table->string('icon')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'due_date']);
            $table->index(['user_id', 'merchant_id']);
            $table->index(['user_id', 'is_recurring']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
