package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	apperr "github.com/mahoo12138/havit/internal/errors"
)

func requireAppError(t *testing.T, err error, wantCode string) *apperr.AppError {
	t.Helper()
	var ae *apperr.AppError
	if !errors.As(err, &ae) {
		t.Fatalf("expected AppError %q, got %v", wantCode, err)
	}
	if ae.Code != wantCode {
		t.Fatalf("expected error code %q, got %q", wantCode, ae.Code)
	}
	return ae
}

func TestUpdateProfileNickname(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	authSvc := NewAuthService(db, "test-secret", 720, false, nil)

	user, _, err := authSvc.Setup(ctx, "owner@example.com", "secret123")
	if err != nil {
		t.Fatalf("setup: %v", err)
	}

	updated, err := authSvc.UpdateProfile(ctx, user.ID, ProfileInput{
		Nickname: "  小明  ",
		Email:    "  ming@example.com ",
		Bio:      "  管账的人  ",
		Avatar:   "data:image/png;base64,AAAA",
	})
	if err != nil {
		t.Fatalf("update profile: %v", err)
	}
	if updated.Nickname != "小明" {
		t.Fatalf("expected trimmed nickname %q, got %q", "小明", updated.Nickname)
	}
	if updated.Email != "ming@example.com" {
		t.Fatalf("expected trimmed email, got %q", updated.Email)
	}
	if updated.Bio != "管账的人" {
		t.Fatalf("expected trimmed bio, got %q", updated.Bio)
	}
	if updated.Avatar == "" {
		t.Fatal("expected avatar to be persisted")
	}

	got, err := authSvc.GetUser(ctx, user.ID)
	if err != nil {
		t.Fatalf("get user: %v", err)
	}
	if got.Nickname != "小明" || got.Email != "ming@example.com" || got.Bio != "管账的人" {
		t.Fatalf("expected persisted profile, got %+v", got)
	}

	// 40 multibyte runes are allowed, 41 are not.
	if _, err := authSvc.UpdateProfile(ctx, user.ID, ProfileInput{Nickname: strings.Repeat("字", 40)}); err != nil {
		t.Fatalf("expected 40-rune nickname to be accepted, got %v", err)
	}
	_, err = authSvc.UpdateProfile(ctx, user.ID, ProfileInput{Nickname: strings.Repeat("字", 41)})
	requireAppError(t, err, apperr.CodeValidationFailed)

	cleared, err := authSvc.UpdateProfile(ctx, user.ID, ProfileInput{})
	if err != nil {
		t.Fatalf("clear profile: %v", err)
	}
	if cleared.Nickname != "" || cleared.Email != "" || cleared.Bio != "" || cleared.Avatar != "" {
		t.Fatalf("expected empty profile after clear, got %+v", cleared)
	}
}

func TestUpdateProfileValidation(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	authSvc := NewAuthService(db, "test-secret", 720, false, nil)

	user, _, err := authSvc.Setup(ctx, "owner@example.com", "secret123")
	if err != nil {
		t.Fatalf("setup: %v", err)
	}

	for name, in := range map[string]ProfileInput{
		"missing at sign": {Email: "not-an-email"},
		"display name":    {Email: "Ming <ming@example.com>"},
		"overlong email":  {Email: strings.Repeat("a", 250) + "@example.com"},
		"overlong bio":    {Bio: strings.Repeat("字", 201)},
		"bad avatar mime": {Avatar: "data:text/plain;base64,AAAA"},
		"oversized avatar": {
			Avatar: "data:image/png;base64," + strings.Repeat("A", maxAvatarDataURLLength),
		},
	} {
		if _, err := authSvc.UpdateProfile(ctx, user.ID, in); err == nil {
			t.Fatalf("%s: expected validation error", name)
		} else {
			requireAppError(t, err, apperr.CodeValidationFailed)
		}
	}
}

func TestUpdateProfileAllowedInDemo(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	seedUser(t, db, "demo-user", "owner")
	authSvc := NewAuthService(db, "test-secret", 720, true, nil)

	updated, err := authSvc.UpdateProfile(ctx, "demo-user", ProfileInput{Nickname: "访客"})
	if err != nil {
		t.Fatalf("expected nickname update to be allowed in demo, got %v", err)
	}
	if updated.Nickname != "访客" {
		t.Fatalf("expected nickname %q, got %q", "访客", updated.Nickname)
	}
}

func TestChangePasswordRejectedInDemo(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	seedUser(t, db, "demo-user", "owner")
	authSvc := NewAuthService(db, "test-secret", 720, true, nil)

	_, err := authSvc.ChangePassword(ctx, "demo-user", "havit-demo", "new-secret")
	ae := requireAppError(t, err, apperr.CodeDemoReadOnly)
	if ae.Status != 403 {
		t.Fatalf("expected 403 for demo readonly, got %d", ae.Status)
	}
}

func TestChangePasswordValidation(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	authSvc := NewAuthService(db, "test-secret", 720, false, nil)

	user, _, err := authSvc.Setup(ctx, "owner@example.com", "secret123")
	if err != nil {
		t.Fatalf("setup: %v", err)
	}

	// Wrong current password: 400, never 401 (the client logs out on 401).
	_, err = authSvc.ChangePassword(ctx, user.ID, "not-the-password", "new-secret")
	ae := requireAppError(t, err, apperr.CodeInvalidCurrentPassword)
	if ae.Status != 400 {
		t.Fatalf("expected 400 for wrong current password, got %d", ae.Status)
	}

	// New password too short.
	_, err = authSvc.ChangePassword(ctx, user.ID, "secret123", "short")
	requireAppError(t, err, apperr.CodeValidationFailed)

	// New password beyond bcrypt's 72-byte limit.
	_, err = authSvc.ChangePassword(ctx, user.ID, "secret123", strings.Repeat("a", 73))
	requireAppError(t, err, apperr.CodeValidationFailed)

	// New password identical to the current one.
	_, err = authSvc.ChangePassword(ctx, user.ID, "secret123", "secret123")
	requireAppError(t, err, apperr.CodeValidationFailed)
}

func TestChangePasswordRotatesSessions(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	authSvc := NewAuthService(db, "test-secret", 720, false, nil)

	user, oldToken, err := authSvc.Setup(ctx, "owner@example.com", "secret123")
	if err != nil {
		t.Fatalf("setup: %v", err)
	}

	newToken, err := authSvc.ChangePassword(ctx, user.ID, "secret123", "new-secret")
	if err != nil {
		t.Fatalf("change password: %v", err)
	}

	if _, err := authSvc.Verify(oldToken); err == nil {
		t.Fatal("expected the previous token to be revoked")
	}
	if _, err := authSvc.Verify(newToken); err != nil {
		t.Fatalf("expected the fresh token to verify, got %v", err)
	}

	var stored string
	if err := db.QueryRowContext(ctx,
		`SELECT password FROM users WHERE id = ?`, user.ID).Scan(&stored); err != nil {
		t.Fatalf("read password: %v", err)
	}
	if !strings.HasPrefix(stored, "$2a$") && !strings.HasPrefix(stored, "$2b$") {
		t.Fatalf("expected bcrypt hash, got %q", stored)
	}

	if _, _, err := authSvc.Login(ctx, "owner@example.com", "secret123"); err == nil {
		t.Fatal("expected old password to stop working")
	}
	if _, _, err := authSvc.Login(ctx, "owner@example.com", "new-secret"); err != nil {
		t.Fatalf("expected new password to work, got %v", err)
	}
}
