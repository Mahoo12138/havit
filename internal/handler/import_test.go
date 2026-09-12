package handler

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestImportPreviewHTTPFlowReturnsStatsWithoutWriting(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	body := strings.NewReader(strings.Join([]string{
		"name,type,location",
		"预览物品,durable,书房",
		"坏行,badtype,书房",
	}, "\n"))
	req := authedRequest(http.MethodPost, "/api/v1/import/items/preview?format=csv", token, body)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected preview 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`"stats":{`)) ||
		!bytes.Contains(rec.Body.Bytes(), []byte(`"ok":1`)) ||
		!bytes.Contains(rec.Body.Bytes(), []byte(`"error":1`)) ||
		!bytes.Contains(rec.Body.Bytes(), []byte(`"mapping":{`)) {
		t.Fatalf("expected preview stats and mapping, got %s", rec.Body.String())
	}

	// Preview must not create anything.
	items := httptest.NewRecorder()
	router.ServeHTTP(items, authedRequest(http.MethodGet, "/api/v1/items/?q=预览物品", token, nil))
	if items.Code != http.StatusOK {
		t.Fatalf("expected items 200, got %d: %s", items.Code, items.Body.String())
	}
	if bytes.Contains(items.Body.Bytes(), []byte(`预览物品`)) {
		t.Fatalf("preview must not write items, got %s", items.Body.String())
	}
}

func TestImportUpdateModeHTTPFlowReportsUpdated(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	seed := strings.NewReader("name,location,description\n路由器,书房,原描述\n")
	req := authedRequest(http.MethodPost, "/api/v1/import/items?format=csv", token, seed)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected seed import 200, got %d: %s", rec.Code, rec.Body.String())
	}

	update := strings.NewReader("name,location,description,status\n路由器,书房,新描述,idle\n")
	req = authedRequest(http.MethodPost, "/api/v1/import/items?format=csv&on_duplicate=update", token, update)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected update import 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`"updated":1`)) ||
		!bytes.Contains(rec.Body.Bytes(), []byte(`"created":0`)) {
		t.Fatalf("expected one updated row, got %s", rec.Body.String())
	}
}

func TestImportExplicitMappingHTTPFlow(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	body := strings.NewReader(strings.Join([]string{
		"Title,Where,Cost",
		"露营灯,阳台/收纳架,88",
	}, "\n"))
	// mapping=name:Title&mapping=location:Where&mapping=purchase_price:Cost
	req := authedRequest(http.MethodPost,
		"/api/v1/import/items?format=csv&mapping=name%3ATitle&mapping=location%3AWhere&mapping=purchase_price%3ACost",
		token, body)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected mapped import 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`"created":1`)) {
		t.Fatalf("expected one created row, got %s", rec.Body.String())
	}

	items := httptest.NewRecorder()
	router.ServeHTTP(items, authedRequest(http.MethodGet, "/api/v1/items/?q=露营灯", token, nil))
	if items.Code != http.StatusOK {
		t.Fatalf("expected items 200, got %d: %s", items.Code, items.Body.String())
	}
	if !bytes.Contains(items.Body.Bytes(), []byte(`露营灯`)) {
		t.Fatalf("expected mapped item in search results, got %s", items.Body.String())
	}
}

func TestImportMappingMissingNameRejected(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	body := strings.NewReader("A,B\n1,2\n")
	req := authedRequest(http.MethodPost,
		"/api/v1/import/items?format=csv&mapping=type%3AB", token, body)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing name mapping, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`name`)) {
		t.Fatalf("expected error to mention name, got %s", rec.Body.String())
	}
}

func TestImportInvalidOnDuplicateRejected(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	body := strings.NewReader("name\nx\n")
	req := authedRequest(http.MethodPost,
		"/api/v1/import/items?format=csv&on_duplicate=bogus", token, body)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid on_duplicate, got %d: %s", rec.Code, rec.Body.String())
	}
}
