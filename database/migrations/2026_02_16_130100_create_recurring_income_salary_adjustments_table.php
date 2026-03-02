<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_income_salary_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recurring_income_id')->constrained('recurring_incomes')->cascadeOnDelete();
            $table->date('effective_date');
            $table->decimal('gross_amount', 12, 2);
            $table->decimal('net_amount', 12, 2);
            $table->json('deduction_rules')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['recurring_income_id', 'effective_date']);
            $table->index(['user_id', 'effective_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_income_salary_adjustments');
    }
};
