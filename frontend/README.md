# ChunkFlow Frontend - Multi-Tenant Dashboard

Modern **React.js + Vite** single page application with subdomain-aware routing and JWT authentication.

## Features

- **Subdomain-Aware API Client**: Dynamically extracts tenant subdomain from hostname (`acme.app.local`) or fallback header (`X-Tenant-Subdomain`).
- **Interactive Tenant Switcher**: Switch active subdomains live in dev mode.
- **Projects CRUD**: Manage tenant-isolated projects.
- **S3 Data Browser**: Inspect raw object metadata structured under `s3://app-name-raw/tenant/{tenant_id}/data/`.
- **Database RLS Audit Widget**: Live visual indicator of PostgreSQL Row-Level Security isolation.

---

## Setup & Running Locally

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   *Frontend starts on `http://localhost:5173`.*

---

## Local Subdomain Testing

To test custom subdomains locally on Linux/macOS:
Add custom hosts to `/etc/hosts`:
```text
127.0.0.1 acme.localhost
127.0.0.1 globex.localhost
```
Then navigate to `http://acme.localhost:5173` or `http://globex.localhost:5173` in your browser!
Alternatively, use the built-in **Tenant Switcher** dropdown in the header bar.
