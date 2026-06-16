package handler

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/go-chi/chi/v5"

	havitcrypto "github.com/mahoo12138/havit/internal/crypto"
	"github.com/mahoo12138/havit/internal/db"
	authmw "github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
	"github.com/mahoo12138/havit/internal/system"
)

func newAuthTestDB(t *testing.T) *sql.DB {
	t.Helper()

	database, err := db.Open("file:" + filepath.Join(t.TempDir(), "havit.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Close()
	})

	if err := db.Migrate(context.Background(), database); err != nil {
		t.Fatalf("migrate db: %v", err)
	}

	return database
}

func testFieldCrypto(t *testing.T) *havitcrypto.AESCrypto {
	t.Helper()
	c, err := havitcrypto.New("test-secret")
	if err != nil {
		t.Fatal(err)
	}
	return c
}

func newAuthTestRouter(t *testing.T) http.Handler {
	t.Helper()

	return newAuthTestRouterWithExternalURLs(t, "", "")
}

func newAuthTestRouterWithBarcode(t *testing.T, barcodeURL string) http.Handler {
	t.Helper()

	return newAuthTestRouterWithExternalURLs(t, barcodeURL, "")
}

func newAuthTestRouterWithExternalURLs(t *testing.T, barcodeURL, notifyWebhookURL string) http.Handler {
	t.Helper()

	dataDir := t.TempDir()
	database := newAuthTestDB(t)
	state := system.NewState("release", database)
	authSvc := service.NewAuthService(database, "test-secret", 720, false, state.MarkInitialized)
	itemSvc := service.NewItemService(database)
	tagSvc := service.NewTagService(database)
	locationSvc := service.NewLocationService(database)
	importSvc := service.NewImportService(database)
	exportSvc := service.NewExportService(database, testFieldCrypto(t))
	loanSvc := service.NewLoanService(database)
	virtualAssetSvc := service.NewVirtualAssetService(database, testFieldCrypto(t))
	reminderSvc := service.NewReminderService(database)
	notifySvc := service.NewNotifyService(reminderSvc, service.NewHTTPNotifyGateway(service.HTTPNotifyGatewayConfig{
		WebhookURL: notifyWebhookURL,
	}))
	backupSvc := service.NewBackupService(database, dataDir, 30)
	searchSvc := service.NewSearchService(database)
	barcodeSvc := service.NewBarcodeService(barcodeURL)
	attachmentSvc := service.NewAttachmentService(database, dataDir)
	aiRecognitionSvc := service.NewAIRecognitionService(attachmentSvc, nil)

	r := chi.NewRouter()
	r.Route("/api/v1", func(r chi.Router) {
		NewSystemHandler(state).Mount(r)
		authH := NewAuthHandler(authSvc, state)
		authH.MountPublic(r)

		r.Group(func(r chi.Router) {
			r.Use(authmw.Auth(authSvc))
			authH.MountProtected(r)
			NewItemHandler(itemSvc).Mount(r)
			NewTagHandler(tagSvc).Mount(r)
			NewLocationHandler(locationSvc).Mount(r)
			NewImportHandler(importSvc).Mount(r)
			NewExportHandler(exportSvc).Mount(r)
			NewLoanHandler(loanSvc).Mount(r)
			NewVirtualAssetHandler(virtualAssetSvc).Mount(r)
			NewReminderHandler(reminderSvc).Mount(r)
			NewNotifyHandler(notifySvc).Mount(r)
			NewBackupHandler(backupSvc).Mount(r)
			NewSearchHandler(searchSvc, nil).Mount(r)
			NewBarcodeHandler(barcodeSvc).Mount(r)
			NewAIHandler(aiRecognitionSvc, 20).Mount(r)
			NewAttachmentHandler(attachmentSvc, 20).Mount(r)
		})
	})
	return r
}

func postJSON(t *testing.T, router http.Handler, path string, body any) *httptest.ResponseRecorder {
	t.Helper()

	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(raw))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	return rec
}

func tokenFromResponse(t *testing.T, rec *httptest.ResponseRecorder) string {
	t.Helper()

	var body struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode token response: %v", err)
	}
	if body.Token == "" {
		t.Fatal("expected token in response")
	}
	return body.Token
}

func TestSetupCreatesOwnerAndClosesSetup(t *testing.T) {
	router := newAuthTestRouter(t)

	status := httptest.NewRecorder()
	router.ServeHTTP(status, httptest.NewRequest(http.MethodGet, "/api/v1/system/status", nil))
	if status.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", status.Code)
	}
	if !bytes.Contains(status.Body.Bytes(), []byte(`"needs_setup":true`)) {
		t.Fatalf("expected needs_setup=true, got %s", status.Body.String())
	}

	setup := postJSON(t, router, "/api/v1/auth/setup", map[string]string{
		"username": "owner@example.com",
		"password": "secret123",
	})
	if setup.Code != http.StatusCreated {
		t.Fatalf("expected setup 201, got %d: %s", setup.Code, setup.Body.String())
	}
	if !bytes.Contains(setup.Body.Bytes(), []byte(`"role":"owner"`)) {
		t.Fatalf("expected owner role, got %s", setup.Body.String())
	}

	again := postJSON(t, router, "/api/v1/auth/setup", map[string]string{
		"username": "second@example.com",
		"password": "secret123",
	})
	if again.Code != http.StatusGone {
		t.Fatalf("expected second setup 410, got %d: %s", again.Code, again.Body.String())
	}

	after := httptest.NewRecorder()
	router.ServeHTTP(after, httptest.NewRequest(http.MethodGet, "/api/v1/system/status", nil))
	if !bytes.Contains(after.Body.Bytes(), []byte(`"needs_setup":false`)) {
		t.Fatalf("expected needs_setup=false, got %s", after.Body.String())
	}
}

func TestLoginAndMeAcceptBearerToken(t *testing.T) {
	router := newAuthTestRouter(t)

	setup := postJSON(t, router, "/api/v1/auth/setup", map[string]string{
		"username": "owner@example.com",
		"password": "secret123",
	})
	if setup.Code != http.StatusCreated {
		t.Fatalf("expected setup 201, got %d: %s", setup.Code, setup.Body.String())
	}

	login := postJSON(t, router, "/api/v1/auth/login", map[string]string{
		"username": "owner@example.com",
		"password": "secret123",
	})
	if login.Code != http.StatusOK {
		t.Fatalf("expected login 200, got %d: %s", login.Code, login.Body.String())
	}
	token := tokenFromResponse(t, login)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected me 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`"username":"owner@example.com"`)) {
		t.Fatalf("expected current user response, got %s", rec.Body.String())
	}
}

func TestProtectedItemsRejectMissingToken(t *testing.T) {
	router := newAuthTestRouter(t)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/items/", nil))

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected missing token 401, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestMeRejectsTokenForDeletedUser(t *testing.T) {
	database := newAuthTestDB(t)
	state := system.NewState("release", database)
	authSvc := service.NewAuthService(database, "test-secret", 720, false, state.MarkInitialized)
	authH := NewAuthHandler(authSvc, state)

	user, token, err := authSvc.Setup(context.Background(), "owner@example.com", "secret123")
	if err != nil {
		t.Fatalf("setup user: %v", err)
	}
	if _, err := database.ExecContext(context.Background(), `DELETE FROM users WHERE id = ?`, user.ID); err != nil {
		t.Fatalf("delete user: %v", err)
	}

	r := chi.NewRouter()
	r.Route("/api/v1", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authmw.Auth(authSvc))
			authH.MountProtected(r)
		})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected deleted user token 401, got %d: %s", rec.Code, rec.Body.String())
	}
}
