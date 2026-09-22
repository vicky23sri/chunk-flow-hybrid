<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_queue', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('job_id')->unique();
            $table->string('subdomain');
            $table->string('config_id');
            $table->string('schedule_name');
            $table->string('database_name');
            $table->string('cron_exp');
            $table->string('status')->default('PENDING'); // PENDING, RUNNING, COMPLETED, FAILED
            $table->timestamp('enqueued_at')->useCurrent();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_queue');
    }
};
