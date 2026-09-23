<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuration_types', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('node_key')->unique();
            $table->string('name');
            $table->string('category');
            $table->string('sub_type');
            $table->foreignUuid('color_id')->nullable()->constrained('colors')->nullOnDelete();
            $table->jsonb('fields_schema')->default('[]');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuration_types');
    }
};
