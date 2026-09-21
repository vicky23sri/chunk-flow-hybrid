package db

import (
	"database/sql"
	"fmt"

	"chunkflow-backend/internal/config"

	_ "github.com/lib/pq"
)

// OpenTenantDB opens a PostgreSQL connection to the given tenant's dedicated database.
// Database name is derived as: chunkflow_tenant_{subdomain}
// Connection parameters are read from centralized configuration.
func OpenTenantDB(subdomain string) (*sql.DB, string, error) {
	tenantDB := fmt.Sprintf("chunkflow_tenant_%s", subdomain)
	cfg := config.LoadConfig()

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s connect_timeout=5",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, tenantDB, cfg.DBSSLMode,
	)

	conn, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, tenantDB, fmt.Errorf("failed to open tenant DB '%s': %w", tenantDB, err)
	}

	return conn, tenantDB, nil
}

// NullableString converts an empty string to nil so it is stored as SQL NULL.
func NullableString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
