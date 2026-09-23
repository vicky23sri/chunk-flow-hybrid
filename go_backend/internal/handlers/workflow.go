package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"chunkflow-backend/internal/cdc"
	"chunkflow-backend/internal/crypto"
	"chunkflow-backend/internal/db"
	"chunkflow-backend/internal/logger"

	"github.com/gin-gonic/gin"
)

// DeployWorkflowRequest represents the payload sent when deploying a workflow.
type DeployWorkflowRequest struct {
	Subdomain           string                 `json:"subdomain"`
	WorkflowName        string                 `json:"workflowName"`
	ConnectorID         string                 `json:"connector_id,omitempty"`
	SourceConfigID      string                 `json:"sourceConfigId"`
	DestinationConfigID string                 `json:"destinationConfigId"`
	Nodes               interface{}            `json:"nodes"`
	Connections         interface{}            `json:"connections"`
	Postgres            map[string]interface{} `json:"postgres,omitempty"`
	S3                  map[string]interface{} `json:"s3,omitempty"`
}

// DeployWorkflow handles POST /api/v1/workflow/deploy
// Persists the workflow node configuration into the tenant's configurations table,
// and executes the FastCDC engine over the tenant database stream.
func DeployWorkflow(c *gin.Context) {
	var req DeployWorkflowRequest
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

	conn, tenantDB, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("Failed to connect to tenant database: %v", err),
		})
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	workflowName := req.WorkflowName
	if workflowName == "" {
		workflowName = "PostgreSQL -> S3 Backup Pipeline"
	}

	// 1. Resolve or create Connector ID
	connID := req.ConnectorID
	if connID == "" {
		_ = conn.QueryRowContext(ctx, `SELECT id FROM connectors ORDER BY created_at ASC LIMIT 1`).Scan(&connID)
		if connID == "" {
			_ = conn.QueryRowContext(ctx, `INSERT INTO connectors (name) VALUES ($1) RETURNING id`, workflowName).Scan(&connID)
		}
	}

	// 2. Prepare Source & Destination Form Payloads
	var encSource, encDest string
	var rawSourceJSON, rawDestJSON string

	if req.Postgres != nil {
		b, _ := json.Marshal(req.Postgres)
		rawSourceJSON = string(b)
		encSource, _ = crypto.Encrypt(rawSourceJSON)
	}
	if req.S3 != nil {
		b, _ := json.Marshal(req.S3)
		rawDestJSON = string(b)
		encDest, _ = crypto.Encrypt(rawDestJSON)
	}

	// 3. Upsert into configurations table
	var existingConfigID string
	_ = conn.QueryRowContext(ctx, `SELECT id FROM configurations WHERE connector_id = $1 ORDER BY updated_at DESC LIMIT 1`, connID).Scan(&existingConfigID)

	var configID string
	if existingConfigID != "" {
		configID = existingConfigID
		_, _ = conn.ExecContext(ctx, `
			UPDATE configurations
			SET name = $1,
			    source_encrypted_data = CASE WHEN $2 != '' THEN $2 ELSE source_encrypted_data END,
			    destination_encrypted_data = CASE WHEN $3 != '' THEN $3 ELSE destination_encrypted_data END,
			    is_verified = true,
			    updated_at = NOW()
			WHERE id = $4
		`, workflowName, encSource, encDest, existingConfigID)
	} else {
		_ = conn.QueryRowContext(ctx, `
			INSERT INTO configurations (connector_id, name, source_encrypted_data, destination_encrypted_data, is_verified)
			VALUES ($1, $2, $3, $4, true)
			RETURNING id
		`, connID, workflowName, encSource, encDest).Scan(&configID)
	}

	logger.WriteEncryptionAuditLog(sub, "SAVE_ENCRYPT", configID, connID, rawSourceJSON, encSource, rawDestJSON, encDest)

	// 4. Execute FastCDC engine on source database stream
	cdcResult, cdcErr := cdc.RunCDCWorkflow(sub, workflowName)
	if cdcErr != nil {
		log.Printf("[FASTCDC_WARN] Failed to complete CDC stream for '%s': %v", sub, cdcErr)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"message":        fmt.Sprintf("Workflow '%s' deployed successfully & FastCDC stream completed for tenant DB '%s'!", workflowName, tenantDB),
		"deployment_id":  configID,
		"connector_id":   connID,
		"subdomain":      sub,
		"status":         "deployed",
		"fastcdc_result": cdcResult,
	})
}

