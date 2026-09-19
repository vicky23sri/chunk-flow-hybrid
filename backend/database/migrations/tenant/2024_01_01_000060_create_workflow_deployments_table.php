<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_deployments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name')->default('Pipeline Workflow');
            $table->string('status')->default('deployed');
            $table->foreignUuid('source_config_id')->nullable()->constrained('source_configurations')->nullOnDelete();
            $table->foreignUuid('destination_config_id')->nullable()->constrained('destination_configurations')->nullOnDelete();
            $table->jsonb('nodes_data')->default('[]');
            $table->jsonb('connections_data')->default('[]');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_deployments');
    }
};
