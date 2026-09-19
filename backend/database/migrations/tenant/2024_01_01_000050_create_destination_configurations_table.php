<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('destination_configurations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name')->default('Amazon S3 Vault');
            $table->string('bucket_name');
            $table->string('region');
            $table->string('access_key_id');
            $table->text('secret_access_key'); // Encrypted string using Crypt::encryptString()
            $table->string('folder_path')->nullable();
            $table->string('encryption')->default('AES-256 Server-Side Encryption');
            $table->string('storage_class')->default('Standard');
            $table->boolean('is_verified')->default(false);
            $table->timestamp('last_tested_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('destination_configurations');
    }
};
