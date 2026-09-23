package logger

import (
	"fmt"
	"log"
	"os"
	"time"
)

// WriteDBLog logs all PostgreSQL connection test events to logs/db_connections.log and stdout.
func WriteDBLog(status, host, port, dbName, username string, latencyMs int64, errDetail string) {
	_ = os.MkdirAll("logs", 0755)
	logFile, err := os.OpenFile("logs/db_connections.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("[LOG_ERR] Failed to open db_connections.log: %v", err)
		return
	}
	defer logFile.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	var entry string
	if status == "SUCCESS" {
		entry = fmt.Sprintf("[%s] [DB_CONN_TEST] STATUS=SUCCESS HOST=%s PORT=%s DB=%s USER=%s LATENCY=%dms\n",
			timestamp, host, port, dbName, username, latencyMs)
	} else {
		entry = fmt.Sprintf("[%s] [DB_CONN_TEST] STATUS=FAILED  HOST=%s PORT=%s DB=%s USER=%s ERROR=\"%s\"\n",
			timestamp, host, port, dbName, username, errDetail)
	}

	logFile.WriteString(entry)
	log.Print(entry)
}

// WriteTenantConfigLog logs tenant configuration saves to logs/tenant_configs.log.
func WriteTenantConfigLog(subdomain string, postgres, s3 map[string]interface{}) {
	_ = os.MkdirAll("logs", 0755)
	logFile, err := os.OpenFile("logs/tenant_configs.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("[LOG_ERR] Failed to open tenant_configs.log: %v", err)
		return
	}
	defer logFile.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	pgDb := ""
	s3Bucket := ""
	if postgres != nil && postgres["database"] != nil {
		pgDb = fmt.Sprintf("%v", postgres["database"])
	}
	if s3 != nil && s3["bucketName"] != nil {
		s3Bucket = fmt.Sprintf("%v", s3["bucketName"])
	}

	entry := fmt.Sprintf("[%s] [TENANT_CONFIG_SAVE] SUBDOMAIN=%s PG_DB=\"%s\" S3_BUCKET=\"%s\"\n",
		timestamp, subdomain, pgDb, s3Bucket)

	logFile.WriteString(entry)
	log.Print(entry)
}

// WriteTenantConfigDetailLog logs detailed INSERT/UPDATE operations for tenant configurations.
func WriteTenantConfigDetailLog(opAction, subdomain, configType, recordID, detail string) {
	_ = os.MkdirAll("logs", 0755)
	logFile, err := os.OpenFile("logs/tenant_configs.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("[LOG_ERR] Failed to open tenant_configs.log: %v", err)
		return
	}
	defer logFile.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	entry := fmt.Sprintf("[%s] [TENANT_CONFIG_%s] TYPE=\"%s\" SUBDOMAIN=%s ID=%s DETAILS=\"%s\"\n",
		timestamp, opAction, configType, subdomain, recordID, detail)

	logFile.WriteString(entry)
	log.Print(entry)
}

// WriteEncryptionAuditLog logs step-by-step raw JSON, AES-256 base64 ciphertext, and decrypted plaintext JSON to logs/tenant_configs.log
func WriteEncryptionAuditLog(subdomain, action, configID, connectorID, rawSourceJSON, encSourceBase64, rawDestJSON, encDestBase64 string) {
	_ = os.MkdirAll("logs", 0755)
	logFile, err := os.OpenFile("logs/tenant_configs.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("[LOG_ERR] Failed to open tenant_configs.log: %v", err)
		return
	}
	defer logFile.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	var entry string
	if action == "SAVE_ENCRYPT" {
		entry = fmt.Sprintf("[%s] [TENANT_CONFIG_ENCRYPT_SAVE] SUBDOMAIN=%s CONNECTOR_ID=%s CONFIG_ID=%s\n  - RAW_SOURCE_JSON: %s\n  - ENCRYPTED_SOURCE_BASE64: %s\n  - RAW_DEST_JSON: %s\n  - ENCRYPTED_DEST_BASE64: %s\n",
			timestamp, subdomain, connectorID, configID, rawSourceJSON, encSourceBase64, rawDestJSON, encDestBase64)
	} else {
		entry = fmt.Sprintf("[%s] [TENANT_CONFIG_FETCH_DECRYPT] SUBDOMAIN=%s CONNECTOR_ID=%s CONFIG_ID=%s\n  - READ_ENCRYPTED_SOURCE_BASE64: %s\n  - DECRYPTED_SOURCE_JSON: %s\n  - READ_ENCRYPTED_DEST_BASE64: %s\n  - DECRYPTED_DEST_JSON: %s\n",
			timestamp, subdomain, connectorID, configID, encSourceBase64, rawSourceJSON, encDestBase64, rawDestJSON)
	}

	logFile.WriteString(entry)
	log.Print(entry)
}


// WriteCryptoLog logs crypto events, key mismatches, and failures to logs/crypto.log and stdout.
func WriteCryptoLog(operation, status, errDetail string) {
	_ = os.MkdirAll("logs", 0755)
	logFile, err := os.OpenFile("logs/crypto.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("[LOG_ERR] Failed to open crypto.log: %v", err)
		return
	}
	defer logFile.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	entry := fmt.Sprintf("[%s] [CRYPTO_%s] OP=%s DETAILS=\"%s\"\n", timestamp, status, operation, errDetail)

	logFile.WriteString(entry)
	log.Print(entry)
}

// WriteCronExecutionLog logs background cron execution events to logs/cron_executions.log and stdout.
func WriteCronExecutionLog(subdomain, cronExp, dbName, statusMessage string) {
	_ = os.MkdirAll("logs", 0755)
	logFile, err := os.OpenFile("logs/cron_executions.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("[LOG_ERR] Failed to open cron_executions.log: %v", err)
		return
	}
	defer logFile.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	entry := fmt.Sprintf("[%s] [CRON_WORKER] SUBDOMAIN=%s SCHEDULE=\"%s\" DB=\"%s\" MSG=\"%s\"\n",
		timestamp, subdomain, cronExp, dbName, statusMessage)

	logFile.WriteString(entry)
	log.Print(entry)
}

// WriteFastCDCLog logs FastCDC streaming execution metrics to logs/fastcdc_stream.log and stdout.
func WriteFastCDCLog(subdomain, workflowName string, totalBytes int64, totalChunks, uniqueChunks int, dedupRatio float64, durationMs int64, destKey, detail string) {
	_ = os.MkdirAll("logs", 0755)
	logFile, err := os.OpenFile("logs/fastcdc_stream.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Printf("[LOG_ERR] Failed to open fastcdc_stream.log: %v", err)
		return
	}
	defer logFile.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")

	entry := fmt.Sprintf("[%s] [FASTCDC_STREAM] SUBDOMAIN=%s WORKFLOW=\"%s\" TOTAL_BYTES=%d TOTAL_CHUNKS=%d UNIQUE_CHUNKS=%d DEDUP_RATIO=%.2f%% DURATION=%dms DEST=\"%s\" DETAILS=\"%s\"\n",
		timestamp, subdomain, workflowName, totalBytes, totalChunks, uniqueChunks, dedupRatio, durationMs, destKey, detail)

	logFile.WriteString(entry)
	log.Print(entry)
}

