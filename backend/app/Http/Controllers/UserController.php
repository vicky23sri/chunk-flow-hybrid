<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function index()
    {
        try {
            $tenantId = tenant('id') ?? 'unknown';
            Log::info("Fetching users list for tenant: {$tenantId}");

            $users = User::latest()->get()->map(fn ($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role,
                'created_at' => $u->created_at,
            ]);

            Log::info("Retrieved {$users->count()} users for tenant: {$tenantId}");

            return response()->json($users);
        } catch (\Exception $e) {
            Log::error("Failed to fetch tenant users: " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to retrieve users list.'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $tenantId = tenant('id') ?? 'unknown';
            Log::info("Creating new user for tenant '{$tenantId}'", ['email' => $request->email]);

            $request->validate([
                'name'     => 'required|string|max:255',
                'email'    => 'required|email|unique:users,email',
                'password' => 'required|min:6',
                'role'     => 'nullable|in:admin,member',
            ]);

            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => $request->role ?? 'member',
            ]);

            Log::info("Successfully created user ID {$user->id} ('{$user->email}') with role '{$user->role}' for tenant '{$tenantId}'");

            return response()->json([
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::warning("Validation error in User store: " . json_encode($ve->errors()));
            throw $ve;
        } catch (\Exception $e) {
            Log::error("Failed to create user for tenant '{$tenantId}': " . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to create user.'], 500);
        }
    }
}
