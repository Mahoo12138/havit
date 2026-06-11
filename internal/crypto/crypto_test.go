package crypto

import (
	"testing"
)

func TestNewRejectsEmptySecret(t *testing.T) {
	_, err := New("")
	if err == nil {
		t.Fatal("expected error for empty secret")
	}
}

func TestEncryptDecryptRoundtrip(t *testing.T) {
	c, err := New("test-secret-key-12345")
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	plaintext := "my-super-secret-password!"
	encrypted, err := c.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("Encrypt: %v", err)
	}
	if encrypted == "" {
		t.Fatal("encrypted output should not be empty")
	}
	if encrypted == plaintext {
		t.Fatal("encrypted output should differ from plaintext")
	}

	decrypted, err := c.Decrypt(encrypted)
	if err != nil {
		t.Fatalf("Decrypt: %v", err)
	}
	if decrypted != plaintext {
		t.Fatalf("roundtrip: expected %q, got %q", plaintext, decrypted)
	}
}

func TestEncryptProducesUniqueOutput(t *testing.T) {
	c, err := New("test-secret-key-12345")
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	plaintext := "same-text"
	a, _ := c.Encrypt(plaintext)
	b, _ := c.Encrypt(plaintext)
	if a == b {
		t.Fatal("encrypt should produce unique output each time (nonce)")
	}
}

func TestDecryptInvalidBase64(t *testing.T) {
	c, err := New("test-secret-key-12345")
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	_, err = c.Decrypt("not-valid-base64!!!")
	if err == nil {
		t.Fatal("expected error for invalid base64")
	}
}

func TestDecryptTruncatedCiphertext(t *testing.T) {
	c, err := New("test-secret-key-12345")
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	_, err = c.Decrypt("AAAA")
	if err == nil {
		t.Fatal("expected error for truncated ciphertext")
	}
}

func TestEmptyInput(t *testing.T) {
	c, err := New("test-secret-key-12345")
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	enc, err := c.Encrypt("")
	if err != nil {
		t.Fatalf("Encrypt empty: %v", err)
	}
	if enc != "" {
		t.Fatal("Encrypt('') should return empty string")
	}

	dec, err := c.Decrypt("")
	if err != nil {
		t.Fatalf("Decrypt empty: %v", err)
	}
	if dec != "" {
		t.Fatal("Decrypt('') should return empty string")
	}
}

func TestDifferentKeysProduceDifferentOutput(t *testing.T) {
	c1, _ := New("key-one")
	c2, _ := New("key-two")

	plaintext := "hello world"
	e1, _ := c1.Encrypt(plaintext)
	e2, _ := c2.Encrypt(plaintext)
	if e1 == e2 {
		t.Fatal("different keys should produce different ciphertext")
	}
}

func TestDifferentKeysCannotDecrypt(t *testing.T) {
	c1, _ := New("key-one")
	c2, _ := New("key-two")

	encrypted, _ := c1.Encrypt("secret")
	_, err := c2.Decrypt(encrypted)
	if err == nil {
		t.Fatal("expected error when decrypting with different key")
	}
}

func TestLongPlaintext(t *testing.T) {
	c, err := New("test-secret-key-12345")
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	plaintext := string(make([]byte, 1024*1024)) // 1 MB
	encrypted, err := c.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("Encrypt large: %v", err)
	}

	decrypted, err := c.Decrypt(encrypted)
	if err != nil {
		t.Fatalf("Decrypt large: %v", err)
	}
	if decrypted != plaintext {
		t.Fatal("large plaintext roundtrip failed")
	}
}
