# ChunkFlow Multi-Tenant SaaS Platform

Full-stack multi-tenant SaaS platform built with **Go (Gin + GORM + Database-per-Tenant)** backend and **React (Vite + Subdomain Routing)** frontend.

---

## Technical Stack & Multi-Tenancy Strategy

- **Backend**: Go 1.22 with Gin Web Framework & GORM
- **Frontend**: React.js with Vite (`http://localhost:5173`)
- **Multi-Tenancy Strategy**: **Database-per-Tenant (Isolated Physical Databases)**
  - **Central Database**: `chunkflow_central` (Stores global `tenants` registry and `db_name` mappings)
  - **Dedicated Tenant Databases**: `chunkflow_tenant_acme`, `chunkflow_tenant_wayne`, `chunkflow_tenant_globex`, etc.
  - **Tenant Connection Pool**: Dynamic GORM connection manager in Go backend
  - **Object Storage Structure**: `s3://app-name-raw/tenant/{tenant_id}/data/`

---

## Setup & Running Everything

### Step 1: Start Go Backend Server
```bash
cd backend
go run cmd/main.go
```
*The server automatically creates `chunkflow_central`, seeds default tenant database `chunkflow_tenant_acme`, and listens on `http://localhost:8080`.*

### Step 2: Start React Frontend Application
```bash
cd frontend
npm run dev
```
*The frontend application starts on `http://localhost:5173`.*

---

## 🔑 Tenant Database Verification in PostgreSQL / TablePlus

Connect in **TablePlus** or **psql** to inspect the separate physical databases:

- **Central Database**: `chunkflow_central` (Lists registered tenants and their dedicated `db_name`)
- **Acme Database**: `chunkflow_tenant_acme` (Contains Acme users & projects)
- **Wayne Database**: `chunkflow_tenant_wayne` (Contains Wayne users & projects)

```bash
# Query Central DB
PGPASSWORD=xxxxx psql -h localhost -U xxxxx -d chunkflow_central -c "SELECT name, subdomain, db_name FROM tenants;"

# Query Dedicated Acme Tenant DB
PGPASSWORD=xxxxx psql -h localhost -U xxxxx -d chunkflow_tenant_acme -c "SELECT email, role FROM users;"

# Query Dedicated Wayne Tenant DB
PGPASSWORD=xxxxx psql -h localhost -U xxxxx -d chunkflow_tenant_wayne -c "SELECT email, role FROM users;"
```
# chunk-flow-hybrid
