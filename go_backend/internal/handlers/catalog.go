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
	"chunkflow-backend/internal/logger"
	"chunkflow-backend/internal/models"

	"github.com/gin-gonic/gin"
)

func safeStr(ptr *string) string {
	if ptr != nil {
		return *ptr
	}
	return ""
}

// GetConfigurationTypes handles GET /api/v1/configuration-types
func GetConfigurationTypes(c *gin.Context) {
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
		SELECT ct.id, ct.node_key, ct.name, ct.category, ct.sub_type, ct.fields_schema, ct.is_active, ct.sort_order,
		       c.id, c.name, c.hex_code, c.bg_class, c.text_class
		FROM configuration_types ct
		LEFT JOIN colors c ON ct.color_id = c.id
		WHERE ct.is_active = true
		ORDER BY ct.sort_order ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer rows.Close()

	var list []models.ConfigurationType
	for rows.Next() {
		var ct models.ConfigurationType
		var fieldsJSON []byte
		var colID, colName, colHex, colBg, colText *string

		if e := rows.Scan(
			&ct.ID, &ct.NodeKey, &ct.Name, &ct.Category, &ct.SubType, &fieldsJSON, &ct.IsActive, &ct.SortOrder,
			&colID, &colName, &colHex, &colBg, &colText,
		); e == nil {
			_ = json.Unmarshal(fieldsJSON, &ct.FieldsSchema)
			if colID != nil {
				ct.ColorID = colID
				ct.Color = &models.Color{
					ID:        *colID,
					Name:      *colName,
					HexCode:   *colHex,
					BgClass:   *colBg,
					TextClass: *colText,
				}
			}
			list = append(list, ct)
		}
	}

	log.Printf("[NODE_CATALOG] Loaded %d configuration node types for tenant '%s'", len(list), sub)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    list,
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
		       CASE WHEN cfg.id IS NOT NULL THEN true ELSE false END AS is_configured
		FROM connectors c
		LEFT JOIN configurations cfg ON cfg.connector_id = c.id
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

// GetConfigurations handles GET /api/v1/configurations
func GetConfigurations(c *gin.Context) {
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
		SELECT cfg.id, cfg.connector_id, cfg.source_type_id, cfg.destination_type_id, cfg.name,
		       cfg.source_encrypted_data, cfg.destination_encrypted_data, cfg.is_verified, cfg.created_at, cfg.updated_at,
		       st.node_key, st.name, st.category, st.sub_type,
		       dt.node_key, dt.name, dt.category, dt.sub_type
		FROM configurations cfg
		LEFT JOIN configuration_types st ON cfg.source_type_id = st.id
		LEFT JOIN configuration_types dt ON cfg.destination_type_id = dt.id
		ORDER BY cfg.updated_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer rows.Close()

	list := make([]models.Configuration, 0)
	for rows.Next() {
		var cfg models.Configuration
		var connID, srcTypeID, destTypeID *string
		var srcEnc, destEnc *string
		var srcKey, srcName, srcCat, srcSub *string
		var destKey, destName, destCat, destSub *string
		var createdAt, updatedAt *time.Time

		if e := rows.Scan(
			&cfg.ID, &connID, &srcTypeID, &destTypeID, &cfg.Name,
			&srcEnc, &destEnc, &cfg.IsVerified, &createdAt, &updatedAt,
			&srcKey, &srcName, &srcCat, &srcSub,
			&destKey, &destName, &destCat, &destSub,
		); e != nil {
			log.Printf("[CONFIGURATIONS_SCAN_ERR] %v", e)
			continue
		}

		cfg.ConnectorID = connID
		cfg.SourceTypeID = srcTypeID
		cfg.DestinationTypeID = destTypeID
		if createdAt != nil {
			cfg.CreatedAt = createdAt.Format(time.RFC3339)
		}
		if updatedAt != nil {
			cfg.UpdatedAt = updatedAt.Format(time.RFC3339)
		}

		if srcTypeID != nil && srcKey != nil {
			cfg.SourceType = &models.ConfigurationType{
				ID:       *srcTypeID,
				NodeKey:  *srcKey,
				Name:     *srcName,
				Category: *srcCat,
				SubType:  *srcSub,
			}
		}
		if destTypeID != nil && destKey != nil {
			cfg.DestinationType = &models.ConfigurationType{
				ID:       *destTypeID,
				NodeKey:  *destKey,
				Name:     *destName,
				Category: *destCat,
				SubType:  *destSub,
			}
		}

		// Decrypt Source JSON Payload
		var rawSourceJSON, rawDestJSON string
		if srcEnc != nil && *srcEnc != "" {
			decStr, errDec := crypto.Decrypt(*srcEnc)
			if errDec == nil && decStr != "" {
				rawSourceJSON = decStr
				var sData map[string]interface{}
				if json.Unmarshal([]byte(decStr), &sData) == nil {
					cfg.SourceData = sData
				}
			}
		}

		// Decrypt Destination JSON Payload
		if destEnc != nil && *destEnc != "" {
			decStr, errDec := crypto.Decrypt(*destEnc)
			if errDec == nil && decStr != "" {
				rawDestJSON = decStr
				var dData map[string]interface{}
				if json.Unmarshal([]byte(decStr), &dData) == nil {
					cfg.DestinationData = dData
				}
			}
		}

		sEncStr := safeStr(srcEnc)
		dEncStr := safeStr(destEnc)
		logger.WriteEncryptionAuditLog(sub, "FETCH_DECRYPT", cfg.ID, safeStr(cfg.ConnectorID), rawSourceJSON, sEncStr, rawDestJSON, dEncStr)

		list = append(list, cfg)
	}

	log.Printf("[CONFIG_FETCH_DECRYPT] Fetched & decrypted AES-256 payload for %d configuration(s) (Tenant: '%s')", len(list), sub)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    list,
	})
}

