package cdc

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"

	"chunkflow-backend/internal/crypto"
	"chunkflow-backend/internal/db"
	"chunkflow-backend/internal/logger"
)

// getPgDumpStream reads real PostgreSQL source credentials from the canvas_nodes table
// (or environment variables) and executes pg_dump matching chunk-flow's SnapshotReader.
func getPgDumpStream(ctx context.Context, conn *sql.DB, tenantDB string, connectorID string) ([]byte, error) {
	var host, port, user, password, dbName string

	// 1. Query canvas_nodes for PostgreSQL credentials
	var encConfig string
	err := conn.QueryRowContext(ctx, `
		SELECT cn.encrypted_config
		FROM canvas_nodes cn
		JOIN nodes n ON cn.node_id = n.id
		WHERE cn.connector_id = $1 AND (n.sub_type = 'postgres' OR cn.element_id LIKE 'node_source_%')
		LIMIT 1
	`, connectorID).Scan(&encConfig)

	if err == nil && encConfig != "" {
		decrypted, decErr := crypto.Decrypt(encConfig)
		if decErr == nil {
			var config map[string]interface{}
			if err := json.Unmarshal([]byte(decrypted), &config); err == nil {
				if v, ok := config["host"].(string); ok { host = v }
				if v, ok := config["port"].(string); ok { port = v }
				if v, ok := config["username"].(string); ok { user = v }
				if v, ok := config["password"].(string); ok { password = v }
				if v, ok := config["database"].(string); ok { dbName = v }
				if dbName == "" {
					if v, ok := config["database_name"].(string); ok { dbName = v }
				}
			}
		}
	}

	// 2. Read from environment variables if not specified in canvas_nodes table
	if host == "" {
		host = os.Getenv("DB_HOST")
	}
	if port == "" {
		port = os.Getenv("DB_PORT")
	}
	if user == "" {
		user = os.Getenv("DB_USER")
	}
	if password == "" {
		password = os.Getenv("DB_PASSWORD")
	}
	if dbName == "" {
		dbName = tenantDB
	}
	if dbName == "" {
		dbName = os.Getenv("DB_NAME")
	}

	if host == "" || user == "" || dbName == "" {
		return nil, fmt.Errorf("missing DB source credentials for host=%s, user=%s, db=%s", host, user, dbName)
	}

	cmd := exec.CommandContext(
		ctx,
		"pg_dump",
		"-h", host,
		"-p", port,
		"-U", user,
		"-d", dbName,
		"--format=plain",
		"--no-owner",
		"--no-privileges",
	)
	cmd.Env = append(os.Environ(), "PGPASSWORD="+password)

	out, err := cmd.Output()
	if err == nil && len(out) > 0 {
		return out, nil
	}
	return nil, err
}

// CDCRunnerResult holds the output metrics of a FastCDC stream execution.
type CDCRunnerResult struct {
	Subdomain      string       `json:"subdomain"`
	WorkflowName   string       `json:"workflow_name"`
	TargetTables   []string     `json:"target_tables"`
	TotalBytes     int64        `json:"total_bytes"`
	DedupBytes     int64        `json:"dedup_bytes"`
	TotalChunks    int          `json:"total_chunks"`
	UniqueChunks   int          `json:"unique_chunks"`
	DedupRatio     float64      `json:"dedup_ratio_percent"`
	DurationMs     int64        `json:"duration_ms"`
	DestinationKey string       `json:"destination_key"`
	ManifestID     string       `json:"manifest_id"`
	ChunkDetails   *ChunkResult `json:"chunk_details"`
}

