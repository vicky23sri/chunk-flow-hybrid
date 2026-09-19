package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"chunkflow-backend/internal/crypto"
	"chunkflow-backend/internal/db"
	"chunkflow-backend/internal/logger"
	"chunkflow-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// SaveTenantConfig handles POST /api/v1/tenant-config
// Persists PostgreSQL source or S3 destination node configuration
// into the tenant's dedicated PostgreSQL database.
func SaveTenantConfig(c *gin.Context) {
	var req models.TenantConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid request body"})
		return
	}

	// Resolve subdomain: body > header > default
	sub := req.Subdomain
	if sub == "" {
		sub = c.GetHeader("X-Tenant-Subdomain")
	}
	if sub == "" {
		sub = "default"
	}

	// Log the save attempt
	logger.WriteTenantConfigLog(sub, req.Postgres, req.S3)

	// Open connection to the tenant's own database
	conn, tenantDB, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("Failed to connect to tenant database: %v", err),
		})
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	if err := conn.PingContext(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("Cannot reach tenant database '%s': %v", tenantDB, err),
		})
		return
	}

	// Ensure both config tables exist (idempotent)
	ensureTables(ctx, conn)

	savedItems := []string{}

	// ── Persist PostgreSQL source config ──────────────────────────────────────
	if req.Postgres != nil {
		if item, err := upsertSourceConfig(ctx, conn, sub, req.Postgres); err != nil {
			log.Printf("[TENANT_CONFIG] Failed to save source config for '%s': %v", sub, err)
		} else if item != "" {
			savedItems = append(savedItems, item)
		}
	}

	// ── Persist S3 destination config ─────────────────────────────────────────
	if req.S3 != nil {
		if item, err := upsertDestinationConfig(ctx, conn, sub, req.S3); err != nil {
			log.Printf("[TENANT_CONFIG] Failed to save destination config for '%s': %v", sub, err)
		} else if item != "" {
			savedItems = append(savedItems, item)
		}
	}

	msg := fmt.Sprintf("Tenant '%s' configuration saved to database.", sub)
	if len(savedItems) > 0 {
		msg = fmt.Sprintf("Saved to tenant DB '%s': %v", tenantDB, savedItems)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   msg,
		"subdomain": sub,
		"saved":     savedItems,
	})
}

// GetTenantConfig handles GET /api/v1/tenant-config
// Returns all saved source and destination configurations for the given tenant.
func GetTenantConfig(c *gin.Context) {
	sub := c.Query("subdomain")
	if sub == "" {
		sub = c.GetHeader("X-Tenant-Subdomain")
	}
	if sub == "" {
		sub = "default"
	}

	conn, _, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "subdomain": sub, "postgres": nil, "s3": nil})
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	sources := fetchSourceConfigs(ctx, conn)
	dests := fetchDestinationConfigs(ctx, conn)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"subdomain": sub,
		"postgres":  sources,
		"s3":        dests,
	})
}

// ── Private helpers ───────────────────────────────────────────────────────────

