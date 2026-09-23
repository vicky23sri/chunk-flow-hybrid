package handlers

import (
	"chunkflow-backend/internal/logger"
	"chunkflow-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// SaveTenantConfig handles POST /api/v1/tenant-config
// Delegates directly to SaveConfigurationInternal (writing to configurations table).
func SaveTenantConfig(c *gin.Context) {
	var req models.TenantConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "Invalid request body"})
		return
	}

	sub := req.Subdomain
	if sub == "" {
		sub = c.GetHeader("X-Tenant-Subdomain")
	}
	if sub == "" {
		sub = "default"
	}

	logger.WriteTenantConfigLog(sub, req.Postgres, req.S3)

	// Delegate directly to SaveConfigurationInternal
	SaveConfigurationInternal(c, req)
}

// GetTenantConfig handles GET /api/v1/tenant-config
// Delegates directly to GetConfigurations (reading from configurations table).
func GetTenantConfig(c *gin.Context) {
	GetConfigurations(c)
}
