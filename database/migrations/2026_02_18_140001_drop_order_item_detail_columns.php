<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'currency',
            'seller_name',
            'return_eligible_until',
        ];

        foreach ($columns as $column) {
            if (! Schema::hasColumn('order_items', $column)) {
                continue;
            }

            Schema::table('order_items', function (Blueprint $table) use ($column) {
                $table->dropColumn($column);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('order_items', 'currency')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->string('currency', 3)->nullable();
            });
        }

        if (! Schema::hasColumn('order_items', 'seller_name')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->string('seller_name')->nullable();
            });
        }

        if (! Schema::hasColumn('order_items', 'return_eligible_until')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->date('return_eligible_until')->nullable();
            });
        }
    }
};
