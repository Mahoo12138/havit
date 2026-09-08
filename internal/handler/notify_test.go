package handler

import (
	"encoding/json"
	"net/http"
	"testing"
)

// TestNotifyProcessDueSurfacesFailures asserts that the manual process-due
// endpoint reports failed deliveries instead of pretending everything went
// through, so a misconfigured gateway is visible to the user.
func TestNotifyProcessDueSurfacesFailures(t *testing.T) {
	// Unreachable endpoint: connection is refused immediately.
	router := newAuthTestRouterWithExternalURLs(t, "", "http://127.0.0.1:9/notify")
	base := "/api/v1"

	setup := doReq(t, router, http.MethodPost, base+"/auth/setup", "", map[string]string{
		"username": "owner@example.com", "password": "secret123",
	})
	ownerToken := tokenFromResponse(t, setup)

	// Create a tracked-spares item at its threshold and use one: that raises a
	// stock_low reminder which is immediately due.
	loc := doReq(t, router, http.MethodPost, base+"/locations/", ownerToken, map[string]string{
		"name": "耗材柜", "type": "furniture",
	})
	var locBody struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(loc.Body.Bytes(), &locBody); err != nil {
		t.Fatalf("decode location: %v", err)
	}
	item := doReq(t, router, http.MethodPost, base+"/items/", ownerToken, map[string]any{
		"name": "滤芯", "type": "tracked_spares", "location_id": locBody.ID,
		"current_stock": 1, "min_stock_threshold": 1,
	})
	var itemBody struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(item.Body.Bytes(), &itemBody); err != nil {
		t.Fatalf("decode item: %v", err)
	}
	if rec := doReq(t, router, http.MethodPost, base+"/items/"+itemBody.ID+"/use-one", ownerToken, nil); rec.Code != http.StatusOK {
		t.Fatalf("use-one: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	rec := doReq(t, router, http.MethodPost, base+"/notify/process-due", ownerToken, map[string]any{})
	if rec.Code != http.StatusOK {
		t.Fatalf("process-due: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var result struct {
		Processed int `json:"processed"`
		Sent      int `json:"sent"`
		Failed    int `json:"failed"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("decode process result: %v", err)
	}
	if result.Processed != 1 || result.Sent != 0 || result.Failed != 1 {
		t.Fatalf("expected processed=1 sent=0 failed=1 for unreachable webhook, got %#v", result)
	}
}
