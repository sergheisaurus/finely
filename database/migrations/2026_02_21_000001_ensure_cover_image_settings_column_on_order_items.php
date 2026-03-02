<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('order_items', 'cover_image_settings')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->json('cover_image_settings')->nullable()->after('cover_image_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('order_items', 'cover_image_settings')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropColumn('cover_image_settings');
            });
        }
    }
};
