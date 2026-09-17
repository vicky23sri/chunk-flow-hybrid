# ChunkFlow Backend - Multi-Tenant Architecture (Laravel + Stancl Tenancy)

High-performance multi-tenant backend architecture using **PHP / Laravel** with **`stancl/tenancy`** package implementing a **Database-per-Tenant** (Isolated Databases) strategy.

---

## 🏛️ Architecture Overview

- **Framework**: PHP 8.2+ / Laravel 11
- **Multi-Tenancy Package**: [`stancl/tenancy`](https://tenancyforlaravel.com/) (v3)
- **Multi-Tenancy Strategy**: **Database-per-Tenant (Isolated Databases)**
  - **Central Database**: `chunkflow_central` (stores tenant definitions and domain mappings)
  - **Tenant Databases**: Dynamically created per tenant (`chunkflow_tenant_acme`, `chunkflow_tenant_wayne`, etc.)
- **Tenant Identification**: Domain / Subdomain based (via Stancl `InitializeTenancyByDomain` middleware)

---

## 💾 Central DB vs Tenant DBs

### 1. Central Database (`chunkflow_central`)
Contains global multi-tenant metadata:
- **`tenants` table**: (`id`, `name`, `data` [JSON], `created_at`, `updated_at`)
- **`domains` table**: (`id`, `domain`, `tenant_id`, `created_at`, `updated_at`)

### 2. Tenant Databases (`chunkflow_tenant_<id>`)
Each tenant gets its own physically separate PostgreSQL / MySQL database containing tenant-specific data:
- `users`: (`id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`)
- `projects`: (`id`, `name`, `description`, `status`, `created_at`, `updated_at`)
- `documents`: (`id`, `name`, `s3_key`, `size_bytes`, `created_at`, `updated_at`)

---

## ⚙️ How Tenant Creation & Resolution Work in Stancl Tenancy

### 1. New Tenant Registration & Database Provisioning
When a new tenant registers (e.g. Acme Corp), the central application executes:

```php
use App\Models\Tenant;

// 1. Create Tenant (Stancl automatically triggers database creation & migrations)
$tenant = Tenant::create([
    'id' => 'acme',
    'name' => 'Acme Corporation',
]);

// 2. Link Domain / Subdomain to Tenant
$tenant->domains()->create([
    'domain' => 'acme.localhost', // or acme.chunkflow.com
]);
```

**What Stancl Tenancy Handles Automatically:**
1. **`CreatingDatabase` Event**: Executes SQL `CREATE DATABASE chunkflow_tenant_acme`.
2. **`MigratingDatabase` Event**: Runs all migrations from `database/migrations/tenant/` on the new database.
3. **`SeedingDatabase` Event**: Runs tenant seeders (e.g., creating default admin user, default project settings).

### 2. Domain Resolution & Request Lifetime
When a request comes in to `acme.localhost` or `acme.chunkflow.com`:

```
Client Request (Host: acme.chunkflow.com)
       │
       ▼
InitializeTenancyByDomain Middleware (Stancl)
       │
       ├── 1. Looks up 'acme.chunkflow.com' in central `domains` table
       ├── 2. Resolves linked Tenant ('acme')
       ├── 3. Dynamically changes DB connection to 'chunkflow_tenant_acme'
       └── 4. Rebinds storage paths to 'storage/tenant_acme/'
       │
       ▼
Controller Handler Execution (Queries scoped automatically to Tenant DB)
```

---

## 🛠️ Stancl Tenancy Key Features & Advantages

| Feature | Description |
| :--- | :--- |
| **Automatic DB Provisioning** | Creates and migrates tenant DBs in real-time via event hooks (`TenantCreated`). |
| **Zero Code Changes for Models** | Tenant models use standard Eloquent syntax without needing custom `WHERE tenant_id = ?` filters. |
| **Tenant Isolation** | Physical DB separation ensures data security and easy tenant backups/restoration. |
| **CLI Management** | Run artisan commands across all tenants: `php artisan tenants:run migrate`. |

---

## 🚀 Recommended Laravel + Stancl Setup Commands

```bash
# 1. Install Stancl Tenancy Package
composer require stancl/tenancy

# 2. Run Stancl Installation Command
php artisan tenancy:install

# 3. Run Central Migrations
php artisan migrate

# 4. Run Migrations on All Tenant Databases
php artisan tenants:run migrate
```

