<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configurations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('connector_id')->nullable()->constrained('connectors')->cascadeOnDelete();
            $table->foreignUuid('source_type_id')->nullable()->constrained('configuration_types')->nullOnDelete();
            $table->foreignUuid('destination_type_id')->nullable()->constrained('configuration_types')->nullOnDelete();
            $table->string('name')->default('Pipeline Connection');
            $table->text('source_encrypted_data')->nullable();
            $table->text('destination_encrypted_data')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configurations');
    }
};
