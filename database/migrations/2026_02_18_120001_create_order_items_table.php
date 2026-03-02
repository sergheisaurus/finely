<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->nullable();
            $table->decimal('amount', 12, 2)->nullable();

            $table->string('product_url')->nullable();
            $table->string('external_item_id')->nullable();

            $table->date('ordered_at')->nullable();
            $table->date('delivered_at')->nullable();
            $table->date('returned_at')->nullable();
            $table->string('status')->default('ordered');
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['order_id', 'sort_order']);
            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
