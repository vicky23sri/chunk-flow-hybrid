<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;

class StatusController extends Controller
{
    public function health()
    {
        try {
            Log::info("Health check ping requested");
            return response()->json([
                'status'   => 'UP',
                'service'  => 'ChunkFlow Multi-Tenant SaaS API',
                'database' => 'chunkflow_central',
                'engine'   => 'Laravel 11 + Stancl Tenancy v3',
            ]);
        } catch (\Exception $e) {
            Log::error("Health check failed: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['status' => 'DOWN', 'error' => $e->getMessage()], 500);
        }
    }

    public function listTenants()
    {
        try {
            Log::info("Requesting list of all provisioned tenants");

            $tenants = Tenant::with('domains')->get()->map(fn ($t) => [
                'id'        => $t->id,
                'name'      => $t->name,
                'subdomain' => $t->id,
                'db_name'   => 'chunkflow_tenant_' . $t->id,
                'domains'   => $t->domains->pluck('domain'),
                'created_at' => $t->created_at,
            ]);

            Log::info("Retrieved {$tenants->count()} tenants");

            return response()->json($tenants);
        } catch (\Exception $e) {
            Log::error("Failed to list tenants: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to retrieve tenants list.'], 500);
        }
    }

    public function rlsStatus()
    {
        try {
            Log::info("Requesting RLS / isolation status overview");

            return response()->json([
                'database'          => 'chunkflow_central',
                'schema'            => 'public',
                'current_tenant_id' => tenant('id') ?? null,
                'rls_enforced'      => false,
                'isolation_mode'    => 'Database-per-Tenant (Stancl Tenancy)',
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to retrieve RLS status: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to check RLS status.'], 500);
        }
    }
}