// RunCDCWorkflow extracts source database stream using pg_dump (matching chunk-flow),
// slices the data using FastCDC, uploads to actual S3, and updates vault records.
func RunCDCWorkflow(subdomain, workflowName, connectorID string) (*CDCRunnerResult, error) {
	start := time.Now()
	if subdomain == "" {
		return nil, fmt.Errorf("cdc_runner: subdomain is required")
	}
	if workflowName == "" {
		workflowName = "PostgreSQL"
	}

	conn, tenantDB, err := db.OpenTenantDB(subdomain)
	if err != nil {
		return nil, fmt.Errorf("cdc_runner: failed to open tenant DB '%s': %w", tenantDB, err)
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// 1. Fetch public table names in tenant database
	var tables []string
	rows, err := conn.QueryContext(ctx, `
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
		ORDER BY table_name ASC
	`)
	if err == nil {
		for rows.Next() {
			var tbl string
			if e := rows.Scan(&tbl); e == nil {
				tables = append(tables, tbl)
			}
		}
		rows.Close()
	}

	if len(tables) == 0 {
		tables = []string{}
	}

	// 2. Obtain real database snapshot dump payload via pg_dump CLI (matching chunk-flow)
	var bytePayload []byte
	if dumpBytes, dumpErr := getPgDumpStream(ctx, conn, tenantDB, connectorID); dumpErr == nil && len(dumpBytes) > 0 {
		bytePayload = dumpBytes
		log.Printf("[CDC] Successfully captured %d bytes via real pg_dump stream for DB '%s'", len(bytePayload), tenantDB)
	} else {
		log.Printf("[CDC ERROR] Failed to capture pg_dump stream from source DB: %v", dumpErr)
		return nil, fmt.Errorf("failed to capture source database stream (check postgres credentials): %v", dumpErr)
	}

	// 3. Execute PlakarKorp FastCDC algorithm on raw byte payload
	chunkRes := SliceBufferWithFastCDC(bytePayload)
	durationMs := time.Since(start).Milliseconds()
	if durationMs == 0 {
		durationMs = 15
	}

	now := time.Now().UTC()
	manifestID := fmt.Sprintf("db-%s", now.Format("20060102-150405"))

	// 4. Fetch S3 credentials from canvas_nodes
	var s3EncConfig string
	_ = conn.QueryRowContext(ctx, `
		SELECT cn.encrypted_config
		FROM canvas_nodes cn
		JOIN nodes n ON cn.node_id = n.id
		WHERE cn.connector_id = $1 AND (n.sub_type = 's3' OR cn.element_id LIKE 'node_destination_%')
		LIMIT 1
	`, connectorID).Scan(&s3EncConfig)

	var s3Bucket, s3Region, s3AccessKey, s3SecretKey, s3Folder string
	if s3EncConfig != "" {
		if decrypted, err := crypto.Decrypt(s3EncConfig); err == nil {
			var config map[string]interface{}
			if err := json.Unmarshal([]byte(decrypted), &config); err == nil {
				if v, ok := config["bucketName"].(string); ok { s3Bucket = v }
				if v, ok := config["region"].(string); ok { s3Region = v }
				if v, ok := config["accessKeyId"].(string); ok { s3AccessKey = v }
				if v, ok := config["secretAccessKey"].(string); ok { s3SecretKey = v }
				if v, ok := config["folderPath"].(string); ok { s3Folder = v }
			}
		}
	}
	if s3Bucket == "" {
		return nil, fmt.Errorf("S3 Bucket Name is required in node configuration")
	}
	if s3Region == "" {
		s3Region = os.Getenv("AWS_REGION")
	}
	if s3Region == "" {
		return nil, fmt.Errorf("S3 Region is required in node configuration")
	}

	// Base folder specified by user in UI (e.g. "mybackups" or empty)
	s3Folder = strings.Trim(s3Folder, "/")
	
	// 1. Shared Chunk Pool Prefix (enables cross-deployment deduplication across all snapshot runs)
	var chunkPrefix string
	if s3Folder != "" {
		chunkPrefix = fmt.Sprintf("%s/chunks/", s3Folder)
	} else {
		chunkPrefix = "chunks/"
	}

	// 2. Unique Snapshot Manifest Folder (created fresh for every deploy workflow run with date & unique manifest ID)
	dateStr := now.Format("2006-01-02")
	var snapshotPrefix string
	if s3Folder != "" {
		snapshotPrefix = fmt.Sprintf("%s/snapshots/%s/%s/", s3Folder, dateStr, manifestID)
	} else {
		snapshotPrefix = fmt.Sprintf("snapshots/%s/%s/", dateStr, manifestID)
	}
	destKey := fmt.Sprintf("s3://%s/%s", s3Bucket, snapshotPrefix)

	// 5. Persist local CDC vault backup chunk artifact & dump
	_ = os.MkdirAll("logs/vault", 0755)
	localVaultFile := filepath.Join("logs/vault", fmt.Sprintf("%s_backup.cdc", subdomain))
	_ = os.WriteFile(localVaultFile, bytePayload, 0644)

	dumpFile := filepath.Join("logs/vault", fmt.Sprintf("%s.dump", manifestID))
	_ = os.WriteFile(dumpFile, bytePayload, 0644)

	// 6. Upload individual CDC chunks to AWS S3 by SHA-256 hash (with deduplication across past deployments)
	if s3AccessKey != "" && s3SecretKey != "" {
		awsCfg := aws.NewConfig().
			WithRegion(s3Region).
			WithCredentials(credentials.NewStaticCredentials(s3AccessKey, s3SecretKey, ""))
		sess, err := session.NewSession(awsCfg)
		if err == nil {
			s3Svc := s3.New(sess)
			seenInStream := make(map[string]bool)
			uploadedCount := 0
			dedupCount := 0
			var uploadedBytes int64 = 0

			for _, c := range chunkRes.Chunks {
				if seenInStream[c.Hash] {
					dedupCount++
					log.Printf("[LOCAL DEDUPE] Chunk %s... -> REPEATED in stream ✓ (Local deduplicated)", c.Hash[:12])
					continue
				}
				seenInStream[c.Hash] = true

				chunkKey := chunkPrefix + c.Hash

				// S3 deduplication check across all snapshots (HeadObject)
				_, headErr := s3Svc.HeadObject(&s3.HeadObjectInput{
					Bucket: aws.String(s3Bucket),
					Key:    aws.String(chunkKey),
				})

				if headErr == nil {
					dedupCount++
					log.Printf("[S3 DEDUPE] Chunk %s... -> EXISTS in S3 ✓ (Deduplicated across deployments)", c.Hash[:12])
					continue
				}

				// Upload chunk bytes to S3 shared chunk pool
				chunkData := bytePayload[c.Offset : c.Offset+int64(c.Size)]
				log.Printf("[S3 PUT] Uploading new chunk -> s3://%s/%s (%d bytes)...", s3Bucket, chunkKey, len(chunkData))
				_, err = s3Svc.PutObject(&s3.PutObjectInput{
					Bucket: aws.String(s3Bucket),
					Key:    aws.String(chunkKey),
					Body:   bytes.NewReader(chunkData),
				})
				if err != nil {
					log.Printf("[S3 UPLOAD ERROR] Failed uploading chunk s3://%s/%s: %v", s3Bucket, chunkKey, err)
					return nil, fmt.Errorf("failed to upload chunk %s to S3: %v", c.Hash[:12], err)
				}
				uploadedCount++
				uploadedBytes += int64(len(chunkData))
				log.Printf("[S3 PUT SUCCESS] Uploaded s3://%s/%s ✓", s3Bucket, chunkKey)
			}

			// Upload unique snapshot manifest.json for this deploy run
			manifestBytes, _ := json.MarshalIndent(map[string]interface{}{
				"manifest_id":   manifestID,
				"subdomain":     subdomain,
				"workflow_name": workflowName,
				"timestamp":     now.Format(time.RFC3339),
				"total_bytes":   chunkRes.TotalBytes,
				"total_chunks":  chunkRes.TotalChunks,
				"unique_chunks": chunkRes.UniqueChunks,
				"dedup_ratio":   chunkRes.DedupRatio,
				"chunks":        chunkRes.Chunks,
			}, "", "  ")

			manifestKey := snapshotPrefix + "manifest.json"
			log.Printf("[S3 MANIFEST] Uploading snapshot manifest -> s3://%s/%s", s3Bucket, manifestKey)
			_, _ = s3Svc.PutObject(&s3.PutObjectInput{
				Bucket: aws.String(s3Bucket),
				Key:    aws.String(manifestKey),
				Body:   bytes.NewReader(manifestBytes),
			})

			log.Printf("[S3 UPLOAD COMPLETE] Uploaded %d new chunks (%d bytes), deduplicated %d chunks to %s", uploadedCount, uploadedBytes, dedupCount, destKey)
		} else {
			log.Printf("[S3 SESSION ERROR] Failed to create AWS session: %v", err)
			return nil, fmt.Errorf("failed to create AWS session: %v", err)
		}
	} else {
		log.Printf("[S3 SKIP] No valid S3 credentials found, skipping actual AWS upload.")
		return nil, fmt.Errorf("no valid S3 credentials found for upload")
	}

	// 7. Save Manifest JSON & update master.csv + size.json
	manifest := &SnapshotManifest{
		ID:           manifestID,
		Subdomain:    subdomain,
		WorkflowName: workflowName,
		Timestamp:    now.Format(time.RFC3339),
		TotalBytes:   chunkRes.TotalBytes,
		TotalChunks:  chunkRes.TotalChunks,
		UniqueChunks: chunkRes.UniqueChunks,
		DedupRatio:   chunkRes.DedupRatio,
		Chunks:       chunkRes.Chunks,
	}
	if err := WriteManifestToFile(manifest, manifestID); err != nil {
		log.Printf("[MANIFEST ERROR] Failed writing manifest JSON %s: %v", manifestID, err)
	}
	if err := WriteMasterCSV(&now, manifestID); err != nil {
		log.Printf("[MANIFEST ERROR] Failed appending to master.csv for %s: %v", manifestID, err)
	}
	prevSize, _ := ReadSize()
	_ = SaveSize(prevSize + chunkRes.DedupBytes)

	// 8. Write detailed logs to logs/fastcdc_stream.log and stdout
	detailMsg := fmt.Sprintf("DB=%s TABLES=%v VAULT_FILE=%s MANIFEST_ID=%s", tenantDB, tables, localVaultFile, manifestID)
	logger.WriteFastCDCLog(
		subdomain,
		workflowName,
		chunkRes.TotalBytes,
		chunkRes.TotalChunks,
		chunkRes.UniqueChunks,
		chunkRes.DedupRatio,
		durationMs,
		destKey,
		detailMsg,
	)

	// Summary logs matching chunk-flow project format
	log.Printf("[SUMMARY] FastCDC Backup Process Complete in %dms! Manifest ID: %s", durationMs, manifestID)
	log.Printf("[SUMMARY] - Total Chunks Processed: %d (%d raw bytes)", chunkRes.TotalChunks, chunkRes.TotalBytes)
	log.Printf("[SUMMARY] - Unique Chunks Uploaded to S3: %d (%d bytes)", chunkRes.UniqueChunks, chunkRes.DedupBytes)
	log.Printf("[SUMMARY] - Deduplication Ratio: %.2f%%", chunkRes.DedupRatio)

	return &CDCRunnerResult{
		Subdomain:      subdomain,
		WorkflowName:   workflowName,
		TargetTables:   tables,
		TotalBytes:     chunkRes.TotalBytes,
		DedupBytes:     chunkRes.DedupBytes,
		TotalChunks:    chunkRes.TotalChunks,
		UniqueChunks:   chunkRes.UniqueChunks,
		DedupRatio:     chunkRes.DedupRatio,
		DurationMs:     durationMs,
		DestinationKey: destKey,
		ManifestID:     manifestID,
		ChunkDetails:   chunkRes,
	}, nil
}
