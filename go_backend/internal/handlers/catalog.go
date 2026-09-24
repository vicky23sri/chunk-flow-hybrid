package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"chunkflow-backend/internal/crypto"
	"chunkflow-backend/internal/db"
	"chunkflow-backend/internal/models"
	"chunkflow-backend/internal/logger"

	"github.com/gin-gonic/gin"
)

func safeStr(ptr *string) string {
	if ptr != nil {
		return *ptr
	}
	return ""
}

// GetNodes handles GET /api/v1/nodes
func GetNodes(c *gin.Context) {
	sub := c.Query("subdomain")
	if sub == "" {
		sub = c.GetHeader("X-Tenant-Subdomain")
	}
	if sub == "" {
		sub = "default"
	}

	conn, _, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := conn.QueryContext(ctx, `
		SELECT id, node_key, name, category, sub_type, color, fields_schema, is_active, sort_order
		FROM nodes
		ORDER BY sort_order ASC, name ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer rows.Close()

	var list []models.Node
	for rows.Next() {
		var n models.Node
		var colorJSON, fieldsJSON []byte

		if e := rows.Scan(
			&n.ID, &n.NodeKey, &n.Name, &n.Category, &n.SubType, &colorJSON, &fieldsJSON, &n.IsActive, &n.SortOrder,
		); e == nil {
			_ = json.Unmarshal(colorJSON, &n.Color)
			_ = json.Unmarshal(fieldsJSON, &n.FieldsSchema)
			list = append(list, n)
		}
	}

	log.Printf("[NODE_CATALOG] Loaded %d nodes for tenant '%s'", len(list), sub)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    list,
	})
}

// ToggleNodeActive toggles the is_active status of a node
func ToggleNodeActive(c *gin.Context) {
	nodeID := c.Param("id")
	if nodeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "node ID is required"})
		return
	}

	sub := c.Query("subdomain")
	if sub == "" {
		sub = "default"
	}
	dbConn, _, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "tenant DB error"})
		return
	}
	defer dbConn.Close()

	var currentStatus bool
	err = dbConn.QueryRow("SELECT is_active FROM nodes WHERE id = $1", nodeID).Scan(&currentStatus)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "node not found"})
		return
	}

	newStatus := !currentStatus

	// If we are deactivating, check if the node is used in any active connectors
	if !newStatus {
		force := c.Query("force")
		if force != "true" {
			rows, err := dbConn.Query(`
				SELECT DISTINCT c.name 
				FROM canvas_nodes cn 
				JOIN connectors c ON cn.connector_id = c.id 
				WHERE cn.node_id = $1
			`, nodeID)
			
			if err == nil {
				defer rows.Close()
				var activeConnectors []string
				for rows.Next() {
					var cName string
					if err := rows.Scan(&cName); err == nil {
						activeConnectors = append(activeConnectors, cName)
					}
				}
				
				if len(activeConnectors) > 0 {
					c.JSON(http.StatusConflict, gin.H{
						"error": "in_use",
						"message": "Node is currently active in connectors",
						"connectors": activeConnectors,
					})
					return
				}
			}
		}
	}

	_, err = dbConn.Exec("UPDATE nodes SET is_active = $1, updated_at = NOW() WHERE id = $2", newStatus, nodeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update node status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"is_active": newStatus,
	})
}

// GetConnectors handles GET /api/v1/connectors
func GetConnectors(c *gin.Context) {
	sub := c.Query("subdomain")
	if sub == "" {
		sub = c.GetHeader("X-Tenant-Subdomain")
	}
	if sub == "" {
		sub = "default"
	}

	conn, _, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := conn.QueryContext(ctx, `
		SELECT c.id, c.name, c.status, c.created_at, c.updated_at,
		       EXISTS (SELECT 1 FROM canvas_nodes cn WHERE cn.connector_id = c.id) AS is_configured
		FROM connectors c
		ORDER BY c.updated_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer rows.Close()

	var list []models.Connector
	for rows.Next() {
		var connItem models.Connector
		var createdAt, updatedAt *time.Time
		if e := rows.Scan(&connItem.ID, &connItem.Name, &connItem.Status, &createdAt, &updatedAt, &connItem.IsConfigured); e == nil {
			if createdAt != nil {
				connItem.CreatedAt = createdAt.Format(time.RFC3339)
			} else {
				connItem.CreatedAt = time.Now().Format(time.RFC3339)
			}
			if updatedAt != nil {
				connItem.UpdatedAt = updatedAt.Format(time.RFC3339)
			} else {
				connItem.UpdatedAt = time.Now().Format(time.RFC3339)
			}
			list = append(list, connItem)
		} else {
			log.Printf("[CONNECTORS_LIST] Error scanning row: %v", e)
		}
	}

	log.Printf("[CONNECTORS_LIST] Loaded %d connector(s) for tenant '%s'", len(list), sub)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    list,
	})
}

