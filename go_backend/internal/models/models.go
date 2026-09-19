package models

// TableInfo represents a PostgreSQL table with size and row statistics.
type TableInfo struct {
	Name      string `json:"name"`
	Rows      int64  `json:"rows"`
	Size      string `json:"size"`
	SizeBytes int64  `json:"size_bytes"`
}

// SourceConfiguration represents a saved PostgreSQL source node config
// stored in the tenant's source_configurations table.
type SourceConfiguration struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Host           string  `json:"host"`
	Port           string  `json:"port"`
	DatabaseName   string  `json:"database_name"`
	Username       string  `json:"username"`
	UseSSL         bool    `json:"use_ssl"`
	BackupSchedule *string `json:"backup_schedule"`
	RetentionDays  *int    `json:"retention_days"`
	IsVerified     bool    `json:"is_verified"`
}

// DestinationConfiguration represents a saved Amazon S3 destination node config
// stored in the tenant's destination_configurations table.
type DestinationConfiguration struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	BucketName   string  `json:"bucket_name"`
	Region       string  `json:"region"`
	AccessKeyID  string  `json:"access_key_id"`
	FolderPath   *string `json:"folder_path"`
	Encryption   string  `json:"encryption"`
	StorageClass string  `json:"storage_class"`
	IsVerified   bool    `json:"is_verified"`
}

// TestDBConnectionRequest is the request payload for POST /test-db-connection.
type TestDBConnectionRequest struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Database string `json:"database"`
	Username string `json:"username"`
	Password string `json:"password"`
	UseSSL   bool   `json:"useSSL"`
}

// TenantConfigRequest is the request payload for POST /tenant-config.
type TenantConfigRequest struct {
	Subdomain string                 `json:"subdomain"`
	Postgres  map[string]interface{} `json:"postgres"`
	S3        map[string]interface{} `json:"s3"`
}
