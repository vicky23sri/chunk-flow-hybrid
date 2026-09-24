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
            CREATE TABLE canvas_connections (
                id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                connector_id            UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
                source_canvas_node_id   UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
                target_canvas_node_id   UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
                source_handle           TEXT,
                target_handle           TEXT,
                created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

                CONSTRAINT canvas_connections_unique
                    UNIQUE (source_canvas_node_id, target_canvas_node_id, source_handle, target_handle),
                CONSTRAINT canvas_connections_no_self_loop
                    CHECK (source_canvas_node_id <> target_canvas_node_id)
            );
        ");

        DB::statement("CREATE INDEX idx_canvas_connections_connector_id ON canvas_connections(connector_id);");
        DB::statement("CREATE INDEX idx_canvas_connections_source ON canvas_connections(source_canvas_node_id);");
        DB::statement("CREATE INDEX idx_canvas_connections_target ON canvas_connections(target_canvas_node_id);");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS canvas_connections CASCADE');
    }
};