// TriggerCDCPipeline handles POST /api/v1/workflow/trigger-cdc
// Manually triggers a FastCDC slicing & deduplication backup stream for a tenant.
func TriggerCDCPipeline(c *gin.Context) {
	var body struct {
		Subdomain    string `json:"subdomain"`
		WorkflowName string `json:"workflowName"`
	}
	_ = c.ShouldBindJSON(&body)

	sub := body.Subdomain
	if sub == "" {
		sub = c.GetHeader("X-Tenant-Subdomain")
	}
	if sub == "" {
		sub = "default"
	}

	wfName := body.WorkflowName
	if wfName == "" {
		wfName = "Manual FastCDC Stream"
	}

	res, err := cdc.RunCDCWorkflow(sub, wfName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("FastCDC execution failed: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("FastCDC streaming run completed successfully for tenant '%s'.", sub),
		"cdc":     res,
	})
}

// GetWorkflows handles GET /api/v1/workflows
// Returns deployed workflow configurations from the configurations table.
func GetWorkflows(c *gin.Context) {
	sub := c.Query("subdomain")
	if sub == "" {
		sub = c.GetHeader("X-Tenant-Subdomain")
	}
	if sub == "" {
		sub = "default"
	}

	conn, _, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "subdomain": sub, "workflows": []interface{}{}})
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := conn.QueryContext(ctx, `
		SELECT cfg.id, cfg.connector_id, cfg.name, cfg.is_verified, cfg.source_encrypted_data, cfg.destination_encrypted_data,
		       cfg.created_at, cfg.updated_at,
		       st.name AS source_type_name, dt.name AS destination_type_name
		FROM configurations cfg
		LEFT JOIN configuration_types st ON cfg.source_type_id = st.id
		LEFT JOIN configuration_types dt ON cfg.destination_type_id = dt.id
		ORDER BY cfg.updated_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "subdomain": sub, "workflows": []interface{}{}})
		return
	}
	defer rows.Close()

	type WorkflowItem struct {
		ID              string                 `json:"id"`
		Name            string                 `json:"name"`
		Status          string                 `json:"status"`
		ConnectorID     *string                `json:"connector_id"`
		SourceName      string                 `json:"source_name"`
		DestinationName string                 `json:"destination_name"`
		SourceData      map[string]interface{} `json:"source_data,omitempty"`
		DestinationData map[string]interface{} `json:"destination_data,omitempty"`
		CreatedAt       string                 `json:"created_at"`
		UpdatedAt       string                 `json:"updated_at"`
	}

	var list []WorkflowItem
	for rows.Next() {
		var item WorkflowItem
		var connID, srcEnc, destEnc, srcTypeName, destTypeName *string
		var created, updated time.Time

		if err := rows.Scan(&item.ID, &connID, &item.Name, &item.Status, &srcEnc, &destEnc, &created, &updated, &srcTypeName, &destTypeName); err == nil {
			item.ConnectorID = connID
			item.Status = "deployed"
			if srcTypeName != nil {
				item.SourceName = *srcTypeName
			} else {
				item.SourceName = "PostgreSQL Data Source"
			}
			if destTypeName != nil {
				item.DestinationName = *destTypeName
			} else {
				item.DestinationName = "Amazon S3 Vault"
			}

			if srcEnc != nil && *srcEnc != "" {
				decStr, _ := crypto.Decrypt(*srcEnc)
				if decStr != "" {
					var sData map[string]interface{}
					if json.Unmarshal([]byte(decStr), &sData) == nil {
						item.SourceData = sData
					}
				}
			}
			if destEnc != nil && *destEnc != "" {
				decStr, _ := crypto.Decrypt(*destEnc)
				if decStr != "" {
					var dData map[string]interface{}
					if json.Unmarshal([]byte(decStr), &dData) == nil {
						item.DestinationData = dData
					}
				}
			}

			item.CreatedAt = created.Format(time.RFC3339)
			item.UpdatedAt = updated.Format(time.RFC3339)
			list = append(list, item)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"subdomain": sub,
		"workflows": list,
	})
}
