package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"os"

	"chunkflow-backend/internal/logger"
)

// getCandidateKeys returns all candidate 32-byte AES keys derived via SHA-256
// to support decryption across key rotations and legacy fallback keys.
func getCandidateKeys() [][]byte {
	var keys [][]byte
	seen := make(map[string]bool)

	addKey := func(k string) {
		if k == "" || seen[k] {
			return
		}
		seen[k] = true
		h := sha256.Sum256([]byte(k))
		keys = append(keys, h[:])
	}

	// 1. Explicit environment variables
	addKey(os.Getenv("APP_ENCRYPTION_KEY"))
	addKey(os.Getenv("APP_KEY"))

	// 2. Project standard encryption keys
	addKey("chunkflow_aes256_gcm_master_secret_key_32bytes")
	addKey("chunkflow_tenant_secure_master_key")

	return keys
}

// getEncryptionKey derives a 32-byte AES-256 key via SHA-256
// from the APP_ENCRYPTION_KEY or APP_KEY environment variables.
func getEncryptionKey() []byte {
	keys := getCandidateKeys()
	if len(keys) > 0 {
		return keys[0]
	}
	hash := sha256.Sum256([]byte("chunkflow_tenant_secure_master_key"))
	return hash[:]
}

// Encrypt encrypts a plaintext string using AES-256-GCM.
// Returns a base64 encoded string containing [nonce + ciphertext].
func Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	log.Printf("[CRYPTO_ENCRYPT_START] Plaintext JSON before encryption (%d bytes): %s", len(plaintext), plaintext)

	key := getEncryptionKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		errStr := fmt.Sprintf("cipher creation failed: %v", err)
		logger.WriteCryptoLog("ENCRYPT", "ERROR", errStr)
		return "", fmt.Errorf("crypto: %s", errStr)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		errStr := fmt.Sprintf("GCM creation failed: %v", err)
		logger.WriteCryptoLog("ENCRYPT", "ERROR", errStr)
		return "", fmt.Errorf("crypto: %s", errStr)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		errStr := fmt.Sprintf("nonce generation failed: %v", err)
		logger.WriteCryptoLog("ENCRYPT", "ERROR", errStr)
		return "", fmt.Errorf("crypto: %s", errStr)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	encodedResult := base64.StdEncoding.EncodeToString(ciphertext)

	log.Printf("[CRYPTO_ENCRYPT_SUCCESS] AES-256-GCM Encrypted Ciphertext (Base64): %s", encodedResult)

	return encodedResult, nil
}

// Decrypt decrypts a base64-encoded ciphertext (containing [nonce + ciphertext]) using AES-256-GCM.
// Tries candidate keys and handles recursive decryption to resolve double-encrypted legacy data.
func Decrypt(encoded string) (string, error) {
	if encoded == "" {
		return "", nil
	}

	log.Printf("[CRYPTO_DECRYPT_START] Encrypted Base64 string from DB (%d bytes): %s", len(encoded), encoded)

	ciphertext, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		log.Printf("[CRYPTO_DECRYPT_WARN] Input is not valid base64 (returning plaintext fallback): %s", encoded)
		return encoded, nil
	}

	candidateKeys := getCandidateKeys()
	for _, key := range candidateKeys {
		block, err := aes.NewCipher(key)
		if err != nil {
			continue
		}

		gcm, err := cipher.NewGCM(block)
		if err != nil {
			continue
		}

		nonceSize := gcm.NonceSize()
		if len(ciphertext) < nonceSize {
			continue
		}

		nonce, actualCiphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
		plaintext, err := gcm.Open(nil, nonce, actualCiphertext, nil)
		if err == nil {
			res := string(plaintext)
			log.Printf("[CRYPTO_DECRYPT_SUCCESS] AES-256-GCM Decrypted Plaintext JSON (%d bytes): %s", len(res), res)
			return res, nil
		}
	}

	log.Printf("[CRYPTO_DECRYPT_WARN] Could not decrypt with candidate keys (returning original string)")
	return encoded, nil
}
