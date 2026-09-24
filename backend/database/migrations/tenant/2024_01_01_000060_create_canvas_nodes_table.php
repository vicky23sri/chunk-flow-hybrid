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
            CREATE TABLE canvas_nodes (
                id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                connector_id        UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
                node_id             UUID NOT NULL REFERENCES nodes(id),
                element_id          TEXT NOT NULL,
                label               TEXT NOT NULL,
                position_x          NUMERIC NOT NULL DEFAULT 0,
                position_y          NUMERIC NOT NULL DEFAULT 0,
                encrypted_config    TEXT,
                is_verified         BOOLEAN NOT NULL DEFAULT false,
                created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

                CONSTRAINT canvas_nodes_connector_element_unique UNIQUE (connector_id, element_id)
            );
        ");

        DB::statement("CREATE INDEX idx_canvas_nodes_connector_id ON canvas_nodes(connector_id);");
        DB::statement("CREATE INDEX idx_canvas_nodes_node_id ON canvas_nodes(node_id);");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS canvas_nodes CASCADE');
    }
};
