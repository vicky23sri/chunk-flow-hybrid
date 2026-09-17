<?php

namespace App\Http\Controllers;

use App\Models\SuperAdmin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Database\Models\Domain;
use App\Models\Tenant;
use App\Models\User;

class SuperAdminController extends Controller
{
    /**
     * POST /api/v1/superadmin/login
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email'    => 'required|email',
                'password' => 'required',
            ]);

            Log::info("SuperAdmin login attempt for email '{$request->email}'");

            $token = Auth::guard('super_admin')->attempt([
                'email'    => $request->email,
                'password' => $request->password,
            ]);

            if (!$token) {
                Log::warning("SuperAdmin login failed for '{$request->email}': Invalid credentials");
                return response()->json(['error' => 'Invalid super admin credentials'], 401);
            }

            $admin = Auth::guard('super_admin')->user();
            Log::info("SuperAdmin '{$admin->email}' successfully logged in.");

            return response()->json([
                'token'       => $token,
                'super_admin' => [
                    'id'    => $admin->id,
                    'name'  => $admin->name,
                    'email' => $admin->email,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::warning("Validation error in SuperAdmin login: " . json_encode($ve->errors()));
            throw $ve;
        } catch (\Exception $e) {
            Log::error("Unhandled exception in SuperAdmin login: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Super admin authentication error.'], 500);
        }
    }

    /**
     * GET /api/v1/superadmin/dashboard
     */
    public function dashboard()
    {
        try {
            Log::info("SuperAdmin requesting system dashboard statistics");

            $tenants = Tenant::with('domains')->get();
            $domains = Domain::all();

            $tenantDetails = $tenants->map(function ($tenant) {
                $userCount    = 0;
                $projectCount = 0;

                try {
                    tenancy()->initialize($tenant);
                    $userCount    = \App\Models\User::count();
                    $projectCount = \App\Models\Project::count();
                    tenancy()->end();
                } catch (\Exception $e) {
                    if (tenancy()->initialized) {
                        tenancy()->end();
                    }
                    Log::error("Failed to fetch tenant metrics for tenant '{$tenant->id}': " . $e->getMessage());
                }

                return [
                    'tenant' => [
                        'id'         => $tenant->id,
                        'name'       => $tenant->name,
                        'subdomain'  => $tenant->subdomain ?? $tenant->id,
                        'db_name'    => $tenant->db_name ?? ('chunkflow_tenant_' . ($tenant->subdomain ?? $tenant->id)),
                        'created_at' => $tenant->created_at,
                    ],
                    'domains'       => $tenant->domains->pluck('domain')->toArray(),
                    'user_count'    => $userCount,
                    'project_count' => $projectCount,
                ];
            });

            Log::info("SuperAdmin dashboard retrieved successfully. Total tenants: {$tenants->count()}");

            return response()->json([
                'system_status' => [
                    'central_db_name'    => 'chunkflow_central',
                    'engine'             => 'Laravel 11 + Stancl Tenancy v3',
                    'isolation_mode'     => 'Database-per-Tenant',
                    'total_tenants'      => $tenants->count(),
                    'total_databases'    => $tenants->count(),
                    'total_domains'      => $domains->count(),
                    'total_system_users' => SuperAdmin::count(),
                ],
                'tenants' => $tenantDetails,
                'domains' => $domains->map(fn ($d) => [
                    'id'        => $d->id,
                    'domain'    => $d->domain,
                    'tenant_id' => $d->tenant_id,
                ]),
            ]);
        } catch (\Exception $e) {
            Log::error("Unhandled exception in SuperAdmin dashboard: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to retrieve super admin dashboard statistics.'], 500);
        }
    }

    /**
     * POST /api/v1/superadmin/provision-tenant
     * Same as registerTenant but from super admin context.
     */
    public function provisionTenant(Request $request)
    {
        try {
            $request->validate([
                'tenant_name'    => 'required|string|max:255',
                'subdomain'      => 'required|string|alpha_dash|max:100',
                'admin_email'    => 'required|email',
                'admin_password' => 'required|min:6',
            ]);

            $subdomain = strtolower($request->subdomain);
            Log::info("SuperAdmin provisioning tenant with subdomain: '{$subdomain}'");

            $existing = Tenant::where('subdomain', $subdomain)
                ->orWhere(function ($query) use ($subdomain) {
                    if (\Illuminate\Support\Str::isUuid($subdomain)) {
                        $query->where('id', $subdomain);
                    }
                })->exists();

            if ($existing) {
                Log::warning("Tenant provisioning failed: Subdomain '{$subdomain}' already exists");
                return response()->json(['error' => 'Tenant subdomain already exists'], 409);
            }

            $tenant = Tenant::create([
                'id'        => $subdomain,
                'name'      => $request->tenant_name,
                'subdomain' => $subdomain,
            ]);

            $domain = $subdomain . '.localhost';
            $tenant->domains()->create(['domain' => $domain]);

            tenancy()->initialize($tenant);

            $user = User::create([
                'name'     => $request->tenant_name . ' Admin',
                'email'    => $request->admin_email,
                'password' => Hash::make($request->admin_password),
                'role'     => 'admin',
            ]);

            tenancy()->end();

            Log::info("SuperAdmin successfully provisioned tenant '{$subdomain}' and admin user '{$user->email}'");

            return response()->json([
                'message' => 'Tenant provisioned successfully',
                'tenant'  => [
                    'id'        => $tenant->id,
                    'name'      => $tenant->name,
                    'subdomain' => $subdomain,
                    'db_name'   => 'chunkflow_tenant_' . $subdomain,
                    'domain'    => $domain,
                ],
                'user' => [
                    'id'    => $user->id,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::warning("Validation error in SuperAdmin tenant provisioning: " . json_encode($ve->errors()));
            throw $ve;
        } catch (\Exception $e) {
            if (tenancy()->initialized) {
                tenancy()->end();
            }
            Log::error("SuperAdmin tenant provisioning failed for '{$request->subdomain}': " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'An error occurred during tenant provisioning.'], 500);
        }
    }
}
