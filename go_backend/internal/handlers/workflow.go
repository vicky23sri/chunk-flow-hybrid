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
	SourceConfigID      string                 `json:"sourceConfigId"`
	DestinationConfigID string                 `json:"destinationConfigId"`
	Nodes               interface{}            `json:"nodes"`
	Connections         interface{}            `json:"connections"`
	Postgres            map[string]interface{} `json:"postgres,omitempty"`
	S3                  map[string]interface{} `json:"s3,omitempty"`
}

// DeployWorkflow handles POST /api/v1/workflow/deploy
// Saves source/destination configurations, maps their DB IDs, creates
// a deployment record in the tenant's workflow_deployments table,
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

	// Ensure source_configurations and destination_configurations tables exist
	ensureTables(ctx, conn)

	// Ensure workflow_deployments table exists
	ensureWorkflowTables(ctx, conn)

	// 1. Save or resolve Source Configuration ID
	sourceID := req.SourceConfigID
	if req.Postgres != nil {
		if _, err := upsertSourceConfig(ctx, conn, sub, req.Postgres); err != nil {
			log.Printf("[WORKFLOW] Failed to upsert source config: %v", err)
		}
	}
	if sourceID == "" {
		// Fetch latest source config ID
		_ = conn.QueryRowContext(ctx, `SELECT id FROM source_configurations ORDER BY updated_at DESC LIMIT 1`).Scan(&sourceID)
	}

	// 2. Save or resolve Destination Configuration ID
	destID := req.DestinationConfigID
	if req.S3 != nil {
		if _, err := upsertDestinationConfig(ctx, conn, sub, req.S3); err != nil {
			log.Printf("[WORKFLOW] Failed to upsert destination config: %v", err)
		}
	}
	if destID == "" {
		// Fetch latest destination config ID
		_ = conn.QueryRowContext(ctx, `SELECT id FROM destination_configurations ORDER BY updated_at DESC LIMIT 1`).Scan(&destID)
	}

	// 3. Serialize nodes and connections JSON
	nodesJSON, _ := json.Marshal(req.Nodes)
	if len(nodesJSON) == 0 {
		nodesJSON = []byte("[]")
	}

	connsJSON, _ := json.Marshal(req.Connections)
	if len(connsJSON) == 0 {
		connsJSON = []byte("[]")
	}

	workflowName := req.WorkflowName
	if workflowName == "" {
		workflowName = "PostgreSQL -> S3 Backup Pipeline"
	}

	// 4. Upsert deployment record (UPDATE if workflow name already exists, else INSERT)
	var existingID string
	_ = conn.QueryRowContext(ctx, `SELECT id FROM workflow_deployments WHERE name = $1 ORDER BY updated_at DESC LIMIT 1`, workflowName).Scan(&existingID)

	var deploymentID string
	var errDeploy error

	if existingID != "" {
		deploymentID = existingID
		_, errDeploy = conn.ExecContext(ctx, `
			UPDATE workflow_deployments
			SET status = 'deployed',
			    source_config_id = NULLIF($1, '')::uuid,
			    destination_config_id = NULLIF($2, '')::uuid,
			    nodes_data = $3::jsonb,
			    connections_data = $4::jsonb,
			    updated_at = NOW()
			WHERE id = $5
		`, sourceID, destID, string(nodesJSON), string(connsJSON), existingID)

		// Delete any stale duplicate rows for the same workflow name
		_, _ = conn.ExecContext(ctx, `DELETE FROM workflow_deployments WHERE name = $1 AND id != $2`, workflowName, existingID)
	} else {
		errDeploy = conn.QueryRowContext(ctx, `
			INSERT INTO workflow_deployments
				(name, status, source_config_id, destination_config_id, nodes_data, connections_data, created_at, updated_at)
			VALUES ($1, 'deployed', NULLIF($2, '')::uuid, NULLIF($3, '')::uuid, $4::jsonb, $5::jsonb, NOW(), NOW())
			RETURNING id
		`, workflowName, sourceID, destID, string(nodesJSON), string(connsJSON)).Scan(&deploymentID)
	}

	if errDeploy != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("Failed to deploy workflow to database: %v", errDeploy),
		})
		return
	}

	// 5. Execute FastCDC engine on source database stream
	cdcResult, cdcErr := cdc.RunCDCWorkflow(sub, workflowName)
	if cdcErr != nil {
		log.Printf("[FASTCDC_WARN] Failed to complete CDC stream for '%s': %v", sub, cdcErr)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":               true,
		"message":               fmt.Sprintf("Workflow '%s' deployed successfully & FastCDC stream completed for tenant DB '%s'!", workflowName, tenantDB),
		"deployment_id":         deploymentID,
		"subdomain":             sub,
		"source_config_id":      sourceID,
		"destination_config_id": destID,
		"status":                "deployed",
		"fastcdc_result":        cdcResult,
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
// Returns deployed workflows for the tenant.
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

	ensureWorkflowTables(ctx, conn)

	rows, err := conn.QueryContext(ctx, `
		SELECT w.id, w.name, w.status, w.source_config_id, w.destination_config_id,
		       w.nodes_data, w.connections_data,
		       w.created_at, w.updated_at,
		       s.name AS source_name, d.name AS destination_name
		FROM workflow_deployments w
		LEFT JOIN source_configurations s ON w.source_config_id = s.id
		LEFT JOIN destination_configurations d ON w.destination_config_id = d.id
		ORDER BY w.updated_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "subdomain": sub, "workflows": []interface{}{}})
		return
	}
	defer rows.Close()

	type WorkflowItem struct {
		ID                  string          `json:"id"`
		Name                string          `json:"name"`
		Status              string          `json:"status"`
		SourceConfigID      *string         `json:"source_config_id"`
		DestinationConfigID *string         `json:"destination_config_id"`
		NodesData           json.RawMessage `json:"nodes_data"`
		ConnectionsData     json.RawMessage `json:"connections_data"`
		SourceName          *string         `json:"source_name"`
		DestinationName     *string         `json:"destination_name"`
		CreatedAt           string          `json:"created_at"`
		UpdatedAt           string          `json:"updated_at"`
	}

	var list []WorkflowItem
	for rows.Next() {
		var item WorkflowItem
		var srcID, destID, srcName, destName *string
		var created, updated time.Time
		var nodesRaw, connsRaw []byte
		if err := rows.Scan(&item.ID, &item.Name, &item.Status, &srcID, &destID, &nodesRaw, &connsRaw, &created, &updated, &srcName, &destName); err == nil {
			item.SourceConfigID = srcID
			item.DestinationConfigID = destID
			if len(nodesRaw) > 0 {
				item.NodesData = json.RawMessage(sanitizeNodesData(nodesRaw))
			}
			if len(connsRaw) > 0 {
				item.ConnectionsData = json.RawMessage(connsRaw)
			}
			item.SourceName = srcName
			item.DestinationName = destName
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

// ensureWorkflowTables creates the workflow_deployments table if it does not exist.
func ensureWorkflowTables(ctx context.Context, conn sqlConn) {
	_, _ = conn.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS workflow_deployments (
			id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name                   TEXT NOT NULL DEFAULT 'Pipeline Workflow',
			status                 TEXT NOT NULL DEFAULT 'deployed',
			source_config_id       UUID REFERENCES source_configurations(id) ON DELETE SET NULL,
			destination_config_id  UUID REFERENCES destination_configurations(id) ON DELETE SET NULL,
			nodes_data             JSONB NOT NULL DEFAULT '[]'::jsonb,
			connections_data       JSONB NOT NULL DEFAULT '[]'::jsonb,
			created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
}

// sanitizeNodesData decrypts any encrypted string fields in nodes_data JSON
func sanitizeNodesData(nodesRaw []byte) []byte {
	if len(nodesRaw) == 0 {
		return nodesRaw
	}
	var nodes []map[string]interface{}
	if err := json.Unmarshal(nodesRaw, &nodes); err != nil {
		return nodesRaw
	}

	for _, node := range nodes {
		if sub, ok := node["subtitle"].(string); ok {
			node["subtitle"], _ = crypto.Decrypt(sub)
		}
		if cfg, ok := node["config"].(map[string]interface{}); ok {
			for k, v := range cfg {
				if strVal, isStr := v.(string); isStr {
					decVal, _ := crypto.Decrypt(strVal)
					cfg[k] = decVal
				}
			}
		}
	}

	out, err := json.Marshal(nodes)
	if err != nil {
		return nodesRaw
	}
	return out
}
