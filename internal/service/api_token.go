package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/oklog/ulid/v2"
)

const patPrefix = "hv_pat_"

// APIToken represents a stored token record (never includes plaintext).
type APIToken struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	ExpiresAt  *int64 `json:"expires_at,omitempty"`
	LastUsedAt *int64 `json:"last_used_at,omitempty"`
	CreatedAt  int64  `json:"created_at"`
}

// APITokenCreated is returned only on creation, carrying the one-time plaintext.
type APITokenCreated struct {
	APIToken
	PlainText string `json:"plain_token"`
}

type APITokenService struct {
	db *sql.DB
}

func NewAPITokenService(db *sql.DB) *APITokenService {
	return &APITokenService{db: db}
}

// Create generates a new PAT, stores its SHA-256 hash, and returns the plaintext once.
func (s *APITokenService) Create(ctx context.Context, userID, name string, expiresAt *int64) (*APITokenCreated, error) {
	if name == "" {
		return nil, errors.New("token name is required")
	}

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}
	secret := hex.EncodeToString(raw)
	plainText := patPrefix + secret
	hash := hashToken(secret)

	id := ulid.Make().String()
	now := time.Now().Unix()

	if _, err := s.db.ExecContext(ctx,
		`INSERT INTO api_tokens (id, user_id, name, token_hash, expires_at, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		id, userID, name, hash, expiresAt, now,
	); err != nil {
		return nil, fmt.Errorf("insert token: %w", err)
	}

	return &APITokenCreated{
		APIToken: APIToken{
			ID:        id,
			UserID:    userID,
			Name:      name,
			ExpiresAt: expiresAt,
			CreatedAt: now,
		},
		PlainText: plainText,
	}, nil
}

// List returns all tokens for a user (without hashes).
func (s *APITokenService) List(ctx context.Context, userID string) ([]*APIToken, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, user_id, name, expires_at, last_used_at, created_at
		 FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []*APIToken
	for rows.Next() {
		var t APIToken
		if err := rows.Scan(&t.ID, &t.UserID, &t.Name, &t.ExpiresAt, &t.LastUsedAt, &t.CreatedAt); err != nil {
			return nil, err
		}
		tokens = append(tokens, &t)
	}
	return tokens, rows.Err()
}

// Revoke deletes a token by ID, ensuring it belongs to the given user.
func (s *APITokenService) Revoke(ctx context.Context, id, userID string) error {
	res, err := s.db.ExecContext(ctx,
		`DELETE FROM api_tokens WHERE id = ? AND user_id = ?`, id, userID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// Verify looks up a plaintext PAT and returns the owning user ID if valid.
func (s *APITokenService) Verify(plainText string) (string, error) {
	secret := stripPrefix(plainText)
	if secret == "" {
		return "", errors.New("invalid token format")
	}
	hash := hashToken(secret)

	var userID string
	var expiresAt *int64
	err := s.db.QueryRow(
		`SELECT user_id, expires_at FROM api_tokens WHERE token_hash = ?`, hash,
	).Scan(&userID, &expiresAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", errors.New("invalid token")
		}
		return "", err
	}

	if expiresAt != nil && *expiresAt > 0 && time.Now().Unix() > *expiresAt {
		return "", errors.New("token expired")
	}

	// Update last_used_at (best-effort, ignore errors).
	s.db.Exec(`UPDATE api_tokens SET last_used_at = ? WHERE token_hash = ?`,
		time.Now().Unix(), hash)

	return userID, nil
}

// BumpTokenVersion increments the user's token_version, invalidating all issued JWTs.
func (s *APITokenService) BumpTokenVersion(ctx context.Context, userID string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE users SET token_version = token_version + 1 WHERE id = ?`, userID)
	return err
}

// GetUserTokenVersion returns the current token version for a user.
func (s *APITokenService) GetUserTokenVersion(ctx context.Context, userID string) (int, error) {
	var v int
	err := s.db.QueryRowContext(ctx,
		`SELECT token_version FROM users WHERE id = ?`, userID,
	).Scan(&v)
	return v, err
}

func hashToken(secret string) string {
	h := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(h[:])
}

func stripPrefix(token string) string {
	if len(token) > len(patPrefix) && token[:len(patPrefix)] == patPrefix {
		return token[len(patPrefix):]
	}
	return ""
}
