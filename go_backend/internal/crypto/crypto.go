package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"os"
)

// getEncryptionKey derives a 32-byte AES-256 key via SHA-256
// from the APP_ENCRYPTION_KEY or APP_KEY environment variables.
func getEncryptionKey() []byte {
	envKey := os.Getenv("APP_ENCRYPTION_KEY")
	if envKey == "" {
		envKey = os.Getenv("APP_KEY")
	}
	if envKey == "" {
		envKey = "chunkflow_tenant_secure_master_key"
	}
	hash := sha256.Sum256([]byte(envKey))
	return hash[:]
}

// Encrypt encrypts a plaintext string using AES-256-GCM.
// Returns a base64 encoded string containing [nonce + ciphertext].
func Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	key := getEncryptionKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("crypto: cipher creation failed: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("crypto: GCM creation failed: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("crypto: nonce generation failed: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts a base64-encoded ciphertext (containing [nonce + ciphertext]) using AES-256-GCM.
// If the input is empty or invalid base64, returns the input as-is or error.
func Decrypt(encoded string) (string, error) {
	if encoded == "" {
		return "", nil
	}

	ciphertext, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		// Not base64 encoded or plaintext legacy data
		return encoded, nil
	}

	key := getEncryptionKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("crypto: cipher creation failed: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("crypto: GCM creation failed: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		// Too short to be encrypted ciphertext, return as-is
		return encoded, nil
	}

	nonce, actualCiphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, actualCiphertext, nil)
	if err != nil {
		// Decryption failed (e.g. legacy plaintext string stored in DB)
		return encoded, nil
	}

	return string(plaintext), nil
}
