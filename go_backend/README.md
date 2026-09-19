# ChunkFlow Go Backend Engine

High-performance Go backend service built with the **Gin Web Framework**, **GORM**, and **Database-per-Tenant Multi-Tenancy**.

---

## 🚀 Stack & Features

- **Language**: Go 1.22+
- **Framework**: [Gin Web Framework](https://github.com/gin-gonic/gin)
- **CORS Support**: Configured for multi-tenant domain and subdomain requests (`http://localhost:5173`)
- **Environment Management**: [godotenv](https://github.com/joho/godotenv)
- **Multi-Tenancy**: Physical database isolation strategy per tenant (`chunkflow_tenant_<subdomain>`)

---

## 📁 Project Structure

```text
go_backend/
├── cmd/
│   └── main.go          # Application entry point & Gin server setup
├── .env                 # Local environment configuration (ignored by git)
├── .env.example         # Template for environment variables
├── .gitignore           # Git ignore rules for Go binaries and environment files
├── go.mod               # Go module definition
└── go.sum               # Go module checksums
```

---

## 🛠️ Prerequisites

- **Go SDK**: Version 1.22 or higher (`go version`)
- **PostgreSQL**: Version 14+ running locally or in Docker

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and set your database credentials:

```bash
cp .env.example .env
```

Default `.env` variables:

```ini
PORT=8080
GIN_MODE=debug
APP_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=chunkflow_central
DB_SSLMODE=disable

# AWS / S3 Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=chunkflow-raw
```

---

## 🏃 Running the Server

### Option A: Command Line

1. Install dependencies:
   ```bash
   go mod download
   ```

2. Run main application:
   ```bash
   go run cmd/main.go
   ```

The server will start on `http://localhost:8080`.

---

### Option B: JetBrains GoLand IDE

1. Open **GoLand** and select `go_backend` directory.
2. Go to **Settings** (`Ctrl+Alt+S`) ➔ **Go** ➔ **GOROOT** and ensure Go SDK 1.22+ is selected.
3. Enable Go Modules in **Settings** ➔ **Go** ➔ **Go Modules**.
4. Create a **Go Build** configuration:
   - **Directory**: `go_backend/cmd`
   - **Working directory**: `go_backend`
5. Press **`Shift + F10`** to run.

---

## 📡 Base API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status check |
| `GET` | `/api/v1/rls-status` | Database isolation audit & connection telemetry |
| `GET` | `/api/v1/projects` | Fetch projects list for active tenant |
