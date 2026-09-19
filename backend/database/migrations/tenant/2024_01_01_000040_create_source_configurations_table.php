<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('source_configurations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name')->default('PostgreSQL Data Source');
            $table->string('host');
            $table->string('port')->default('5432');
            $table->string('database_name');
            $table->string('username');
            $table->text('password'); // Encrypted string using Crypt::encryptString()
            $table->boolean('use_ssl')->default(false);
            $table->string('backup_schedule')->nullable();
            $table->integer('retention_days')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamp('last_tested_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('source_configurations');
    }
};
