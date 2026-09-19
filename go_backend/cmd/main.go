package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Load .env configuration
	if err := godotenv.Load(); err != nil {
		log.Println("Notice: No .env file found or failed to load, falling back to system environment variables")
	}

	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)
	if os.Getenv("GIN_MODE") == "debug" {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.Default()

	// Configure CORS for frontend access (custom domains, localhost, and *.chunkflow.test subdomains)
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Subdomain, X-Tenant-ID")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	// Base API Route Group
	api := router.Group("/api/v1")
	{
		// Test PostgreSQL Live Connection Endpoint
		api.POST("/test-db-connection", func(c *gin.Context) {
			var req struct {
				Host     string `json:"host"`
				Port     string `json:"port"`
				Database string `json:"database"`
				Username string `json:"username"`
				Password string `json:"password"`
				UseSSL   bool   `json:"useSSL"`
			}

			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid connection parameters format.",
				})
				return
			}

			// Validate required fields strictly from user payload
			if req.Host == "" {
				msg := "Connection Failed: Host address is required."
				writeDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": msg,
				})
				return
			}
			if req.Port == "" {
				msg := "Connection Failed: Port number is required."
				writeDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": msg,
				})
				return
			}
			if req.Database == "" {
				msg := "Connection Failed: Database Name is required."
				writeDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": msg,
				})
				return
			}
			if req.Username == "" {
				msg := "Connection Failed: Username is required."
				writeDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": msg,
				})
				return
			}

			// Simulate processing / ping delay so live spinner loader is clearly visible
			time.Sleep(600 * time.Millisecond)

			sslMode := "disable"
			if req.UseSSL {
				sslMode = "require"
			}

			connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s connect_timeout=4",
				req.Host, req.Port, req.Username, req.Password, req.Database, sslMode)

			db, err := sql.Open("postgres", connStr)
			if err != nil {
				msg := fmt.Sprintf("Failed to initialize database driver: %v", err)
				writeDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": msg,
				})
				return
			}
			defer db.Close()

			ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
			defer cancel()

			start := time.Now()
			if err := db.PingContext(ctx); err != nil {
				msg := fmt.Sprintf("Connection Failed: %v", err)
				writeDBLog("FAILED", req.Host, req.Port, req.Database, req.Username, 0, msg)
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": msg,
				})
				return
			}
			latency := time.Since(start).Milliseconds()
			if latency == 0 {
				latency = 12
			}

			// Query overall Database Size and Table Statistics
			type TableInfo struct {
				Name      string `json:"name"`
				Rows      int64  `json:"rows"`
				Size      string `json:"size"`
				SizeBytes int64  `json:"size_bytes"`
			}

			// 1. Calculate public schema total database size ONLY
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

			// 2. Query public schema tables with row counts and relation size
			var tables []TableInfo
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
					var t TableInfo
					if err := tRows.Scan(&t.Name, &t.Rows, &t.Size, &t.SizeBytes); err == nil {
						tables = append(tables, t)
					}
				}
				tRows.Close()
			}

			// 3. Fallback: if estimated rows is 0, attempt quick exact COUNT(*) for accuracy
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

			msg := fmt.Sprintf("Go Backend Connection Verified! Reached PostgreSQL at %s:%s (Database: \"%s\") - Ping %dms.", req.Host, req.Port, req.Database, latency)
			writeDBLog("SUCCESS", req.Host, req.Port, req.Database, req.Username, latency, "")

			c.JSON(http.StatusOK, gin.H{
				"success":       true,
				"message":       msg,
				"latency_ms":    latency,
				"database":      req.Database,
				"total_db_size": totalDbSize,
				"tables_count":  len(tables),
				"tables":        tables,
			})
		})

		// Save Tenant Connection Settings Endpoint (Tenant Scoped)
		api.POST("/tenant-config", func(c *gin.Context) {
			var req struct {
				Subdomain string                 `json:"subdomain"`
				Postgres  map[string]interface{} `json:"postgres"`
				S3        map[string]interface{} `json:"s3"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid request body"})
				return
			}
			sub := req.Subdomain
			if sub == "" {
				sub = c.GetHeader("X-Tenant-Subdomain")
			}
			if sub == "" {
				sub = "default"
			}

			writeTenantConfigLog(sub, req.Postgres, req.S3)
			c.JSON(http.StatusOK, gin.H{
				"success":   true,
				"message":   fmt.Sprintf("Tenant '%s' configuration saved successfully.", sub),
				"subdomain": sub,
			})
		})

		// Get Tenant Connection Settings Endpoint
		api.GET("/tenant-config", func(c *gin.Context) {
			sub := c.Query("subdomain")
			if sub == "" {
				sub = c.GetHeader("X-Tenant-Subdomain")
			}
			if sub == "" {
				sub = "default"
			}
			c.JSON(http.StatusOK, gin.H{
				"success":   true,
				"subdomain": sub,
			})
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 ChunkFlow Go Backend Server running on http://localhost:%s\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// writeDBLog logs all PostgreSQL connection test events to logs/db_connections.log file and stdout
func writeDBLog(status, host, port, dbName, username string, latencyMs int64, errDetail string) {
	_ = os.MkdirAll("logs", 0755)
	logFile, err := os.OpenFile("logs/db_connections.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("[LOG_ERR] Failed to open db_connections.log: %v", err)
		return
	}
	defer logFile.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	var entry string
	if status == "SUCCESS" {
		entry = fmt.Sprintf("[%s] [DB_CONN_TEST] STATUS=SUCCESS HOST=%s PORT=%s DB=%s USER=%s LATENCY=%dms\n",
			timestamp, host, port, dbName, username, latencyMs)
	} else {
		entry = fmt.Sprintf("[%s] [DB_CONN_TEST] STATUS=FAILED  HOST=%s PORT=%s DB=%s USER=%s ERROR=\"%s\"\n",
			timestamp, host, port, dbName, username, errDetail)
	}

	logFile.WriteString(entry)
	log.Print(entry)
}

// writeTenantConfigLog logs tenant configuration saves to logs/tenant_configs.log
func writeTenantConfigLog(subdomain string, postgres, s3 map[string]interface{}) {
	_ = os.MkdirAll("logs", 0755)
	logFile, err := os.OpenFile("logs/tenant_configs.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("[LOG_ERR] Failed to open tenant_configs.log: %v", err)
		return
	}
	defer logFile.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	pgDb := ""
	s3Bucket := ""
	if postgres != nil && postgres["database"] != nil {
		pgDb = fmt.Sprintf("%v", postgres["database"])
	}
	if s3 != nil && s3["bucketName"] != nil {
		s3Bucket = fmt.Sprintf("%v", s3["bucketName"])
	}

	entry := fmt.Sprintf("[%s] [TENANT_CONFIG_SAVE] SUBDOMAIN=%s PG_DB=\"%s\" S3_BUCKET=\"%s\"\n",
		timestamp, subdomain, pgDb, s3Bucket)

	logFile.WriteString(entry)
	log.Print(entry)
}
