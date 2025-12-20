<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['income', 'expense', 'transfer', 'card_payment']);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('CHF');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('transaction_date');
            $table->foreignId('from_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->foreignId('from_card_id')->nullable()->constrained('cards')->nullOnDelete();
            $table->foreignId('to_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->foreignId('to_card_id')->nullable()->constrained('cards')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('merchant_id')->nullable()->constrained()->nullOnDelete();
            $table->nullableMorphs('transactionable');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'transaction_date']);
            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'category_id']);
            $table->index(['user_id', 'merchant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
