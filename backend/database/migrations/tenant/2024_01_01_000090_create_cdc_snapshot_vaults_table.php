<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cdc_snapshot_vaults', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('manifest_id')->unique();
            $table->string('tenant_subdomain');
            $table->string('username')->nullable();
            $table->string('connector_id')->nullable();
            $table->string('connector_name');
            $table->string('s3_bucket');
            $table->text('s3_manifest_path');
            $table->text('s3_chunks_prefix');
            $table->bigInteger('total_bytes')->default(0);
            $table->bigInteger('dedup_bytes')->default(0);
            $table->integer('total_chunks')->default(0);
            $table->integer('unique_chunks')->default(0);
            $table->decimal('dedup_ratio', 8, 2)->default(0.00);
            $table->bigInteger('duration_ms')->default(0);
            $table->string('status')->default('COMPLETED');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cdc_snapshot_vaults');
    }
};
