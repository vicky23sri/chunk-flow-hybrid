package cdc

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var vaultMutex sync.Mutex

// SimpleChunk matches chunk-flow manifest chunk structure.
type SimpleChunk struct {
	ChunkHash string `json:"ChunkHash"`
}

// DatabaseManifest matches chunk-flow manifest database structure.
type DatabaseManifest struct {
	Name   string        `json:"Name"`
	Chunks []SimpleChunk `json:"Chunks"`
}

// SnapshotManifest represents the runtime metadata for a CDC snapshot.
type SnapshotManifest struct {
	ID           string      `json:"id"`
	Subdomain    string      `json:"subdomain"`
	WorkflowName string      `json:"workflow_name"`
	Timestamp    string      `json:"timestamp"`
	TotalBytes   int64       `json:"total_bytes"`
	TotalChunks  int         `json:"total_chunks"`
	UniqueChunks int         `json:"unique_chunks"`
	DedupRatio   float64     `json:"dedup_ratio"`
	Chunks       []ChunkInfo `json:"chunks"`
}

// WriteManifestToFile writes the manifest details for a snapshot as JSON matching original chunk-flow structure.
func WriteManifestToFile(manifest *SnapshotManifest, manifestID string) error {
	vaultMutex.Lock()
	defer vaultMutex.Unlock()

	var chunks []SimpleChunk
	for _, c := range manifest.Chunks {
		chunks = append(chunks, SimpleChunk{
			ChunkHash: c.Hash,
		})
	}
	if chunks == nil {
		chunks = []SimpleChunk{}
	}

	dbManifest := &DatabaseManifest{
		Name:   manifestID,
		Chunks: chunks,
	}

	dir := filepath.Join("logs", "vault", "manifests")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	manifestPath := filepath.Join(dir, fmt.Sprintf("%s.json", manifestID))
	f, err := os.Create(manifestPath)
	if err != nil {
		return err
	}

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(dbManifest); err != nil {
		f.Close()
		return err
	}
	f.Close()

	// Also write to manifest/<manifestID>.json matching original chunk-flow root format
	mDir := "manifest"
	_ = os.MkdirAll(mDir, 0755)
	if mFile, err2 := os.Create(filepath.Join(mDir, fmt.Sprintf("%s.json", manifestID))); err2 == nil {
		mEnc := json.NewEncoder(mFile)
		mEnc.SetIndent("", "  ")
		_ = mEnc.Encode(dbManifest)
		mFile.Close()
	}

	return nil
}

// WriteMasterCSV appends a snapshot timestamp and manifest ID record to master.csv.
func WriteMasterCSV(timeStamp *time.Time, manifestID string) error {
	vaultMutex.Lock()
	defer vaultMutex.Unlock()

	vaultDir := filepath.Join("logs", "vault")
	if err := os.MkdirAll(vaultDir, 0755); err != nil {
		return err
	}

	masterPath := filepath.Join(vaultDir, "master.csv")
	_, err := os.Stat(masterPath)
	fileExists := err == nil

	f, err := os.OpenFile(masterPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	if !fileExists {
		if _, err := f.WriteString("timestamp,id\n"); err != nil {
			return err
		}
	}

	line := fmt.Sprintf("%s,%s\n", timeStamp.UTC().Format(time.RFC3339), manifestID)
	_, err = f.WriteString(line)
	return err
}

// ReadSize retrieves cumulative size in bytes from size.json.
func ReadSize() (int64, error) {
	vaultMutex.Lock()
	defer vaultMutex.Unlock()

	sizePath := filepath.Join("logs", "vault", "size.json")
	if _, err := os.Stat(sizePath); os.IsNotExist(err) {
		return 0, nil
	}

	f, err := os.Open(sizePath)
	if err != nil {
		return 0, err
	}
	defer f.Close()

	var data struct {
		Size int64 `json:"size"`
	}

	if err := json.NewDecoder(f).Decode(&data); err != nil {
		return 0, err
	}

	return data.Size, nil
}

// SaveSize atomically writes updated cumulative size to size.json.
func SaveSize(size int64) error {
	vaultMutex.Lock()
	defer vaultMutex.Unlock()

	vaultDir := filepath.Join("logs", "vault")
	if err := os.MkdirAll(vaultDir, 0755); err != nil {
		return err
	}

	sizePath := filepath.Join(vaultDir, "size.json")
	tmpPath := sizePath + ".tmp"

	f, err := os.Create(tmpPath)
	if err != nil {
		return err
	}

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")

	if err := enc.Encode(struct {
		Size int64 `json:"size"`
	}{
		Size: size,
	}); err != nil {
		f.Close()
		return err
	}

	if err := f.Close(); err != nil {
		return err
	}

	return os.Rename(tmpPath, sizePath)
}
