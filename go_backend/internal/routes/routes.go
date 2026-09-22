package routes

import (
	"net/http"
	"time"

	"chunkflow-backend/internal/config"
	"chunkflow-backend/internal/handlers"
	"chunkflow-backend/internal/middleware"
	"chunkflow-backend/internal/scheduler"

	"github.com/gin-gonic/gin"
)

var startTime = time.Now()

// SetupRouter initializes the Gin engine, attaches middlewares, and registers all application routes.
func SetupRouter(cfg *config.Config) *gin.Engine {
	if cfg.GinMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	} else if cfg.GinMode == "debug" {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.New()

	// Global Middlewares
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())

	// Health Check Endpoint
	router.GET("/health", healthCheckHandler(cfg))

	// API v1 Routes
	v1 := router.Group("/api/v1")
	{
		v1.POST("/test-db-connection", handlers.TestDBConnection)
		v1.POST("/tenant-config", handlers.SaveTenantConfig)
		v1.GET("/tenant-config", handlers.GetTenantConfig)
		v1.POST("/workflow/deploy", handlers.DeployWorkflow)
		v1.GET("/workflows", handlers.GetWorkflows)
		v1.GET("/scheduler/logs", scheduler.GetCronLogsHandler)
		v1.GET("/scheduler/queue", scheduler.GetJobQueueHandler)
		v1.GET("/scheduler/next-run", scheduler.GetNextRunHandler)
		v1.POST("/scheduler/trigger", scheduler.PostTriggerHandler)
	}

	return router
}

func healthCheckHandler(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":      "healthy",
			"service":     "chunkflow-go-backend",
			"environment": cfg.AppEnv,
			"uptime":      time.Since(startTime).String(),
			"timestamp":   time.Now().Format(time.RFC3339),
		})
	}
}