// CreateConnector handles POST /api/v1/connectors
func CreateConnector(c *gin.Context) {
	sub := c.GetHeader("X-Tenant-Subdomain")
	if sub == "" {
		sub = "default"
	}

	var req struct {
		Name   string `json:"name"`
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Name == "" {
		req.Name = "Database-to-S3 Backup Workflow Builder"
	}
	if req.Status == "" {
		req.Status = "active"
	}

	conn, _, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var newID string
	err = conn.QueryRowContext(ctx, `
		INSERT INTO connectors (name, status, created_at, updated_at)
		VALUES ($1, $2, NOW(), NOW())
		RETURNING id
	`, req.Name, req.Status).Scan(&newID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	log.Printf("[CONNECTOR_NEW] Created new connector '%s' (ID: %s) for tenant '%s'", req.Name, newID, sub)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"id":      newID,
		"name":    req.Name,
		"status":  req.Status,
	})
}

// GetCanvas handles GET /api/v1/canvas
func GetCanvas(c *gin.Context) {
	sub := c.Query("subdomain")
	if sub == "" {
		sub = c.GetHeader("X-Tenant-Subdomain")
	}
	if sub == "" {
		sub = "default"
	}
	connectorID := c.Query("connector_id")

	conn, _, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Query canvas_nodes
	nodeQuery := `
		SELECT cn.id, cn.connector_id, cn.node_id, cn.element_id, cn.label, cn.position_x, cn.position_y, cn.encrypted_config, cn.is_verified, cn.created_at, cn.updated_at,
			   n.node_key, n.name, n.category, n.sub_type
		FROM canvas_nodes cn
		LEFT JOIN nodes n ON cn.node_id = n.id
	`
	var nodeArgs []interface{}
	if connectorID != "" {
		nodeQuery += " WHERE cn.connector_id = $1"
		nodeArgs = append(nodeArgs, connectorID)
	}

	nodeRows, err := conn.QueryContext(ctx, nodeQuery, nodeArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer nodeRows.Close()

	var nodesList []models.CanvasNode
	for nodeRows.Next() {
		var cn models.CanvasNode
		var n models.Node
		var encConfig *string
		var createdAt, updatedAt *time.Time

		if e := nodeRows.Scan(
			&cn.ID, &cn.ConnectorID, &cn.NodeID, &cn.ElementID, &cn.Label, &cn.PositionX, &cn.PositionY, &encConfig, &cn.IsVerified, &createdAt, &updatedAt,
			&n.NodeKey, &n.Name, &n.Category, &n.SubType,
		); e == nil {
			n.ID = cn.NodeID
			cn.Node = &n
			if createdAt != nil {
				cn.CreatedAt = createdAt.Format(time.RFC3339)
			}
			if updatedAt != nil {
				cn.UpdatedAt = updatedAt.Format(time.RFC3339)
			}

			// Decrypt Configuration
			if encConfig != nil && *encConfig != "" {
				cn.EncryptedConfig = *encConfig
				decStr, errDec := crypto.Decrypt(*encConfig)
				if errDec == nil && decStr != "" {
					var cfgData map[string]interface{}
					if json.Unmarshal([]byte(decStr), &cfgData) == nil {
						cn.ConfigData = cfgData
						// Log decryption
						logger.WriteEncryptionAuditLog(sub, "FETCH_DECRYPT", n.ID, cn.ConnectorID, decStr, *encConfig, "", "")
					}
				}
			}

			nodesList = append(nodesList, cn)
		}
	}

	// Query canvas_connections
	connQuery := `
		SELECT id, connector_id, source_canvas_node_id, target_canvas_node_id, source_handle, target_handle, created_at
		FROM canvas_connections
	`
	var connArgs []interface{}
	if connectorID != "" {
		connQuery += " WHERE connector_id = $1"
		connArgs = append(connArgs, connectorID)
	}

	connRows, err := conn.QueryContext(ctx, connQuery, connArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer connRows.Close()

	var connList []models.CanvasConnection
	for connRows.Next() {
		var cc models.CanvasConnection
		var srcHandle, tgtHandle *string
		var createdAt *time.Time

		if e := connRows.Scan(
			&cc.ID, &cc.ConnectorID, &cc.SourceCanvasNodeID, &cc.TargetCanvasNodeID, &srcHandle, &tgtHandle, &createdAt,
		); e == nil {
			cc.SourceHandle = srcHandle
			cc.TargetHandle = tgtHandle
			if createdAt != nil {
				cc.CreatedAt = createdAt.Format(time.RFC3339)
			}
			connList = append(connList, cc)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"nodes":       nodesList,
		"connections": connList,
	})
}

// SaveCanvas handles POST /api/v1/canvas
func SaveCanvas(c *gin.Context) {
	var req models.SaveCanvasRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid payload"})
		return
	}

	sub := req.Subdomain
	if sub == "" {
		sub = c.GetHeader("X-Tenant-Subdomain")
	}
	if sub == "" {
		sub = "default"
	}

	conn, _, err := db.OpenTenantDB(sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	if req.ConnectorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Connector ID is required"})
		return
	}

	// Begin Transaction
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to start transaction"})
		return
	}

	// Clean up existing nodes and connections for this connector (full replace)
	_, err = tx.ExecContext(ctx, `DELETE FROM canvas_nodes WHERE connector_id = $1`, req.ConnectorID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to clear old canvas nodes"})
		return
	}

	// Insert nodes
	nodeIDMap := make(map[string]string) // element_id to new uuid
	for _, n := range req.Nodes {
		var encConfig string
		if n.ConfigData != nil {
			b, _ := json.Marshal(n.ConfigData)
			encConfig, _ = crypto.Encrypt(string(b))
		}

		var newID string
		err = tx.QueryRowContext(ctx, `
			INSERT INTO canvas_nodes (connector_id, node_id, element_id, label, position_x, position_y, encrypted_config, is_verified)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id
		`, req.ConnectorID, n.NodeID, n.ElementID, n.Label, n.PositionX, n.PositionY, encConfig, n.IsVerified).Scan(&newID)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": fmt.Sprintf("Failed to save node: %v", err)})
			return
		}
		nodeIDMap[n.ElementID] = newID

		if n.ConfigData != nil {
			b, _ := json.Marshal(n.ConfigData)
			logger.WriteEncryptionAuditLog(sub, "SAVE_ENCRYPT", newID, req.ConnectorID, string(b), encConfig, "", "")
			logger.WriteTenantConfigDetailLog("INSERT", sub, "canvas_node", newID, fmt.Sprintf("Saved config for element %s", n.ElementID))
		}
	}

	// Insert connections
	for _, connReq := range req.Connections {
		srcCanvasNodeID := nodeIDMap[connReq.SourceCanvasNodeID]
		tgtCanvasNodeID := nodeIDMap[connReq.TargetCanvasNodeID]

		// If frontend sends element_ids, use the mapped uuid; otherwise if it already sends the db uuid, use it.
		// For robustness, check if we have mapped it (if the payload uses element_id as foreign keys).
		if srcCanvasNodeID == "" {
			srcCanvasNodeID = connReq.SourceCanvasNodeID // Fallback to raw UUID
		}
		if tgtCanvasNodeID == "" {
			tgtCanvasNodeID = connReq.TargetCanvasNodeID
		}

		_, err = tx.ExecContext(ctx, `
			INSERT INTO canvas_connections (connector_id, source_canvas_node_id, target_canvas_node_id, source_handle, target_handle)
			VALUES ($1, $2, $3, $4, $5)
		`, req.ConnectorID, srcCanvasNodeID, tgtCanvasNodeID, connReq.SourceHandle, connReq.TargetHandle)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": fmt.Sprintf("Failed to save connection: %v", err)})
			return
		}
	}

	// Commit Transaction
	err = tx.Commit()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to commit changes"})
		return
	}

	log.Printf("[CANVAS_SAVE] Successfully saved canvas for connector '%s' (Tenant: '%s')", req.ConnectorID, sub)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Canvas saved successfully",
	})
}
