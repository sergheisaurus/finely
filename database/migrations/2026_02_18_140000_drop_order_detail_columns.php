<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'invoice_url',
            'payment_method_label',
            'shipping_address',
            'source_amount',
            'fx_base_currency',
            'fx_quote_currency',
            'summary_lines',
        ];

        foreach ($columns as $column) {
            if (! Schema::hasColumn('orders', $column)) {
                continue;
            }

            Schema::table('orders', function (Blueprint $table) use ($column) {
                $table->dropColumn($column);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('orders', 'invoice_url')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('invoice_url')->nullable();
            });
        }

        if (! Schema::hasColumn('orders', 'payment_method_label')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('payment_method_label')->nullable();
            });
        }

        if (! Schema::hasColumn('orders', 'shipping_address')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->json('shipping_address')->nullable();
            });
        }

        if (! Schema::hasColumn('orders', 'source_amount')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->decimal('source_amount', 12, 2)->nullable();
            });
        }

        if (! Schema::hasColumn('orders', 'fx_base_currency')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('fx_base_currency', 3)->nullable();
            });
        }

        if (! Schema::hasColumn('orders', 'fx_quote_currency')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('fx_quote_currency', 3)->nullable();
            });
        }

        if (! Schema::hasColumn('orders', 'summary_lines')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->json('summary_lines')->nullable();
            });
        }
    }
};
