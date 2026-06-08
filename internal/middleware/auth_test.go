package middleware

import (
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/mahoo12138/havit/internal/db"
	"github.com/mahoo12138/havit/internal/service"
)

func newAuthMiddlewareTestDB(t *testing.T) *sql.DB {
	t.Helper()

	database, err := db.Open("file:" + filepath.Join(t.TempDir(), "havit.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Close()
	})

	if err := db.Migrate(database); err != nil {
		t.Fatalf("migrate db: %v", err)
	}

	return database
}

func newAuthMiddlewareTestService(t *testing.T) (*service.AuthService, string) {
	t.Helper()

	authSvc := service.NewAuthService(newAuthMiddlewareTestDB(t), "middleware-secret", 720, false, nil)
	_, token, err := authSvc.Setup(context.Background(), "owner@example.com", "secret123")
	if err != nil {
		t.Fatalf("setup user: %v", err)
	}
	return authSvc, token
}

func protectedRecorder(t *testing.T, authSvc *service.AuthService, req *http.Request) *httptest.ResponseRecorder {
	t.Helper()

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := ClaimsFrom(r.Context())
		if !ok {
			t.Fatal("expected claims in request context")
		}
		if claims.UserID == "" {
			t.Fatal("expected user id in claims")
		}
		w.WriteHeader(http.StatusNoContent)
	})

	rec := httptest.NewRecorder()
	Auth(authSvc)(next).ServeHTTP(rec, req)
	return rec
}

func TestAuthMiddlewareAcceptsBearerToken(t *testing.T) {
	authSvc, token := newAuthMiddlewareTestService(t)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := protectedRecorder(t, authSvc, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestAuthMiddlewareAcceptsTokenCookie(t *testing.T) {
	authSvc, token := newAuthMiddlewareTestService(t)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: "havit_token", Value: token})
	rec := protectedRecorder(t, authSvc, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestAuthMiddlewareRejectsMissingToken(t *testing.T) {
	authSvc, _ := newAuthMiddlewareTestService(t)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	rec := httptest.NewRecorder()
	Auth(authSvc)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("protected handler should not be called")
	})).ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestAuthMiddlewareRejectsMalformedBearerHeader(t *testing.T) {
	authSvc, token := newAuthMiddlewareTestService(t)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", token)
	rec := httptest.NewRecorder()
	Auth(authSvc)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("protected handler should not be called")
	})).ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rec.Code, rec.Body.String())
	}
}
