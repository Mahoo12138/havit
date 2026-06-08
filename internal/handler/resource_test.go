package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func setupToken(t *testing.T, router http.Handler) string {
	t.Helper()

	setup := postJSON(t, router, "/api/v1/auth/setup", map[string]string{
		"username": "owner@example.com",
		"password": "secret123",
	})
	if setup.Code != http.StatusCreated {
		t.Fatalf("expected setup 201, got %d: %s", setup.Code, setup.Body.String())
	}
	return tokenFromResponse(t, setup)
}

func authedRequest(method, path, token string, body *strings.Reader) *http.Request {
	var r *http.Request
	if body == nil {
		r = httptest.NewRequest(method, path, nil)
	} else {
		r = httptest.NewRequest(method, path, body)
	}
	r.Header.Set("Authorization", "Bearer "+token)
	return r
}

func decodeJSON(t *testing.T, rec *httptest.ResponseRecorder, out any) {
	t.Helper()

	if err := json.Unmarshal(rec.Body.Bytes(), out); err != nil {
		t.Fatalf("decode json: %v; body=%s", err, rec.Body.String())
	}
}

func TestLocationAndItemHTTPFlow(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	if createLoc.Code != http.StatusCreated {
		t.Fatalf("expected location create 201, got %d: %s", createLoc.Code, createLoc.Body.String())
	}
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)
	if loc.ID == "" {
		t.Fatal("expected location id")
	}

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "备用 HDMI 线",
		"type":        "durable",
		"location_id": loc.ID,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)
	if item.ID == "" {
		t.Fatal("expected item id")
	}

	search := httptest.NewRecorder()
	router.ServeHTTP(search, authedRequest(http.MethodGet, "/api/v1/items/?q=HDMI", token, nil))
	if search.Code != http.StatusOK {
		t.Fatalf("expected search 200, got %d: %s", search.Code, search.Body.String())
	}
	if !bytes.Contains(search.Body.Bytes(), []byte(`备用 HDMI 线`)) {
		t.Fatalf("expected search result to include item, got %s", search.Body.String())
	}

	archive := httptest.NewRecorder()
	router.ServeHTTP(archive, authedRequest(http.MethodDelete, "/api/v1/items/"+item.ID, token, nil))
	if archive.Code != http.StatusNoContent {
		t.Fatalf("expected archive 204, got %d: %s", archive.Code, archive.Body.String())
	}

	list := httptest.NewRecorder()
	router.ServeHTTP(list, authedRequest(http.MethodGet, "/api/v1/items/", token, nil))
	if list.Code != http.StatusOK {
		t.Fatalf("expected list 200, got %d: %s", list.Code, list.Body.String())
	}
	if bytes.Contains(list.Body.Bytes(), []byte(`备用 HDMI 线`)) {
		t.Fatalf("expected archived item to be hidden from default list, got %s", list.Body.String())
	}
}

func TestImportItemsHTTPFlowCreatesRowsAndLocations(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	body := strings.NewReader(strings.Join([]string{
		"name,type,category,location,purchase_price,purchase_date,serial_number",
		"机械键盘,durable,外设,书房/书桌,399.50,2026-06-08,SN-001",
	}, "\n"))
	req := authedRequest(http.MethodPost, "/api/v1/import/items?format=csv", token, body)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected import 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`"created":1`)) {
		t.Fatalf("expected one created row, got %s", rec.Body.String())
	}

	items := httptest.NewRecorder()
	router.ServeHTTP(items, authedRequest(http.MethodGet, "/api/v1/items/?q=机械键盘", token, nil))
	if items.Code != http.StatusOK {
		t.Fatalf("expected items 200, got %d: %s", items.Code, items.Body.String())
	}
	if !bytes.Contains(items.Body.Bytes(), []byte(`机械键盘`)) {
		t.Fatalf("expected imported item in search results, got %s", items.Body.String())
	}

	locations := httptest.NewRecorder()
	router.ServeHTTP(locations, authedRequest(http.MethodGet, "/api/v1/locations/", token, nil))
	if locations.Code != http.StatusOK {
		t.Fatalf("expected locations 200, got %d: %s", locations.Code, locations.Body.String())
	}
	if !bytes.Contains(locations.Body.Bytes(), []byte(`书桌`)) {
		t.Fatalf("expected imported location path, got %s", locations.Body.String())
	}
}

func TestImportItemsReturnsUnprocessableWhenAllRowsFail(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	body := strings.NewReader(strings.Join([]string{
		"name,type,category",
		",durable,外设",
		"未知物品,mystery,杂物",
	}, "\n"))
	req := authedRequest(http.MethodPost, "/api/v1/import/items?format=csv", token, body)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected import 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`"created":0`)) ||
		!bytes.Contains(rec.Body.Bytes(), []byte(`"failed":2`)) {
		t.Fatalf("expected all rows to fail, got %s", rec.Body.String())
	}
}

func postAuthedJSON(t *testing.T, router http.Handler, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()

	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(raw))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	return rec
}
