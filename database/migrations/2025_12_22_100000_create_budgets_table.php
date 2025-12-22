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
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('CHF');

            // Period configuration
            $table->enum('period', ['monthly', 'quarterly', 'yearly']);
            $table->date('start_date');
            $table->date('end_date')->nullable();

            // Current period tracking
            $table->date('current_period_start')->nullable();
            $table->date('current_period_end')->nullable();
            $table->decimal('current_period_spent', 12, 2)->default(0);

            // Rollover configuration
            $table->boolean('rollover_unused')->default(false);
            $table->decimal('rollover_amount', 12, 2)->default(0);

            // Alert configuration
            $table->unsignedTinyInteger('alert_threshold')->default(80);
            $table->boolean('alert_sent')->default(false);

            // Status
            $table->boolean('is_active')->default(true);

            // Visual customization
            $table->string('color', 7)->nullable();
            $table->string('icon')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for efficient queries
            $table->index(['user_id', 'is_active']);
            $table->index(['user_id', 'category_id']);
            $table->index(['current_period_end', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