// ensureTables creates both config tables if they don't exist.
func ensureTables(ctx context.Context, conn sqlConn) {
	_, _ = conn.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS source_configurations (
			id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name            TEXT NOT NULL DEFAULT 'PostgreSQL Data Source',
			host            TEXT NOT NULL,
			port            TEXT NOT NULL DEFAULT '5432',
			database_name   TEXT NOT NULL,
			username        TEXT NOT NULL,
			password        TEXT NOT NULL,
			use_ssl         BOOLEAN NOT NULL DEFAULT false,
			backup_schedule TEXT,
			retention_days  INTEGER,
			is_verified     BOOLEAN NOT NULL DEFAULT false,
			last_tested_at  TIMESTAMPTZ,
			created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)

	_, _ = conn.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS destination_configurations (
			id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name              TEXT NOT NULL DEFAULT 'Amazon S3 Vault',
			bucket_name       TEXT NOT NULL,
			region            TEXT NOT NULL,
			access_key_id     TEXT NOT NULL,
			secret_access_key TEXT NOT NULL,
			folder_path       TEXT,
			encryption        TEXT NOT NULL DEFAULT 'AES-256 Server-Side Encryption',
			storage_class     TEXT NOT NULL DEFAULT 'Standard',
			is_verified       BOOLEAN NOT NULL DEFAULT false,
			last_tested_at    TIMESTAMPTZ,
			created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
}

// upsertSourceConfig saves a PostgreSQL source config.
// Returns a description string on success, or an error.
func upsertSourceConfig(ctx context.Context, conn sqlConn, sub string, data map[string]interface{}) (string, error) {
	str := func(k string) string { v, _ := data[k].(string); return v }
	boolVal := func(k string) bool { v, _ := data[k].(bool); return v }
	intPtr := func(k string) *int {
		if v, ok := data[k].(float64); ok {
			n := int(v)
			return &n
		}
		return nil
	}

	host := str("host")
	dbName := str("database")
	if dbName == "" {
		dbName = str("databaseName")
	}
	if dbName == "" {
		dbName = str("database_name")
	}
	username := str("username")
	password := str("password")
	port := str("port")
	name := str("name")
	if name == "" {
		name = "PostgreSQL Data Source"
	}
	if port == "" {
		port = "5432"
	}
	useSSL := boolVal("useSSL")
	backupSchedule := str("backupSchedule")
	retentionDays := intPtr("retentionDays")

	if host == "" || dbName == "" || username == "" || password == "" {
		return "", nil // skip — incomplete config
	}

	// Idempotent: add unique constraint if missing
	_, _ = conn.ExecContext(ctx, `
		DO $$ BEGIN
		  IF NOT EXISTS (
		    SELECT 1 FROM pg_constraint WHERE conname = 'source_configurations_host_db_unique'
		  ) THEN
		    ALTER TABLE source_configurations
		    ADD CONSTRAINT source_configurations_host_db_unique UNIQUE (host, database_name);
		  END IF;
		END $$
	`)

	// Check if record already exists by comparing decrypted database_name
	var existingID string
	rows, errQ := conn.QueryContext(ctx, `SELECT id, database_name FROM source_configurations`)
	if errQ == nil {
		for rows.Next() {
			var rID, encDB string
			if e := rows.Scan(&rID, &encDB); e == nil {
				decDB, _ := crypto.Decrypt(encDB)
				if decDB == dbName {
					existingID = rID
					break
				}
			}
		}
		rows.Close()
	}

	// Encrypt sensitive fields (host, port, database_name, username, password)
	encHost, _ := crypto.Encrypt(host)
	encPort, _ := crypto.Encrypt(port)
	encDBName, _ := crypto.Encrypt(dbName)
	encUsername, _ := crypto.Encrypt(username)
	encPassword, _ := crypto.Encrypt(password)

	var execErr error
	if existingID != "" {
		_, execErr = conn.ExecContext(ctx, `
			UPDATE source_configurations
			SET name=$1, host=$2, port=$3, database_name=$4, username=$5, password=$6, use_ssl=$7,
			    backup_schedule=$8, retention_days=$9,
			    is_verified=true, last_tested_at=NOW(), updated_at=NOW()
			WHERE id=$10
		`, name, encHost, encPort, encDBName, encUsername, encPassword, useSSL,
			db.NullableString(backupSchedule), retentionDays, existingID)
	} else {
		_, execErr = conn.ExecContext(ctx, `
			INSERT INTO source_configurations
				(name, host, port, database_name, username, password, use_ssl,
				 backup_schedule, retention_days, is_verified, last_tested_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,NOW(),NOW())
		`, name, encHost, encPort, encDBName, encUsername, encPassword, useSSL,
			db.NullableString(backupSchedule), retentionDays)
	}

	if execErr != nil {
		return "", execErr
	}
	return fmt.Sprintf("PostgreSQL source '%s'", dbName), nil
}

// upsertDestinationConfig saves an S3 destination config.
// Returns a description string on success, or an error.
func upsertDestinationConfig(ctx context.Context, conn sqlConn, sub string, data map[string]interface{}) (string, error) {
	str := func(k string) string { v, _ := data[k].(string); return v }

	bucket := str("bucketName")
	region := str("region")
	accessKey := str("accessKeyId")
	secret := str("secretAccessKey")
	folder := str("folderPath")
	encryption := str("encryption")
	storageClass := str("storageClass")
	name := str("name")
	if name == "" {
		name = "Amazon S3 Vault"
	}
	if encryption == "" {
		encryption = "AES-256 Server-Side Encryption"
	}
	if storageClass == "" {
		storageClass = "Standard"
	}

	if bucket == "" || region == "" || accessKey == "" || secret == "" {
		return "", nil // skip — incomplete config
	}

	// Check if record already exists by comparing decrypted bucket_name
	var existingID string
	dRows, errDQ := conn.QueryContext(ctx, `SELECT id, bucket_name FROM destination_configurations`)
	if errDQ == nil {
		for dRows.Next() {
			var rID, encBkt string
			if e := dRows.Scan(&rID, &encBkt); e == nil {
				decBkt, _ := crypto.Decrypt(encBkt)
				if decBkt == bucket {
					existingID = rID
					break
				}
			}
		}
		dRows.Close()
	}

	// Encrypt sensitive S3 credentials (bucket_name, access_key_id, secret_access_key, folder_path)
	encBucket, _ := crypto.Encrypt(bucket)
	encAccessKey, _ := crypto.Encrypt(accessKey)
	encSecret, _ := crypto.Encrypt(secret)
	encFolder, _ := crypto.Encrypt(folder)

	var execErr error
	if existingID != "" {
		_, execErr = conn.ExecContext(ctx, `
			UPDATE destination_configurations
			SET name=$1, bucket_name=$2, region=$3, access_key_id=$4, secret_access_key=$5,
			    folder_path=$6, encryption=$7, storage_class=$8,
			    is_verified=true, last_tested_at=NOW(), updated_at=NOW()
			WHERE id=$9
		`, name, encBucket, region, encAccessKey, encSecret,
			db.NullableString(encFolder), encryption, storageClass, existingID)
	} else {
		_, execErr = conn.ExecContext(ctx, `
			INSERT INTO destination_configurations
				(name, bucket_name, region, access_key_id, secret_access_key,
				 folder_path, encryption, storage_class, is_verified, last_tested_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW(),NOW())
		`, name, encBucket, region, encAccessKey, encSecret,
			db.NullableString(encFolder), encryption, storageClass)
	}

	if execErr != nil {
		return "", execErr
	}
	return fmt.Sprintf("S3 bucket '%s'", bucket), nil
}

// fetchSourceConfigs reads all source configurations from the tenant DB and decrypts fields.
func fetchSourceConfigs(ctx context.Context, conn sqlConn) []models.SourceConfiguration {
	rows, err := conn.QueryContext(ctx, `
		SELECT id, name, host, port, database_name, username, use_ssl,
		       backup_schedule, retention_days, is_verified
		FROM source_configurations ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var results []models.SourceConfiguration
	for rows.Next() {
		var r models.SourceConfiguration
		if e := rows.Scan(&r.ID, &r.Name, &r.Host, &r.Port, &r.DatabaseName,
			&r.Username, &r.UseSSL, &r.BackupSchedule, &r.RetentionDays, &r.IsVerified); e == nil {
			// Decrypt sensitive fields
			r.Host, _ = crypto.Decrypt(r.Host)
			r.Port, _ = crypto.Decrypt(r.Port)
			r.DatabaseName, _ = crypto.Decrypt(r.DatabaseName)
			r.Username, _ = crypto.Decrypt(r.Username)
			results = append(results, r)
		}
	}
	return results
}

// fetchDestinationConfigs reads all destination configurations from the tenant DB and decrypts fields.
func fetchDestinationConfigs(ctx context.Context, conn sqlConn) []models.DestinationConfiguration {
	rows, err := conn.QueryContext(ctx, `
		SELECT id, name, bucket_name, region, access_key_id,
		       folder_path, encryption, storage_class, is_verified
		FROM destination_configurations ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var results []models.DestinationConfiguration
	for rows.Next() {
		var r models.DestinationConfiguration
		if e := rows.Scan(&r.ID, &r.Name, &r.BucketName, &r.Region,
			&r.AccessKeyID, &r.FolderPath, &r.Encryption, &r.StorageClass, &r.IsVerified); e == nil {
			// Decrypt sensitive fields
			r.BucketName, _ = crypto.Decrypt(r.BucketName)
			r.AccessKeyID, _ = crypto.Decrypt(r.AccessKeyID)
			if r.FolderPath != nil {
				decFolder, _ := crypto.Decrypt(*r.FolderPath)
				r.FolderPath = &decFolder
			}
			results = append(results, r)
		}
	}
	return results
}
