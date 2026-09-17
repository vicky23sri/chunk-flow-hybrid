<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\TenantHeaderMiddleware;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ChunkFlow API Routes (Laravel 11 + Stancl Tenancy v3)
|--------------------------------------------------------------------------
*/

// ─── Health & Public ───────────────────────────────────────────────────────
Route::get('/health', [StatusController::class, 'health']);
Route::prefix('v1')->group(function () {
    Route::get('/tenants', [StatusController::class, 'listTenants']);
    Route::get('/rls-status', [StatusController::class, 'rlsStatus']);

    // ─── Auth (Public) ─────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/register-tenant', [AuthController::class, 'registerTenant']);
        Route::post('/login', [AuthController::class, 'login']);
    });

    // ─── Super Admin ───────────────────────────────────────────────────────
    Route::prefix('superadmin')->group(function () {
        Route::post('/login', [SuperAdminController::class, 'login']);

        Route::middleware('auth:super_admin')->group(function () {
            Route::get('/dashboard', [SuperAdminController::class, 'dashboard']);
            Route::post('/provision-tenant', [SuperAdminController::class, 'provisionTenant']);
        });
    });

    // ─── Protected Tenant Routes ───────────────────────────────────────────
    // Requires: X-Tenant-Subdomain header + valid JWT (auth:api guard)
    Route::middleware([TenantHeaderMiddleware::class, 'auth:api'])->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Users
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);

        // Projects
        Route::get('/projects', [ProjectController::class, 'index']);
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

        // Documents
        Route::get('/documents', [DocumentController::class, 'index']);
        Route::post('/documents', [DocumentController::class, 'store']);
    });
});
