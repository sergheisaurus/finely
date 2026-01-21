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
        // Add indexes to transactions table for improved statistics query performance
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['user_id', 'transaction_date'], 'idx_transactions_user_date');
            $table->index(['user_id', 'type', 'transaction_date'], 'idx_transactions_user_type_date');
            $table->index(['user_id', 'category_id', 'transaction_date'], 'idx_transactions_user_category_date');
            $table->index(['user_id', 'merchant_id', 'transaction_date'], 'idx_transactions_user_merchant_date');
        });

        // Add indexes to budgets table for improved statistics query performance
        Schema::table('budgets', function (Blueprint $table) {
            $table->index(['user_id', 'current_period_start', 'current_period_end'], 'idx_budgets_user_period');
            $table->index(['user_id', 'is_active'], 'idx_budgets_user_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove indexes from transactions table
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_user_date');
            $table->dropIndex('idx_transactions_user_type_date');
            $table->dropIndex('idx_transactions_user_category_date');
            $table->dropIndex('idx_transactions_user_merchant_date');
        });

        // Remove indexes from budgets table
        Schema::table('budgets', function (Blueprint $table) {
            $table->dropIndex('idx_budgets_user_period');
            $table->dropIndex('idx_budgets_user_active');
        });
    }
};
