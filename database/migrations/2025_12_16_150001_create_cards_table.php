<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['debit', 'credit']);
            $table->string('card_holder_name');
            $table->string('last_four_digits', 4);
            $table->enum('card_network', ['visa', 'mastercard', 'amex', 'discover', 'other'])->default('visa');
            $table->unsignedTinyInteger('expiry_month');
            $table->unsignedSmallInteger('expiry_year');
            $table->decimal('credit_limit', 12, 2)->nullable();
            $table->decimal('current_balance', 12, 2)->default(0);
            $table->unsignedTinyInteger('payment_due_day')->nullable();
            $table->unsignedTinyInteger('billing_cycle_day')->nullable();
            $table->string('color', 7)->default('#1e293b');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};
