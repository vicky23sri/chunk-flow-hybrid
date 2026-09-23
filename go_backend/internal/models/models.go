package models

// TableInfo represents a PostgreSQL table with size and row statistics.
type TableInfo struct {
	Name      string `json:"name"`
	Rows      int64  `json:"rows"`
	Size      string `json:"size"`
	SizeBytes int64  `json:"size_bytes"`
}

type Connector struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Status       string `json:"status"`
	CreatedAt    string `json:"created_at,omitempty"`
	UpdatedAt    string `json:"updated_at,omitempty"`
	IsConfigured bool   `json:"is_configured"`
}

// Color represents a visual UI theme color from colors table.
type Color struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	HexCode   string `json:"hex_code"`
	BgClass   string `json:"bg_class"`
	TextClass string `json:"text_class"`
}

// ConfigurationType represents a node definition from configuration_types table.
type ConfigurationType struct {
	ID           string                   `json:"id"`
	NodeKey      string                   `json:"node_key"`
	Name         string                   `json:"name"`
	Category     string                   `json:"category"`
	SubType      string                   `json:"sub_type"`
	ColorID      *string                  `json:"color_id,omitempty"`
	Color        *Color                   `json:"color,omitempty"`
	FieldsSchema []map[string]interface{} `json:"fields_schema"`
	IsActive     bool                     `json:"is_active"`
	SortOrder    int                      `json:"sort_order"`
}

// Configuration represents a pipeline configuration record from configurations table.
type Configuration struct {
	ID                       string                 `json:"id"`
	ConnectorID              *string                `json:"connector_id,omitempty"`
	SourceTypeID             *string                `json:"source_type_id,omitempty"`
	DestinationTypeID        *string                `json:"destination_type_id,omitempty"`
	SourceType               *ConfigurationType     `json:"source_type,omitempty"`
	DestinationType          *ConfigurationType     `json:"destination_type,omitempty"`
	Name                     string                 `json:"name"`
	SourceEncryptedData      string                 `json:"source_encrypted_data,omitempty"`
	DestinationEncryptedData string                 `json:"destination_encrypted_data,omitempty"`
	SourceData               map[string]interface{} `json:"source_data,omitempty"`
	DestinationData          map[string]interface{} `json:"destination_data,omitempty"`
	IsVerified               bool                   `json:"is_verified"`
	CreatedAt                string                 `json:"created_at,omitempty"`
	UpdatedAt                string                 `json:"updated_at,omitempty"`
}

// SourceConfiguration represents backwards-compatible PostgreSQL source node config
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

// DestinationConfiguration represents backwards-compatible S3 destination node config
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
	Subdomain                string                 `json:"subdomain"`
	ConnectorID              string                 `json:"connector_id,omitempty"`
	Name                     string                 `json:"name,omitempty"`
	SourceNodeKey            string                 `json:"source_node_key,omitempty"`
	DestinationNodeKey       string                 `json:"destination_node_key,omitempty"`
	Postgres                 map[string]interface{} `json:"postgres"`
	S3                       map[string]interface{} `json:"s3"`
	SourceData               map[string]interface{} `json:"source_data,omitempty"`
	DestinationData          map[string]interface{} `json:"destination_data,omitempty"`
}
