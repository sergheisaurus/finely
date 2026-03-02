<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recurring_incomes', function (Blueprint $table) {
            $table->boolean('is_salary')->default(false)->after('auto_create_transaction');
            $table->decimal('gross_amount', 12, 2)->nullable()->after('is_salary');
            $table->json('deduction_rules')->nullable()->after('gross_amount');
            $table->index(['user_id', 'is_salary']);
        });
    }

    public function down(): void
    {
        Schema::table('recurring_incomes', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_salary']);
            $table->dropColumn(['is_salary', 'gross_amount', 'deduction_rules']);
        });
    }
};
