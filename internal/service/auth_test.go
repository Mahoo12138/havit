package service

import (
	"context"
	"errors"
	"testing"

	apperr "github.com/mahoo12138/havit/internal/errors"
)

func TestAuthSetupCreatesOwner(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	user, token, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}
	if user == nil {
		t.Fatal("expected user to be non-nil")
	}
	if user.Username != "admin@test.com" {
		t.Fatalf("expected username admin@test.com, got %s", user.Username)
	}
	if user.Role != "owner" {
		t.Fatalf("expected role owner, got %s", user.Role)
	}
	if user.ID == "" {
		t.Fatal("expected user ID to be non-empty")
	}
	if user.CreatedAt == 0 {
		t.Fatal("expected CreatedAt to be set")
	}
	if token == "" {
		t.Fatal("expected token to be non-empty")
	}
}

func TestAuthSetupRejectsEmptyFields(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	_, _, err := svc.Setup(context.Background(), "", "password123")
	if err == nil {
		t.Fatal("expected error for empty username")
	}

	_, _, err = svc.Setup(context.Background(), "admin@test.com", "")
	if err == nil {
		t.Fatal("expected error for empty password")
	}
}

func TestAuthSetupRejectsDuplicate(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	_, _, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("first setup: %v", err)
	}

	_, _, err = svc.Setup(context.Background(), "admin@test.com", "password123")
	if !errors.Is(err, ErrSetupClosed) {
		t.Fatalf("expected ErrSetupClosed, got %v", err)
	}
}

func TestAuthSetupRejectsWhenDemoMode(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, true, nil)

	_, _, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if !errors.Is(err, ErrSetupClosed) {
		t.Fatalf("expected ErrSetupClosed in demo mode, got %v", err)
	}
}

func TestAuthSetupCallsOnOwnerCreated(t *testing.T) {
	db := newTestDB(t)
	called := false
	svc := NewAuthService(db, "test-secret", 720, false, func() { called = true })

	_, _, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}
	if !called {
		t.Fatal("expected onOwnerCreated callback to be called")
	}
}

func TestAuthLoginSuccess(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	setupUser, _, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}

	user, token, err := svc.Login(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Login: %v", err)
	}
	if user.ID != setupUser.ID {
		t.Fatalf("expected user ID %s, got %s", setupUser.ID, user.ID)
	}
	if user.Username != "admin@test.com" {
		t.Fatalf("expected username admin@test.com, got %s", user.Username)
	}
	if user.Role != "owner" {
		t.Fatalf("expected role owner, got %s", user.Role)
	}
	if token == "" {
		t.Fatal("expected token to be non-empty")
	}
}

func TestAuthLoginWrongPassword(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	_, _, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}

	_, _, err = svc.Login(context.Background(), "admin@test.com", "wrongpassword")
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestAuthLoginUnknownUser(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	_, _, err := svc.Login(context.Background(), "nobody@test.com", "password123")
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestAuthGetUserSuccess(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	setupUser, _, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}

	user, err := svc.GetUser(context.Background(), setupUser.ID)
	if err != nil {
		t.Fatalf("GetUser: %v", err)
	}
	if user.ID != setupUser.ID {
		t.Fatalf("expected user ID %s, got %s", setupUser.ID, user.ID)
	}
}

func TestAuthGetUserNotFound(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	_, err := svc.GetUser(context.Background(), "nonexistent")
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestAuthVerifyToken(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	_, token, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}

	claims, err := svc.Verify(token)
	if err != nil {
		t.Fatalf("Verify: %v", err)
	}
	if claims.UserID == "" {
		t.Fatal("expected non-empty UserID in claims")
	}
	if claims.Role != "owner" {
		t.Fatalf("expected role owner, got %s", claims.Role)
	}
}

func TestAuthVerifyInvalidToken(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	_, err := svc.Verify("invalid-token")
	if err == nil {
		t.Fatal("expected error for invalid token")
	}
}

func TestAuthVerifyTokenFromWrongSecret(t *testing.T) {
	db := newTestDB(t)
	svc1 := NewAuthService(db, "secret-one", 720, false, nil)
	svc2 := NewAuthService(db, "secret-two", 720, false, nil)

	_, token, err := svc1.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}

	_, err = svc2.Verify(token)
	if err == nil {
		t.Fatal("expected verification failure with different secret")
	}
}

func TestAuthDefaultExpiry(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 0, false, nil)

	_, token, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}
	if token == "" {
		t.Fatal("expected token to be non-empty")
	}

	claims, err := svc.Verify(token)
	if err != nil {
		t.Fatalf("Verify: %v", err)
	}
	if claims.ExpiresAt == nil {
		t.Fatal("expected token to have expiry")
	}
}

func TestAuthVerifyRejectsDeletedUser(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	user, token, err := svc.Setup(context.Background(), "admin@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}
	if err := svc.DeleteUser(context.Background(), user.ID, "someone-else"); err != nil {
		t.Fatalf("DeleteUser: %v", err)
	}
	if _, err := svc.Verify(token); err == nil {
		t.Fatal("expected token of deleted user to be rejected")
	}
}

func TestUpdateRoleInvalidatesExistingToken(t *testing.T) {
	db := newTestDB(t)
	svc := NewAuthService(db, "test-secret", 720, false, nil)

	owner, _, err := svc.Setup(context.Background(), "owner@test.com", "password123")
	if err != nil {
		t.Fatalf("Setup: %v", err)
	}
	member, err := svc.CreateMember(context.Background(), "member@test.com", "password123")
	if err != nil {
		t.Fatalf("CreateMember: %v", err)
	}
	_, memberToken, err := svc.Login(context.Background(), "member@test.com", "password123")
	if err != nil {
		t.Fatalf("Login: %v", err)
	}
	if _, err := svc.Verify(memberToken); err != nil {
		t.Fatalf("expected member token to verify, got %v", err)
	}

	if _, err := svc.UpdateRole(context.Background(), member.ID, "owner", owner.ID); err != nil {
		t.Fatalf("UpdateRole: %v", err)
	}
	if _, err := svc.Verify(memberToken); err == nil {
		t.Fatal("expected token issued with old role to be revoked")
	}

	_, freshToken, err := svc.Login(context.Background(), "member@test.com", "password123")
	if err != nil {
		t.Fatalf("Login after role change: %v", err)
	}
	claims, err := svc.Verify(freshToken)
	if err != nil {
		t.Fatalf("expected fresh token to verify, got %v", err)
	}
	if claims.Role != "owner" {
		t.Fatalf("expected refreshed role owner, got %q", claims.Role)
	}
}

func TestAuthSameTokenErrorInstance(t *testing.T) {
	if !errors.Is(ErrInvalidCredentials, apperr.ErrInvalidCredentials) {
		t.Fatal("ErrInvalidCredentials should be the same instance as apperr.ErrInvalidCredentials")
	}
	if !errors.Is(ErrSetupClosed, apperr.ErrSetupClosed) {
		t.Fatal("ErrSetupClosed should be the same instance as apperr.ErrSetupClosed")
	}
	if !errors.Is(ErrUserExists, apperr.ErrUserExists) {
		t.Fatal("ErrUserExists should be the same instance as apperr.ErrUserExists")
	}
	if ErrNotFound == nil {
		t.Fatal("ErrNotFound should be defined in service package")
	}
}
