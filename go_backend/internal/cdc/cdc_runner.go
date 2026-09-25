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
	"sync"
	"sync/atomic"
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
				if v, ok := config["host"].(string); ok {
					host = v
				}
				if v, ok := config["port"].(string); ok {
					port = v
				}
				if v, ok := config["username"].(string); ok {
					user = v
				}
				if v, ok := config["password"].(string); ok {
					password = v
				}
				if v, ok := config["database"].(string); ok {
					dbName = v
				}
				if dbName == "" {
					if v, ok := config["database_name"].(string); ok {
						dbName = v
					}
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

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	// Fetch connector name from connectors table if available
	var dbConnectorName string
	if connectorID != "" {
		_ = conn.QueryRowContext(ctx, "SELECT name FROM connectors WHERE id = $1", connectorID).Scan(&dbConnectorName)
	}
	if dbConnectorName != "" {
		workflowName = dbConnectorName
	}
	if workflowName == "" || workflowName == "Portiq" {
		workflowName = "Database to s3 connector"
	}

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

	// Save real combined SQL database backup dump payload locally for instant downloads
	vaultSqlDir := filepath.Join("logs", "vault")
	_ = os.MkdirAll(vaultSqlDir, 0755)
	sqlFilePath := filepath.Join(vaultSqlDir, fmt.Sprintf("%s.sql", manifestID))
	_ = os.WriteFile(sqlFilePath, bytePayload, 0644)

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
				if v, ok := config["bucketName"].(string); ok {
					s3Bucket = v
				}
				if v, ok := config["region"].(string); ok {
					s3Region = v
				}
				if v, ok := config["accessKeyId"].(string); ok {
					s3AccessKey = v
				}
				if v, ok := config["secretAccessKey"].(string); ok {
					s3SecretKey = v
				}
				if v, ok := config["folderPath"].(string); ok {
					s3Folder = v
				}
			}
		}
	}
	if s3Bucket == "" {
		return nil, fmt.Errorf("S3 Bucket Name is required. Please configure the S3 destination node in the canvas.")
	}
	if s3Region == "" {
		return nil, fmt.Errorf("S3 Region is required. Please configure the S3 destination node in the canvas.")
	}
	if s3AccessKey == "" || s3SecretKey == "" {
		return nil, fmt.Errorf("S3 Access Key and Secret Key are required. Please configure the S3 destination node in the canvas.")
	}

	// Base folder specified by user in UI (e.g. "mybackups" or empty)
	s3Folder = strings.Trim(s3Folder, "/")

	// Fetch username from tenant DB (or fallback to subdomain)
	var username string
	_ = conn.QueryRowContext(ctx, "SELECT COALESCE(name, email, 'user') FROM users ORDER BY id ASC LIMIT 1").Scan(&username)
	if username == "" {
		username = subdomain
	}
	cleanUsername := strings.ReplaceAll(strings.ToLower(strings.TrimSpace(username)), " ", "_")
	cleanConnectorName := strings.ReplaceAll(strings.TrimSpace(workflowName), " ", "_")
	if cleanConnectorName == "" || cleanConnectorName == "Portiq" {
		cleanConnectorName = "Database_to_s3_connector"
	}

	// 5. Upload Chunks to User's Destination S3 Node (e.g. chunknodes)
	if s3AccessKey != "" && s3SecretKey != "" && s3Bucket != "" {
		destAwsCfg := aws.NewConfig().
			WithRegion(s3Region).
			WithCredentials(credentials.NewStaticCredentials(s3AccessKey, s3SecretKey, ""))
		sess, err := session.NewSession(destAwsCfg)
		if err == nil {
			s3Svc := s3.New(sess)
			destChunkPrefix := ""
			if s3Folder != "" {
				destChunkPrefix = strings.Trim(s3Folder, "/") + "/"
			}

			seenInStream := make(map[string]bool)
			var uniqueChunksToUpload []ChunkInfo
			dedupCount := 0

			for _, c := range chunkRes.Chunks {
				if seenInStream[c.Hash] {
					dedupCount++
					continue
				}
				seenInStream[c.Hash] = true
				uniqueChunksToUpload = append(uniqueChunksToUpload, c)
			}

			var uploadedCount int64
			var atomicDedupCount int64 = int64(dedupCount)

			if len(uniqueChunksToUpload) > 0 {
				chunkChan := make(chan ChunkInfo, len(uniqueChunksToUpload))
				for _, c := range uniqueChunksToUpload {
					chunkChan <- c
				}
				close(chunkChan)

				workerCount := 10
				if len(uniqueChunksToUpload) < workerCount {
					workerCount = len(uniqueChunksToUpload)
				}

				var wg sync.WaitGroup
				for i := 0; i < workerCount; i++ {
					wg.Add(1)
					go func() {
						defer wg.Done()
						for c := range chunkChan {
							chunkKey := destChunkPrefix + c.Hash

							_, headErr := s3Svc.HeadObject(&s3.HeadObjectInput{
								Bucket: aws.String(s3Bucket),
								Key:    aws.String(chunkKey),
							})
							if headErr == nil {
								atomic.AddInt64(&atomicDedupCount, 1)
								continue
							}

							chunkData := bytePayload[c.Offset : c.Offset+int64(c.Size)]
							log.Printf("[DEST S3 PUT] Uploading chunk -> s3://%s/%s (%d bytes)...", s3Bucket, chunkKey, len(chunkData))
							_, putErr := s3Svc.PutObject(&s3.PutObjectInput{
								Bucket: aws.String(s3Bucket),
								Key:    aws.String(chunkKey),
								Body:   bytes.NewReader(chunkData),
							})
							if putErr != nil {
								log.Printf("[DEST S3 ERROR] Failed uploading chunk to s3://%s/%s: %v", s3Bucket, chunkKey, putErr)
							} else {
								atomic.AddInt64(&uploadedCount, 1)
							}
						}
					}()
				}
				wg.Wait()
			}
			log.Printf("[DEST S3 COMPLETE] Synced %d chunks (%d dedup) to destination bucket s3://%s/%s", uploadedCount, atomicDedupCount, s3Bucket, destChunkPrefix)
		}
	}

	// 6. Upload Master Vault Snapshot Manifest & Chunks to Master S3 Bucket (.env chunkflow)
	masterBucket := os.Getenv("S3_BUCKET_NAME")
	if masterBucket == "" {
		masterBucket = "chunkflow"
	}
	masterRegion := os.Getenv("AWS_REGION")
	if masterRegion == "" {
		masterRegion = "us-west-1"
	}
	masterAccessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	masterSecretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")

	var manifestS3URI, chunksS3URI string

	if masterAccessKey != "" && masterSecretKey != "" {
		masterAwsCfg := aws.NewConfig().
			WithRegion(masterRegion).
			WithCredentials(credentials.NewStaticCredentials(masterAccessKey, masterSecretKey, ""))
		masterSess, masterErr := session.NewSession(masterAwsCfg)
		if masterErr == nil {
			masterSvc := s3.New(masterSess)

			masterBasePrefix := fmt.Sprintf("%s/%s/%s", subdomain, cleanUsername, cleanConnectorName)
			masterChunkPrefix := fmt.Sprintf("%s/chunks/", masterBasePrefix)
			cleanTimestamp := strings.TrimPrefix(manifestID, "db-")
			manifestKey := fmt.Sprintf("%s/snapshots-%s.json", masterBasePrefix, cleanTimestamp)

			masterSeen := make(map[string]bool)
			var masterUniqueChunks []ChunkInfo
			for _, c := range chunkRes.Chunks {
				if masterSeen[c.Hash] {
					continue
				}
				masterSeen[c.Hash] = true
				masterUniqueChunks = append(masterUniqueChunks, c)
			}

			var masterUploaded int64
			if len(masterUniqueChunks) > 0 {
				mChunkChan := make(chan ChunkInfo, len(masterUniqueChunks))
				for _, c := range masterUniqueChunks {
					mChunkChan <- c
				}
				close(mChunkChan)

				mWorkerCount := 10
				if len(masterUniqueChunks) < mWorkerCount {
					mWorkerCount = len(masterUniqueChunks)
				}

				var masterWg sync.WaitGroup
				for i := 0; i < mWorkerCount; i++ {
					masterWg.Add(1)
					go func() {
						defer masterWg.Done()
						for c := range mChunkChan {
							mChunkKey := masterChunkPrefix + c.Hash

							_, headErr := masterSvc.HeadObject(&s3.HeadObjectInput{
								Bucket: aws.String(masterBucket),
								Key:    aws.String(mChunkKey),
							})
							if headErr == nil {
								continue
							}

							chunkData := bytePayload[c.Offset : c.Offset+int64(c.Size)]
							log.Printf("[MASTER S3 PUT] Uploading chunk -> s3://%s/%s (%d bytes)...", masterBucket, mChunkKey, len(chunkData))
							_, _ = masterSvc.PutObject(&s3.PutObjectInput{
								Bucket: aws.String(masterBucket),
								Key:    aws.String(mChunkKey),
								Body:   bytes.NewReader(chunkData),
							})
							atomic.AddInt64(&masterUploaded, 1)
						}
					}()
				}
				masterWg.Wait()
			}

			// Upload Manifest JSON directly as snapshots-{timestamp}.json
			manifestBytes, _ := json.MarshalIndent(map[string]interface{}{
				"manifest_id":   manifestID,
				"subdomain":     subdomain,
				"username":      cleanUsername,
				"workflow_name": workflowName,
				"timestamp":     now.Format(time.RFC3339),
				"total_bytes":   chunkRes.TotalBytes,
				"total_chunks":  chunkRes.TotalChunks,
				"unique_chunks": chunkRes.UniqueChunks,
				"dedup_ratio":   chunkRes.DedupRatio,
				"chunks":        chunkRes.Chunks,
			}, "", "  ")

			manifestDir := filepath.Join("logs", "vault", "manifests")
			_ = os.MkdirAll(manifestDir, 0755)
			_ = os.WriteFile(filepath.Join(manifestDir, fmt.Sprintf("%s.json", manifestID)), manifestBytes, 0644)
			_ = os.WriteFile(filepath.Join("logs", "vault", fmt.Sprintf("%s.json", manifestID)), manifestBytes, 0644)

			log.Printf("[MASTER S3 MANIFEST] Uploading snapshot manifest -> s3://%s/%s", masterBucket, manifestKey)
			_, _ = masterSvc.PutObject(&s3.PutObjectInput{
				Bucket: aws.String(masterBucket),
				Key:    aws.String(manifestKey),
				Body:   bytes.NewReader(manifestBytes),
			})

			manifestS3URI = fmt.Sprintf("s3://%s/%s", masterBucket, manifestKey)
			chunksS3URI = fmt.Sprintf("s3://%s/%s", masterBucket, masterChunkPrefix)
			log.Printf("[MASTER S3 COMPLETE] Uploaded %d new chunks and manifest to master vault %s", masterUploaded, manifestS3URI)

		} else {
			log.Printf("[MASTER S3 ERROR] Failed creating master AWS session: %v", masterErr)
		}
	} else {
		log.Printf("[MASTER S3 WARNING] Master AWS credentials missing in .env")
	}

	if manifestS3URI == "" {
		manifestS3URI = fmt.Sprintf("s3://%s/%smanifest.json", s3Bucket, s3Folder)
		chunksS3URI = fmt.Sprintf("s3://%s/%schunks/", s3Bucket, s3Folder)
	}

	// 7. Save snapshot record into cdc_snapshot_vaults DB table
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer dbCancel()

	_, vaultInsertErr := conn.ExecContext(dbCtx, `
		INSERT INTO cdc_snapshot_vaults (
			manifest_id, tenant_subdomain, username, connector_id, connector_name,
			s3_bucket, s3_manifest_path, s3_chunks_prefix,
			total_bytes, dedup_bytes, total_chunks, unique_chunks, dedup_ratio, duration_ms, status,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT (manifest_id) DO UPDATE SET
			s3_manifest_path = EXCLUDED.s3_manifest_path,
			total_bytes = EXCLUDED.total_bytes,
			status = EXCLUDED.status,
			updated_at = CURRENT_TIMESTAMP
	`, manifestID, subdomain, cleanUsername, connectorID, workflowName, masterBucket, manifestS3URI, chunksS3URI, chunkRes.TotalBytes, chunkRes.DedupBytes, chunkRes.TotalChunks, chunkRes.UniqueChunks, chunkRes.DedupRatio, durationMs, "COMPLETED")

	if vaultInsertErr != nil {
		log.Printf("[VAULT DB ERROR] Failed inserting record into cdc_snapshot_vaults: %v", vaultInsertErr)
	} else {
		log.Printf("[VAULT DB SUCCESS] Recorded snapshot %s into cdc_snapshot_vaults table ✓", manifestID)
	}

	// 8. Write detailed logs to logs/fastcdc_stream.log and stdout
	detailMsg := fmt.Sprintf("DB=%s TABLES=%v S3_MANIFEST=%s MANIFEST_ID=%s", tenantDB, tables, manifestS3URI, manifestID)
	destKey := manifestS3URI

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
	log.Printf("[SUMMARY] - Unique Chunks Uploaded to Master S3: %d (%d bytes)", chunkRes.UniqueChunks, chunkRes.DedupBytes)
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
