<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cdn_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->nullableMorphs('attachable');

            $table->uuid('cdn_file_id');
            $table->uuid('cdn_project_id')->nullable();

            $table->string('name')->nullable();
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('size')->nullable();

            $table->string('url', 2048)->nullable();
            $table->string('thumbnail_url', 2048)->nullable();

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'cdn_file_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cdn_assets');
    }
};
