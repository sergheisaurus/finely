<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->uuid('cdn_folder_id')->nullable()->after('sort_order');
            $table->index('cdn_folder_id');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['cdn_folder_id']);
            $table->dropColumn('cdn_folder_id');
        });
    }
};
