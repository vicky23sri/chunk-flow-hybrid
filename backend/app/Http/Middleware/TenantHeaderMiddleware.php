<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;

/**
 * Resolves tenant from X-Tenant-Subdomain or X-Tenant-ID header
 * and initialises tenancy before passing to route handler.
 *
 * If tenancy was already initialized (e.g. by InitializeTenancyByDomain
 * from a domain-based request), this middleware becomes a no-op.
 */
class TenantHeaderMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // If domain-based middleware already initialized tenancy, skip
        if (tenancy()->initialized) {
            return $next($request);
        }

        $subdomain = $request->header('X-Tenant-Subdomain')
            ?? $request->header('X-Tenant-ID')
            ?? $request->header('X-Tenant')
            ?? $request->input('subdomain');

        if (!$subdomain) {
            return response()->json(['error' => 'Tenant identification required (X-Tenant-Subdomain header)'], 400);
        }

        $tenant = Tenant::find($subdomain);
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        tenancy()->initialize($tenant);

        $response = $next($request);

        tenancy()->end();

        return $response;
    }
}
