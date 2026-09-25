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
	if workflowName == "" || workflowName == "Portiq" {
		workflowName = "Database to s3 connector"
	}

	// 1. Resolve or create Connector ID
	connID := req.ConnectorID
	if connID == "" || connID == "default_connector" {
		_ = conn.QueryRowContext(ctx, `SELECT id FROM connectors WHERE name = $1 LIMIT 1`, workflowName).Scan(&connID)
		if connID == "" {
			_ = conn.QueryRowContext(ctx, `SELECT id FROM connectors ORDER BY created_at ASC LIMIT 1`).Scan(&connID)
		}
		if connID == "" {
			_ = conn.QueryRowContext(ctx, `INSERT INTO connectors (name) VALUES ($1) RETURNING id`, workflowName).Scan(&connID)
		}
	} else if connID != "" && workflowName != "" {
		_, _ = conn.ExecContext(ctx, `UPDATE connectors SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, workflowName, connID)
	}

	// (Configurations table logic removed as node data is directly mapped from canvas_nodes)

	// 4. Execute FastCDC engine on source database stream
	cdcResult, cdcErr := cdc.RunCDCWorkflow(sub, workflowName, connID)
	if cdcErr != nil {
		log.Printf("[FASTCDC_ERROR] Failed to complete CDC stream for '%s': %v", sub, cdcErr)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("Failed to deploy workflow: %v", cdcErr),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"message":        fmt.Sprintf("Workflow '%s' deployed successfully & FastCDC stream completed for tenant DB '%s'!", workflowName, tenantDB),
		"deployment_id":  "canvas-deployment", // Deprecated configID
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

	// Fallback connector resolution if empty
	var connID string
	conn, _, err := db.OpenTenantDB(sub)
	if err == nil {
		_ = conn.QueryRow(`SELECT id FROM connectors ORDER BY created_at ASC LIMIT 1`).Scan(&connID)
		conn.Close()
	}

	res, err := cdc.RunCDCWorkflow(sub, wfName, connID)
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
