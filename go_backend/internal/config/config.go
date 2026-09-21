package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all backend configuration parameters loaded from environment or defaults.
type Config struct {
	Port             string
	GinMode          string
	AppEnv           string
	DBHost           string
	DBPort           string
	DBUser           string
	DBPassword       string
	DBName           string
	DBSSLMode        string
	AppEncryptionKey string
	AWSRegion        string
	S3BucketName     string
}

// LoadConfig reads .env if present and populates the Config struct with fallbacks.
func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Notice: No .env file loaded — using system environment variables and defaults.")
	}

	return &Config{
		Port:             getEnv("PORT", "8080"),
		GinMode:          getEnv("GIN_MODE", "release"),
		AppEnv:           getEnv("APP_ENV", "development"),
		DBHost:           getEnvFirst([]string{"DB_HOST"}, "127.0.0.1"),
		DBPort:           getEnv("DB_PORT", "5432"),
		DBUser:           getEnvFirst([]string{"DB_USER", "DB_USERNAME"}, "postgres"),
		DBPassword:       getEnv("DB_PASSWORD", ""),
		DBName:           getEnvFirst([]string{"DB_NAME", "DB_DATABASE"}, "chunk_flow_multi_tenancy"),
		DBSSLMode:        getEnv("DB_SSLMODE", "disable"),
		AppEncryptionKey: getEnvFirst([]string{"APP_ENCRYPTION_KEY", "APP_KEY"}, "chunkflow_tenant_secure_master_key"),
		AWSRegion:        getEnv("AWS_REGION", "us-west-2"),
		S3BucketName:     getEnv("S3_BUCKET_NAME", "chunkflow-raw"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvFirst(keys []string, fallback string) string {
	for _, k := range keys {
		if val := os.Getenv(k); val != "" {
			return val
		}
	}
	return fallback
}
