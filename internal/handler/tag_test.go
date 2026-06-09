package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTagHTTPFlowCreatesListsAndAssignsItemTags(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createTag := postAuthedJSON(t, router, "/api/v1/tags/", token, map[string]string{
		"name":  "摄影",
		"color": "#4a90d9",
	})
	if createTag.Code != http.StatusCreated {
		t.Fatalf("expected tag create 201, got %d: %s", createTag.Code, createTag.Body.String())
	}
	var tag struct {
		ID    string `json:"id"`
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	decodeJSON(t, createTag, &tag)
	if tag.ID == "" || tag.Name != "摄影" || tag.Color != "#4a90d9" {
		t.Fatalf("unexpected tag response: %#v", tag)
	}

	listTags := httptest.NewRecorder()
	router.ServeHTTP(listTags, authedRequest(http.MethodGet, "/api/v1/tags/", token, nil))
	if listTags.Code != http.StatusOK {
		t.Fatalf("expected tag list 200, got %d: %s", listTags.Code, listTags.Body.String())
	}
	if !bytes.Contains(listTags.Body.Bytes(), []byte(`"name":"摄影"`)) {
		t.Fatalf("expected created tag in list, got %s", listTags.Body.String())
	}

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "Sony A7M4",
		"type":        "durable",
		"location_id": loc.ID,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	untaggedItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "HDMI 线",
		"type":        "durable",
		"location_id": loc.ID,
	})
	if untaggedItem.Code != http.StatusCreated {
		t.Fatalf("expected untagged item create 201, got %d: %s", untaggedItem.Code, untaggedItem.Body.String())
	}

	body, err := json.Marshal(map[string][]string{"tag_ids": {tag.ID}})
	if err != nil {
		t.Fatalf("marshal tag body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPut, "/api/v1/items/"+item.ID+"/tags", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	assign := httptest.NewRecorder()
	router.ServeHTTP(assign, req)
	if assign.Code != http.StatusOK {
		t.Fatalf("expected assign tags 200, got %d: %s", assign.Code, assign.Body.String())
	}
	if !bytes.Contains(assign.Body.Bytes(), []byte(`"tags":[`)) ||
		!bytes.Contains(assign.Body.Bytes(), []byte(`"name":"摄影"`)) {
		t.Fatalf("expected tagged item response, got %s", assign.Body.String())
	}

	getItem := httptest.NewRecorder()
	router.ServeHTTP(getItem, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID, token, nil))
	if getItem.Code != http.StatusOK {
		t.Fatalf("expected get item 200, got %d: %s", getItem.Code, getItem.Body.String())
	}
	if !bytes.Contains(getItem.Body.Bytes(), []byte(`"name":"摄影"`)) {
		t.Fatalf("expected get item to include tag, got %s", getItem.Body.String())
	}

	filtered := httptest.NewRecorder()
	router.ServeHTTP(filtered, authedRequest(http.MethodGet, "/api/v1/items/?tag="+tag.ID, token, nil))
	if filtered.Code != http.StatusOK {
		t.Fatalf("expected filtered items 200, got %d: %s", filtered.Code, filtered.Body.String())
	}
	if !bytes.Contains(filtered.Body.Bytes(), []byte(`Sony A7M4`)) {
		t.Fatalf("expected tagged item in filtered list, got %s", filtered.Body.String())
	}
	if bytes.Contains(filtered.Body.Bytes(), []byte(`HDMI 线`)) {
		t.Fatalf("expected untagged item to be excluded, got %s", filtered.Body.String())
	}
}
