<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('merchant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

            $table->string('provider')->nullable();
            $table->string('order_number')->nullable();
            $table->string('order_url')->nullable();

            $table->date('ordered_at');
            $table->date('delivered_at')->nullable();
            $table->string('status')->default('placed');

            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('CHF');

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'ordered_at']);
            $table->index(['user_id', 'merchant_id']);
            $table->index(['user_id', 'category_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
