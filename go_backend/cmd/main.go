package main

import (
	"log"
	"os"

	"chunkflow-backend/internal/handlers"
	"chunkflow-backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Notice: No .env file found — falling back to system environment variables")
	}

	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)
	if os.Getenv("GIN_MODE") == "debug" {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.Default()

	// ── Global Middleware ─────────────────────────────────────────────────────
	router.Use(middleware.CORS())

	// ── API Routes ────────────────────────────────────────────────────────────
	api := router.Group("/api/v1")
	{
		// Test a live PostgreSQL connection (returns latency + table stats)
		api.POST("/test-db-connection", handlers.TestDBConnection)

		// Save node config (Postgres or S3) to the tenant's own database
		api.POST("/tenant-config", handlers.SaveTenantConfig)

		// Read back saved node configs from the tenant's database
		api.GET("/tenant-config", handlers.GetTenantConfig)

		// Deploy workflow pipeline and map source & destination DB IDs in workflow_deployments
		api.POST("/workflow/deploy", handlers.DeployWorkflow)

		// Get all deployed workflows for tenant
		api.GET("/workflows", handlers.GetWorkflows)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 ChunkFlow Go Backend running on http://localhost:%s\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
