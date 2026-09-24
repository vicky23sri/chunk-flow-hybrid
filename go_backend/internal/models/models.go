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

// Node represents a node definition from the nodes table.
type Node struct {
	ID           string                   `json:"id"`
	NodeKey      string                   `json:"node_key"`
	Name         string                   `json:"name"`
	Category     string                   `json:"category"`
	SubType      string                   `json:"sub_type"`
	Color        map[string]interface{}   `json:"color"`
	FieldsSchema []map[string]interface{} `json:"fields_schema"`
	IsActive     bool                     `json:"is_active"`
	SortOrder    int                      `json:"sort_order"`
}

// CanvasNode represents a node dropped onto a canvas (from canvas_nodes).
type CanvasNode struct {
	ID               string                 `json:"id"`
	ConnectorID      string                 `json:"connector_id"`
	NodeID           string                 `json:"node_id"`
	ElementID        string                 `json:"element_id"`
	Label            string                 `json:"label"`
	PositionX        float64                `json:"position_x"`
	PositionY        float64                `json:"position_y"`
	EncryptedConfig  string                 `json:"encrypted_config,omitempty"`
	ConfigData       map[string]interface{} `json:"config_data,omitempty"`
	IsVerified       bool                   `json:"is_verified"`
	CreatedAt        string                 `json:"created_at,omitempty"`
	UpdatedAt        string                 `json:"updated_at,omitempty"`

	// Node Details
	Node *Node `json:"node,omitempty"`
}

// CanvasConnection represents a wire between node instances (from canvas_connections).
type CanvasConnection struct {
	ID                  string  `json:"id"`
	ConnectorID         string  `json:"connector_id"`
	SourceCanvasNodeID  string  `json:"source_canvas_node_id"`
	TargetCanvasNodeID  string  `json:"target_canvas_node_id"`
	SourceHandle        *string `json:"source_handle,omitempty"`
	TargetHandle        *string `json:"target_handle,omitempty"`
	CreatedAt           string  `json:"created_at,omitempty"`
}

// SaveCanvasRequest is the payload for saving an entire canvas.
type SaveCanvasRequest struct {
	Subdomain   string             `json:"subdomain"`
	ConnectorID string             `json:"connector_id"`
	Nodes       []CanvasNode       `json:"nodes"`
	Connections []CanvasConnection `json:"connections"`
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

// TestS3ConnectionRequest is the request payload for POST /test-s3-connection.
type TestS3ConnectionRequest struct {
	AccessKeyID     string `json:"accessKeyId"`
	SecretAccessKey string `json:"secretAccessKey"`
	Region          string `json:"region"`
	BucketName      string `json:"bucketName"`
}
