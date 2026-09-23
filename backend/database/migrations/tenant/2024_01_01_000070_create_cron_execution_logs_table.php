<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cron_execution_logs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('subdomain');
            $table->string('cron_schedule');
            $table->string('database_name');
            $table->text('message');
            $table->string('status')->default('SUCCESS');
            $table->bigInteger('duration_ms')->default(0);
            $table->timestamp('executed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cron_execution_logs');
    }
};
