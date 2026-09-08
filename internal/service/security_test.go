package service

import (
	"context"
	"strings"
	"testing"
	"time"
)

func TestPATStoredHashedAndNeverExposesSecret(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	seedUser(t, db, "user-1", "member")
	svc := NewAPITokenService(db)

	created, err := svc.Create(ctx, "user-1", "ci", nil)
	if err != nil {
		t.Fatalf("create pat: %v", err)
	}
	if !strings.HasPrefix(created.PlainText, "hv_pat_") {
		t.Fatalf("expected hv_pat_ prefix, got %q", created.PlainText)
	}

	var storedHash string
	if err := db.QueryRowContext(ctx,
		`SELECT token_hash FROM api_tokens WHERE id = ?`, created.ID).Scan(&storedHash); err != nil {
		t.Fatalf("read stored hash: %v", err)
	}
	if storedHash == created.PlainText {
		t.Fatal("token was stored in plaintext")
	}
	if want := hashToken(stripPrefix(created.PlainText)); storedHash != want {
		t.Fatalf("stored hash mismatch: got %q want %q", storedHash, want)
	}

	tokens, err := svc.List(ctx, "user-1")
	if err != nil {
		t.Fatalf("list tokens: %v", err)
	}
	if len(tokens) != 1 || tokens[0].ID != created.ID {
		t.Fatalf("expected 1 listed token, got %#v", tokens)
	}
}

func TestPATVerifyUpdatesLastUsedAndRejectsUnknown(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	seedUser(t, db, "user-1", "member")
	svc := NewAPITokenService(db)

	created, err := svc.Create(ctx, "user-1", "ci", nil)
	if err != nil {
		t.Fatalf("create pat: %v", err)
	}
	userID, err := svc.Verify(created.PlainText)
	if err != nil {
		t.Fatalf("verify pat: %v", err)
	}
	if userID != "user-1" {
		t.Fatalf("expected user-1, got %q", userID)
	}

	var lastUsed *int64
	if err := db.QueryRowContext(ctx,
		`SELECT last_used_at FROM api_tokens WHERE id = ?`, created.ID).Scan(&lastUsed); err != nil {
		t.Fatalf("read last_used_at: %v", err)
	}
	if lastUsed == nil || *lastUsed < created.CreatedAt {
		t.Fatalf("expected last_used_at updated, got %#v", lastUsed)
	}

	if _, err := svc.Verify("hv_pat_" + strings.Repeat("ab", 32)); err == nil {
		t.Fatal("expected unknown token to fail verification")
	}
	if _, err := svc.Verify("not-a-pat"); err == nil {
		t.Fatal("expected malformed token to fail verification")
	}
}

func TestPATExpiry(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	seedUser(t, db, "user-1", "member")
	svc := NewAPITokenService(db)

	past := time.Now().Add(-time.Hour).Unix()
	expired, err := svc.Create(ctx, "user-1", "expired", &past)
	if err != nil {
		t.Fatalf("create expired pat: %v", err)
	}
	if _, err := svc.Verify(expired.PlainText); err == nil || !strings.Contains(err.Error(), "expired") {
		t.Fatalf("expected expired token to be rejected, got %v", err)
	}

	future := time.Now().Add(time.Hour).Unix()
	valid, err := svc.Create(ctx, "user-1", "valid", &future)
	if err != nil {
		t.Fatalf("create valid pat: %v", err)
	}
	if _, err := svc.Verify(valid.PlainText); err != nil {
		t.Fatalf("expected valid token to verify, got %v", err)
	}

	never, err := svc.Create(ctx, "user-1", "never", nil)
	if err != nil {
		t.Fatalf("create non-expiring pat: %v", err)
	}
	if _, err := svc.Verify(never.PlainText); err != nil {
		t.Fatalf("expected non-expiring token to verify, got %v", err)
	}
}

func TestPATRevoke(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	seedUser(t, db, "user-1", "member")
	svc := NewAPITokenService(db)

	created, err := svc.Create(ctx, "user-1", "ci", nil)
	if err != nil {
		t.Fatalf("create pat: %v", err)
	}
	if err := svc.Revoke(ctx, created.ID, "user-1"); err != nil {
		t.Fatalf("revoke: %v", err)
	}
	if _, err := svc.Verify(created.PlainText); err == nil {
		t.Fatal("expected revoked token to fail verification")
	}

	// Revoking with the wrong owner must not touch the token.
	other, err := svc.Create(ctx, "user-1", "other", nil)
	if err != nil {
		t.Fatalf("create other pat: %v", err)
	}
	if err := svc.Revoke(ctx, other.ID, "someone-else"); err != ErrNotFound {
		t.Fatalf("expected ErrNotFound for foreign revoke, got %v", err)
	}
	if _, err := svc.Verify(other.PlainText); err != nil {
		t.Fatalf("expected token to survive foreign revoke attempt, got %v", err)
	}
}

func TestPasswordStoredAsBcryptHash(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	authSvc := NewAuthService(db, "test-secret", 720, false, nil)

	user, _, err := authSvc.Setup(ctx, "owner@example.com", "plain-password")
	if err != nil {
		t.Fatalf("setup: %v", err)
	}

	var stored string
	if err := db.QueryRowContext(ctx,
		`SELECT password FROM users WHERE id = ?`, user.ID).Scan(&stored); err != nil {
		t.Fatalf("read password: %v", err)
	}
	if stored == "plain-password" {
		t.Fatal("password stored in plaintext")
	}
	if !strings.HasPrefix(stored, "$2a$") && !strings.HasPrefix(stored, "$2b$") {
		t.Fatalf("expected bcrypt hash, got %q", stored)
	}
}

func TestJWTInvalidatedByTokenVersionBump(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	authSvc := NewAuthService(db, "test-secret", 720, false, nil)

	user, token, err := authSvc.Setup(ctx, "owner@example.com", "secret123")
	if err != nil {
		t.Fatalf("setup: %v", err)
	}
	if _, err := authSvc.Verify(token); err != nil {
		t.Fatalf("expected fresh token to verify, got %v", err)
	}

	// Force-logout-all invalidates every previously issued JWT.
	if err := NewAPITokenService(db).BumpTokenVersion(ctx, user.ID); err != nil {
		t.Fatalf("bump token version: %v", err)
	}
	if _, err := authSvc.Verify(token); err == nil {
		t.Fatal("expected token to be revoked after token_version bump")
	}
}
