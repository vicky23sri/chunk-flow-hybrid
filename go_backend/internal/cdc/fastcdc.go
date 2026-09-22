package cdc

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"io"
	"log"

	chunkers "github.com/PlakarKorp/go-cdc-chunkers"
	"github.com/PlakarKorp/go-cdc-chunkers/chunkers/fastcdc"
)

// Default FastCDC parameters matching the chunk-flow architecture
const (
	DefaultMinSize    = 8 * 1024  // 8 KB
	DefaultMaxSize    = 64 * 1024 // 64 KB
	DefaultNormalSize = 16 * 1024 // 16 KB
)

// ChunkInfo represents metadata for a single FastCDC sliced chunk.
type ChunkInfo struct {
	Index    int    `json:"index"`
	Offset   int64  `json:"offset"`
	Size     int    `json:"size"`
	Hash     string `json:"hash"`
	IsUnique bool   `json:"is_unique"`
}

// ChunkResult contains the summary metrics of a FastCDC chunking process.
type ChunkResult struct {
	TotalBytes   int64       `json:"total_bytes"`
	DedupBytes   int64       `json:"dedup_bytes"`
	TotalChunks  int         `json:"total_chunks"`
	UniqueChunks int         `json:"unique_chunks"`
	DedupRatio   float64     `json:"dedup_ratio_percent"`
	Chunks       []ChunkInfo `json:"chunks"`
}


func newFastCDC() chunkers.ChunkerImplementation {
	return &fastcdc.FastCDC{}
}

// InitCDC creates a FastCDC chunker instance for any io.Reader.
func InitCDC(reader io.Reader, minSize, maxSize, normalSize int) *chunkers.Chunker {
	if minSize <= 0 {
		minSize = DefaultMinSize
	}
	if maxSize <= 0 {
		maxSize = DefaultMaxSize
	}
	if normalSize <= 0 {
		normalSize = DefaultNormalSize
	}

	chunkers.Register("fastcdc", newFastCDC)

	log.Printf("[CDC] Initializing FastCDC chunker (minSize: %d, maxSize: %d, normalSize: %d)...", minSize, maxSize, normalSize)

	chunker, err := chunkers.NewChunker("fastcdc", reader, &chunkers.ChunkerOpts{
		MinSize:    minSize,
		MaxSize:    maxSize,
		NormalSize: normalSize,
	})

	if err != nil && err != io.EOF {
		log.Println("[CDC ERROR] Failed to create chunker:", err)
	}

	return chunker
}

// SliceBufferWithFastCDC processes raw data bytes through go-cdc-chunkers/fastcdc
// and calculates SHA-256 hashes, deduplication metrics, and chunk bounds.
func SliceBufferWithFastCDC(data []byte) *ChunkResult {
	if len(data) == 0 {
		return &ChunkResult{
			TotalBytes:   0,
			DedupBytes:   0,
			TotalChunks:  0,
			UniqueChunks: 0,
			DedupRatio:   0.0,
			Chunks:       []ChunkInfo{},
		}
	}

	reader := bytes.NewReader(data)
	chunker := InitCDC(reader, DefaultMinSize, DefaultMaxSize, DefaultNormalSize)

	totalLen := int64(len(data))
	var offset int64 = 0
	var chunks []ChunkInfo
	seenHashes := make(map[string]bool)

	totalChunkCount := 0
	uniqueChunkCount := 0
	var dedupBytes int64 = 0

	for {
		chunk, err := chunker.Next()
		if err != nil && err != io.EOF {
			log.Printf("[CDC ERROR] FastCDC chunker next error: %v", err)
			break
		}

		if len(chunk) > 0 {
			totalChunkCount++
			chunkSize := len(chunk)

			hashBytes := sha256.Sum256(chunk)
			hashStr := fmt.Sprintf("%x", hashBytes)

			isUnique := !seenHashes[hashStr]
			if isUnique {
				seenHashes[hashStr] = true
				uniqueChunkCount++
				dedupBytes += int64(chunkSize)
			}

			chunks = append(chunks, ChunkInfo{
				Index:    totalChunkCount - 1,
				Offset:   offset,
				Size:     chunkSize,
				Hash:     hashStr,
				IsUnique: isUnique,
			})

			log.Printf("[CDC CHUNK #%d] Offset: %d | Size: %d bytes | SHA-256: %s | Unique: %v",
				totalChunkCount, offset, chunkSize, hashStr, isUnique)

			offset += int64(chunkSize)
		}

		if err == io.EOF {
			break
		}
	}

	var dedupRatio float64 = 0.0
	if totalLen > 0 {
		dedupRatio = (1.0 - (float64(dedupBytes) / float64(totalLen))) * 100.0
		if dedupRatio < 0 {
			dedupRatio = 0.0
		}
	}

	return &ChunkResult{
		TotalBytes:   totalLen,
		DedupBytes:   dedupBytes,
		TotalChunks:  totalChunkCount,
		UniqueChunks: uniqueChunkCount,
		DedupRatio:   dedupRatio,
		Chunks:       chunks,
	}
}
