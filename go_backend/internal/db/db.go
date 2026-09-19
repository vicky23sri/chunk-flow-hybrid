package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

// OpenTenantDB opens a PostgreSQL connection to the given tenant's dedicated database.
// Database name is derived as: chunkflow_tenant_{subdomain}
// Connection parameters are read strictly from environment variables.
func OpenTenantDB(subdomain string) (*sql.DB, string, error) {
	tenantDB := fmt.Sprintf("chunkflow_tenant_%s", subdomain)

	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "127.0.0.1"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("DB_USERNAME")
	if user == "" {
		user = os.Getenv("DB_USER")
	}
	if user == "" {
		user = "postgres"
	}
	pass := os.Getenv("DB_PASSWORD")
	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "disable"
	}

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s connect_timeout=5",
		host, port, user, pass, tenantDB, sslMode,
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