// SaveConfiguration handles POST /api/v1/configurations
func SaveConfiguration(c *gin.Context) {
	var req models.TenantConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid payload"})
		return
	}
	SaveConfigurationInternal(c, req)
}

// SaveConfigurationInternal saves configuration payload into the configurations table
func SaveConfigurationInternal(c *gin.Context, req models.TenantConfigRequest) {
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

	// Ensure Connector ID exists
	if req.ConnectorID == "" {
		var firstConnID string
		_ = conn.QueryRowContext(ctx, `SELECT id FROM connectors ORDER BY created_at ASC LIMIT 1`).Scan(&firstConnID)
		if firstConnID == "" {
			_ = conn.QueryRowContext(ctx, `INSERT INTO connectors (name) VALUES ('Database-to-S3 Backup Workflow Builder') RETURNING id`).Scan(&firstConnID)
		}
		req.ConnectorID = firstConnID
	}

	// Resolve Source & Destination Type IDs
	var srcTypeID, destTypeID *string
	if req.SourceNodeKey != "" {
		var id string
		if err := conn.QueryRowContext(ctx, `SELECT id FROM configuration_types WHERE node_key = $1`, req.SourceNodeKey).Scan(&id); err == nil {
			srcTypeID = &id
		}
	} else if req.Postgres != nil {
		var id string
		if err := conn.QueryRowContext(ctx, `SELECT id FROM configuration_types WHERE node_key = 'postgres_source'`).Scan(&id); err == nil {
			srcTypeID = &id
		}
	}

	if req.DestinationNodeKey != "" {
		var id string
		if err := conn.QueryRowContext(ctx, `SELECT id FROM configuration_types WHERE node_key = $1`, req.DestinationNodeKey).Scan(&id); err == nil {
			destTypeID = &id
		}
	} else if req.S3 != nil {
		var id string
		if err := conn.QueryRowContext(ctx, `SELECT id FROM configuration_types WHERE node_key = 's3_destination'`).Scan(&id); err == nil {
			destTypeID = &id
		}
	}

	// Prepare Source & Destination Form Payloads
	sourcePayload := req.SourceData
	if sourcePayload == nil && req.Postgres != nil {
		sourcePayload = req.Postgres
	}
	destPayload := req.DestinationData
	if destPayload == nil && req.S3 != nil {
		destPayload = req.S3
	}

	var encSource, encDest string
	var rawSourceJSON, rawDestJSON string

	if sourcePayload != nil {
		b, _ := json.Marshal(sourcePayload)
		rawSourceJSON = string(b)
		encSource, _ = crypto.Encrypt(rawSourceJSON)
	}
	if destPayload != nil {
		b, _ := json.Marshal(destPayload)
		rawDestJSON = string(b)
		encDest, _ = crypto.Encrypt(rawDestJSON)
	}

	pipelineName := req.Name
	if pipelineName == "" {
		pipelineName = "Database-to-S3 Connection Pipeline"
	}

	// Check if a configuration record exists for this connector
	var existingConfigID string
	_ = conn.QueryRowContext(ctx, `SELECT id FROM configurations WHERE connector_id = $1 ORDER BY updated_at DESC LIMIT 1`, req.ConnectorID).Scan(&existingConfigID)

	var savedID string
	if existingConfigID != "" {
		_, err = conn.ExecContext(ctx, `
			UPDATE configurations
			SET source_type_id = COALESCE($1, source_type_id),
			    destination_type_id = COALESCE($2, destination_type_id),
			    name = $3,
			    source_encrypted_data = CASE WHEN $4 != '' THEN $4 ELSE source_encrypted_data END,
			    destination_encrypted_data = CASE WHEN $5 != '' THEN $5 ELSE destination_encrypted_data END,
			    is_verified = true,
			    updated_at = NOW()
			WHERE id = $6
		`, srcTypeID, destTypeID, pipelineName, encSource, encDest, existingConfigID)
		savedID = existingConfigID
	} else {
		err = conn.QueryRowContext(ctx, `
			INSERT INTO configurations (connector_id, source_type_id, destination_type_id, name, source_encrypted_data, destination_encrypted_data, is_verified)
			VALUES ($1, $2, $3, $4, $5, $6, true)
			RETURNING id
		`, req.ConnectorID, srcTypeID, destTypeID, pipelineName, encSource, encDest).Scan(&savedID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": fmt.Sprintf("Failed to save configuration: %v", err)})
		return
	}

	log.Printf("[CONFIG_ENCRYPT_SAVE] Encrypted AES-256 payload & saved Configuration ID '%s' for Connector '%s' (Tenant: '%s')", savedID, req.ConnectorID, sub)
	logger.WriteEncryptionAuditLog(sub, "SAVE_ENCRYPT", savedID, req.ConnectorID, rawSourceJSON, encSource, rawDestJSON, encDest)

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"message":      "Configuration saved successfully",
		"id":           savedID,
		"connector_id": req.ConnectorID,
	})
}
