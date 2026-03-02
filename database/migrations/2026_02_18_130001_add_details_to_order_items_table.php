<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('currency', 3)->nullable()->after('amount');
            $table->string('seller_name')->nullable()->after('external_item_id');
            $table->date('return_eligible_until')->nullable()->after('returned_at');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['currency', 'seller_name', 'return_eligible_until']);
        });
    }
};
