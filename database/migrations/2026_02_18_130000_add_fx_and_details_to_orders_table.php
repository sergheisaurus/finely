<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_site')->nullable()->after('provider');
            $table->string('invoice_url')->nullable()->after('order_url');
            $table->string('payment_method_label')->nullable()->after('invoice_url');

            $table->json('shipping_address')->nullable()->after('payment_method_label');

            // FX and original currency context
            $table->decimal('source_amount', 12, 2)->nullable()->after('amount');
            $table->string('source_currency', 3)->nullable()->after('source_amount');
            $table->string('fx_base_currency', 3)->nullable()->after('source_currency');
            $table->string('fx_quote_currency', 3)->nullable()->after('fx_base_currency');
            $table->decimal('fx_rate', 18, 8)->nullable()->after('fx_quote_currency');
            $table->decimal('fx_fee_amount', 12, 2)->nullable()->after('fx_rate');

            // Provider-specific breakdown lines (e.g. Amazon order summary)
            $table->json('summary_lines')->nullable()->after('fx_fee_amount');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'order_site',
                'invoice_url',
                'payment_method_label',
                'shipping_address',
                'source_amount',
                'source_currency',
                'fx_base_currency',
                'fx_quote_currency',
                'fx_rate',
                'fx_fee_amount',
                'summary_lines',
            ]);
        });
    }
};
