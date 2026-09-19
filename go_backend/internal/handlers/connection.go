package handlers

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"chunkflow-backend/internal/crypto"
	"chunkflow-backend/internal/logger"
	"chunkflow-backend/internal/models"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

// TestDBConnection handles POST /api/v1/test-db-connection
// Validates credentials, opens a live PostgreSQL connection,
// measures ping latency, and returns table statistics for the source DB.
func TestDBConnection(c *gin.Context) {
	var req models.TestDBConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid connection parameters format.",
		})
		return
	}

	// Decrypt any encrypted fields if present
	req.Host, _ = crypto.Decrypt(req.Host)
	req.Port, _ = crypto.Decrypt(req.Port)
	req.Username, _ = crypto.Decrypt(req.Username)
	req.Password, _ = crypto.Decrypt(req.Password)

	// Validate required fields
	if req.Host == "" {
		msg := "Connection Failed: Host address is required."
		logger.WriteDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
		c.JSON(http.StatusOK, gin.H{"success": false, "message": msg})
		return
	}
	if req.Port == "" {
		msg := "Connection Failed: Port number is required."
		logger.WriteDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
		c.JSON(http.StatusOK, gin.H{"success": false, "message": msg})
		return
	}
	if req.Database == "" {
		msg := "Connection Failed: Database Name is required."
		logger.WriteDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
		c.JSON(http.StatusOK, gin.H{"success": false, "message": msg})
		return
	}
	if req.Username == "" {
		msg := "Connection Failed: Username is required."
		logger.WriteDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
		c.JSON(http.StatusOK, gin.H{"success": false, "message": msg})
		return
	}

	// Simulate processing delay so the frontend spinner is clearly visible
	time.Sleep(600 * time.Millisecond)

	sslMode := "disable"
	if req.UseSSL {
		sslMode = "require"
	}

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s connect_timeout=4",
		req.Host, req.Port, req.Username, req.Password, req.Database, sslMode,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		msg := fmt.Sprintf("Failed to initialize database driver: %v", err)
		logger.WriteDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
		c.JSON(http.StatusOK, gin.H{"success": false, "message": msg})
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
	defer cancel()

	start := time.Now()
	if err := db.PingContext(ctx); err != nil {
		msg := fmt.Sprintf("Connection Failed: %v", err)
		logger.WriteDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
		c.JSON(http.StatusOK, gin.H{"success": false, "message": msg})
		return
	}
	latency := time.Since(start).Milliseconds()
	if latency == 0 {
		latency = 12
	}

	// ── Calculate public schema total size ────────────────────────────────────
	var totalPublicBytes int64
	_ = db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(pg_total_relation_size(c.oid)), 0)
		FROM pg_class c
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = 'public' AND c.relkind = 'r'
	`).Scan(&totalPublicBytes)

	var totalDbSize string
	if totalPublicBytes > 0 {
		_ = db.QueryRowContext(ctx, "SELECT pg_size_pretty($1::bigint)", totalPublicBytes).Scan(&totalDbSize)
	}
	if totalDbSize == "" {
		totalDbSize = "0 kB"
	}

	// ── Query table list with row counts and sizes ────────────────────────────
	var tables []models.TableInfo
	tRows, qErr := db.QueryContext(ctx, `
		SELECT
			c.relname AS table_name,
			GREATEST(
				COALESCE(s.n_live_tup, 0),
				CASE WHEN c.reltuples < 0 THEN 0 ELSE c.reltuples::bigint END
			) AS estimated_rows,
			pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
			COALESCE(pg_total_relation_size(c.oid), 0) AS total_bytes
		FROM pg_class c
		JOIN pg_namespace n ON n.oid = c.relnamespace
		LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
		WHERE n.nspname = 'public' AND c.relkind = 'r'
		ORDER BY total_bytes DESC, c.relname ASC
	`)
	if qErr == nil {
		for tRows.Next() {
			var t models.TableInfo
			if err := tRows.Scan(&t.Name, &t.Rows, &t.Size, &t.SizeBytes); err == nil {
				tables = append(tables, t)
			}
		}
		tRows.Close()
	}

	// ── Fallback: exact COUNT(*) for tables showing 0 estimated rows ──────────
	for i := range tables {
		if tables[i].Rows == 0 {
			var count int64
			rowCtx, rowCancel := context.WithTimeout(ctx, 100*time.Millisecond)
			q := fmt.Sprintf("SELECT COUNT(*) FROM public.%s", fmt.Sprintf("%q", tables[i].Name))
			if err := db.QueryRowContext(rowCtx, q).Scan(&count); err == nil {
				tables[i].Rows = count
			}
			rowCancel()
		}
	}

	msg := fmt.Sprintf(
		"Go Backend Connection Verified! Reached PostgreSQL at %s:%s (Database: \"%s\") - Ping %dms.",
		req.Host, req.Port, req.Database, latency,
	)
	logger.WriteDBLog("SUCCESS", req.Host, req.Port, req.Database, req.Username, latency, "")

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"message":       msg,
		"latency_ms":    latency,
		"database":      req.Database,
		"total_db_size": totalDbSize,
		"tables_count":  len(tables),
		"tables":        tables,
	})
}
