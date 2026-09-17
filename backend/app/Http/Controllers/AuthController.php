<?php

namespace App\Http\Controllers;

use App\Models\SuperAdmin;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Models\Tenant;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/register-tenant
     * Creates a new tenant, provisions its database, and seeds an admin user.
     */
    public function registerTenant(Request $request)
    {
        $request->validate([
            'tenant_name'    => 'required|string|max:255',
            'subdomain'      => 'required|string|alpha_dash|max:100',
            'admin_email'    => 'required|email',
            'admin_password' => 'required|min:6',
        ]);

        $subdomain = strtolower($request->subdomain);

        Log::info("Attempting to register new tenant with subdomain: {$subdomain}");

        // Check if tenant id or subdomain already exists
        $existing = Tenant::where('subdomain', $subdomain)
            ->orWhere(function ($query) use ($subdomain) {
                if (\Illuminate\Support\Str::isUuid($subdomain)) {
                    $query->where('id', $subdomain);
                }
            })->exists();

        if ($existing) {
            Log::warning("Tenant registration failed: Subdomain '{$subdomain}' already exists.");
            return response()->json(['error' => 'Tenant subdomain already exists'], 409);
        }

        try {
            // 1. Create tenant — Stancl automatically creates + migrates the DB
        $tenant = Tenant::create([
            'id'        => $subdomain,
            'name'      => $request->tenant_name,
            'subdomain' => $subdomain,
        ]);

        // 2. Attach domain
        $domain = $subdomain . '.localhost';
        $tenant->domains()->create(['domain' => $domain]);

        // 3. Seed admin user into the tenant's database
        tenancy()->initialize($tenant);

        $user = User::create([
            'name'     => $request->tenant_name . ' Admin',
            'email'    => $request->admin_email,
            'password' => Hash::make($request->admin_password),
            'role'     => 'admin',
        ]);

        $token = Auth::guard('api')->login($user);

        tenancy()->end();

        Log::info("Tenant '{$subdomain}' successfully registered and admin seeded.");

        return response()->json([
            'message' => 'Tenant registered successfully',
            'tenant'  => [
                'id'        => $tenant->id,
                'name'      => $tenant->name,
                'subdomain' => $subdomain,
                'db_name'   => 'chunkflow_tenant_' . $subdomain,
                'domain'    => $domain,
            ],
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ], 201);
        } catch (\Exception $e) {
            Log::error("Tenant registration failed for '{$subdomain}': " . $e->getMessage());
            
            // Clean up tenancy context if it was initialized
            if (tenancy()->initialized) {
                tenancy()->end();
            }

            return response()->json([
                'error' => 'An error occurred during tenant registration. Please try again later.'
            ], 500);
        }
    }

    /**
     * POST /api/v1/auth/login (tenant routes — domain-based)
     * Tenant is already resolved by InitializeTenancyByDomain middleware.
     * Just authenticate the user against the current tenant's DB.
     */
    public function tenantLogin(Request $request)
    {
        try {
            $request->validate([
                'email'    => 'required|email',
                'password' => 'required',
            ]);

            $tenant = tenant(); // Already initialized by domain middleware

            if (!$tenant) {
                Log::warning("Tenant login failed: Tenant context not initialized.");
                return response()->json(['error' => 'Tenant context not found'], 400);
            }

            Log::info("Domain-based login attempt for '{$request->email}' on tenant '{$tenant->id}'");

            $token = Auth::guard('api')->attempt([
                'email'    => $request->email,
                'password' => $request->password,
            ]);

            if (!$token) {
                Log::warning("Domain-based login failed for '{$request->email}' on tenant '{$tenant->id}': Invalid credentials");
                return response()->json(['error' => 'Invalid credentials'], 401);
            }

            $user = Auth::guard('api')->user();

            Log::info("Domain-based login success for '{$user->email}' on tenant '{$tenant->id}'");

            return response()->json([
                'token' => $token,
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
                'tenant' => [
                    'id'        => $tenant->id,
                    'name'      => $tenant->name,
                    'subdomain' => $tenant->id,
                    'db_name'   => 'chunkflow_tenant_' . $tenant->id,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::warning("Validation error in tenantLogin: " . json_encode($ve->errors()));
            throw $ve;
        } catch (\Exception $e) {
            Log::error("Unhandled exception in tenantLogin: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'An internal authentication error occurred.'], 500);
        }
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email'    => 'required|email',
                'password' => 'required',
            ]);

            $subdomain = tenant('id')
                ?? $request->header('X-Tenant-Subdomain')
                ?? $request->header('X-Tenant-ID')
                ?? $request->header('X-Tenant')
                ?? $request->input('subdomain');

            if (!$subdomain) {
                Log::warning("Login attempt failed: No tenant subdomain provided in headers or body.");
                return response()->json(['error' => 'Tenant subdomain required'], 400);
            }

            Log::info("Login attempt for email '{$request->email}' on tenant '{$subdomain}'");

            $tenant = Tenant::where('subdomain', $subdomain)
                ->orWhere(function ($query) use ($subdomain) {
                    if (\Illuminate\Support\Str::isUuid($subdomain)) {
                        $query->where('id', $subdomain);
                    }
                })
                ->first();

            if (!$tenant) {
                Log::warning("Login attempt failed: Tenant '{$subdomain}' not found in central DB.");
                return response()->json(['error' => 'Tenant not found'], 404);
            }

            tenancy()->initialize($tenant);

            $token = Auth::guard('api')->attempt([
                'email'    => $request->email,
                'password' => $request->password,
            ]);

            if (!$token) {
                tenancy()->end();
                Log::warning("Login attempt failed for email '{$request->email}' on tenant '{$subdomain}': Invalid credentials.");
                return response()->json(['error' => 'Invalid credentials'], 401);
            }

            $user = Auth::guard('api')->user();
            tenancy()->end();

            Log::info("User '{$user->email}' successfully logged into tenant '{$subdomain}'.");

            return response()->json([
                'token' => $token,
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
                'tenant' => [
                    'id'        => $tenant->id,
                    'name'      => $tenant->name,
                    'subdomain' => $subdomain,
                    'db_name'   => 'chunkflow_tenant_' . $subdomain,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::warning("Validation error in login: " . json_encode($ve->errors()));
            throw $ve;
        } catch (\Exception $e) {
            if (tenancy()->initialized) {
                tenancy()->end();
            }
            Log::error("Unhandled exception during login: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'An internal error occurred during login.'], 500);
        }
    }

    /**
     * GET /api/v1/auth/me
     * Returns the authenticated user and (if tenancy is active) their tenant context.
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            Log::info("Executing /me endpoint for user ID {$user->id} ({$user->email})");

            $response = [
                'user' => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
            ];

            // Include tenant info when tenancy is initialized (both domain-based and header-based)
            if (tenancy()->initialized) {
                $tenant = tenant();
                $response['tenant'] = [
                    'id'        => $tenant->id,
                    'name'      => $tenant->name,
                    'subdomain' => $tenant->id,
                    'db_name'   => 'chunkflow_tenant_' . $tenant->id,
                ];
                Log::info("Active tenant context for /me endpoint: {$tenant->id}");
            }

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error("Error in /me endpoint: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to retrieve current user details.'], 500);
        }
    }
}
