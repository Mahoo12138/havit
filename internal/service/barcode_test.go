package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestBarcodeLookupReturnsDraftFromOpenFoodFactsAndFallbackWhenMissing(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v2/product/123456.json" {
			_, _ = w.Write([]byte(`{
				"status": 1,
				"product": {
					"product_name": "燕麦奶",
					"generic_name": "植物饮品",
					"brands": "Oatly",
					"categories": "饮料, 植物奶"
				}
			}`))
			return
		}
		_, _ = w.Write([]byte(`{"status":0}`))
	}))
	defer server.Close()

	svc := NewBarcodeService(server.URL)
	found, err := svc.Lookup(context.Background(), "123456")
	if err != nil {
		t.Fatalf("lookup found barcode: %v", err)
	}
	if !found.Found || found.Draft == nil || found.Draft.Name == nil || *found.Draft.Name != "燕麦奶" {
		t.Fatalf("expected draft from barcode lookup, got %#v", found)
	}
	if found.Draft.Category == nil || *found.Draft.Category != "饮料" {
		t.Fatalf("expected first category, got %#v", found.Draft.Category)
	}

	missing, err := svc.Lookup(context.Background(), "000")
	if err != nil {
		t.Fatalf("lookup missing barcode: %v", err)
	}
	if missing.Found || missing.Fallback != "ai_or_manual" {
		t.Fatalf("expected fallback result, got %#v", missing)
	}
}
