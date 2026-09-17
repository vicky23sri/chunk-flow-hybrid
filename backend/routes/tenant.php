<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes — Domain-Based Tenancy (mirrors Portiq setup)
|--------------------------------------------------------------------------
|
| These routes are only accessible from tenant domains (e.g. willsparrow.localhost).
| InitializeTenancyByDomain resolves the tenant from the request host and
| switches the DB connection to the tenant's dedicated database.
|
*/

Route::middleware([
    'api',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->prefix('api/v1')->group(function () {

    // ─── Tenant Auth (Public — no JWT required) ────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'tenantLogin']);
    });

    // ─── Tenant Status ──────────────────────────────────────────────────────
    Route::get('/rls-status', [StatusController::class, 'rlsStatus']);

    // ─── Protected Tenant Routes (JWT required) ─────────────────────────────
    Route::middleware('auth:api')->group(function () {
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
