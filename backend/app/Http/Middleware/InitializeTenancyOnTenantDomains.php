<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Symfony\Component\HttpFoundation\Response;

/**
 * Conditionally initializes tenancy on tenant domains.
 *
 * Mirrors the same pattern used in Portiq:
 * On central domains (localhost, 127.0.0.1) it no-ops;
 * on tenant domains (willsparrow.localhost, acme.localhost) it delegates
 * to Stancl's InitializeTenancyByDomain.
 *
 * Stancl's initializer is idempotent — safe to layer with tenant route middleware.
 */
class InitializeTenancyOnTenantDomains
{
    public function __construct(private InitializeTenancyByDomain $tenantInit) {}

    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();
        $centralDomains = config('tenancy.central_domains', []);

        // If this is a central domain, skip tenancy initialization
        if (in_array($host, $centralDomains, true)) {
            return $next($request);
        }

        // Otherwise delegate to domain-based tenancy
        return $this->tenantInit->handle($request, $next);
    }
}
