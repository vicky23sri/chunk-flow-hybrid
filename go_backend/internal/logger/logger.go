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
