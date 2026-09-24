<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("
            CREATE TABLE nodes (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                node_key        TEXT NOT NULL UNIQUE,
                name            TEXT NOT NULL,
                category        TEXT NOT NULL,
                sub_type        TEXT NOT NULL,
                color           JSONB NOT NULL DEFAULT '{}',
                fields_schema   JSONB NOT NULL,
                is_active       BOOLEAN NOT NULL DEFAULT true,
                sort_order      INT NOT NULL DEFAULT 0,
                created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        ");

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS nodes CASCADE');
    }
};
