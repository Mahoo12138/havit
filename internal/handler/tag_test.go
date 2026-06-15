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

func TestTagHTTPUpdateAndDelete(t *testing.T) {
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
		ID         string `json:"id"`
		Color      string `json:"color"`
		UsageCount int    `json:"usage_count"`
		CreatedAt  int64  `json:"created_at"`
	}
	decodeJSON(t, createTag, &tag)
	if tag.ID == "" || tag.CreatedAt == 0 {
		t.Fatalf("expected created tag with id and created_at, got %#v", tag)
	}

	// rename + recolor
	patchBody, _ := json.Marshal(map[string]string{"name": "摄影器材", "color": "#ff8800"})
	patchReq := httptest.NewRequest(http.MethodPatch, "/api/v1/tags/"+tag.ID, bytes.NewReader(patchBody))
	patchReq.Header.Set("Authorization", "Bearer "+token)
	patchReq.Header.Set("Content-Type", "application/json")
	patchRec := httptest.NewRecorder()
	router.ServeHTTP(patchRec, patchReq)
	if patchRec.Code != http.StatusOK {
		t.Fatalf("expected patch 200, got %d: %s", patchRec.Code, patchRec.Body.String())
	}
	if !bytes.Contains(patchRec.Body.Bytes(), []byte(`"name":"摄影器材"`)) ||
		!bytes.Contains(patchRec.Body.Bytes(), []byte(`"color":"#ff8800"`)) {
		t.Fatalf("expected rename+color in response, got %s", patchRec.Body.String())
	}

	// attach to an item to test the delete refusal path
	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{"name": "书房"})
	var loc struct{ ID string `json:"id"` }
	decodeJSON(t, createLoc, &loc)
	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "Sony A7M4",
		"type":        "durable",
		"location_id": loc.ID,
	})
	var item struct{ ID string `json:"id"` }
	decodeJSON(t, createItem, &item)

	assignBody, _ := json.Marshal(map[string][]string{"tag_ids": {tag.ID}})
	assignReq := httptest.NewRequest(http.MethodPut, "/api/v1/items/"+item.ID+"/tags", bytes.NewReader(assignBody))
	assignReq.Header.Set("Authorization", "Bearer "+token)
	assignReq.Header.Set("Content-Type", "application/json")
	assignRec := httptest.NewRecorder()
	router.ServeHTTP(assignRec, assignReq)
	if assignRec.Code != http.StatusOK {
		t.Fatalf("expected assign 200, got %d: %s", assignRec.Code, assignRec.Body.String())
	}

	// list now reports usage_count = 1
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, authedRequest(http.MethodGet, "/api/v1/tags/", token, nil))
	if listRec.Code != http.StatusOK {
		t.Fatalf("expected list 200, got %d: %s", listRec.Code, listRec.Body.String())
	}
	if !bytes.Contains(listRec.Body.Bytes(), []byte(`"usage_count":1`)) {
		t.Fatalf("expected usage_count:1 in list, got %s", listRec.Body.String())
	}

	// delete while in use -> 409 tag_in_use
	deleteReq := httptest.NewRequest(http.MethodDelete, "/api/v1/tags/"+tag.ID, nil)
	deleteReq.Header.Set("Authorization", "Bearer "+token)
	deleteRec := httptest.NewRecorder()
	router.ServeHTTP(deleteRec, deleteReq)
	if deleteRec.Code != http.StatusConflict {
		t.Fatalf("expected delete-in-use 409, got %d: %s", deleteRec.Code, deleteRec.Body.String())
	}
	if !bytes.Contains(deleteRec.Body.Bytes(), []byte(`"error":"tag_in_use"`)) {
		t.Fatalf("expected tag_in_use code, got %s", deleteRec.Body.String())
	}

	// detach then delete -> 204
	detachBody, _ := json.Marshal(map[string][]string{"tag_ids": {}})
	detachReq := httptest.NewRequest(http.MethodPut, "/api/v1/items/"+item.ID+"/tags", bytes.NewReader(detachBody))
	detachReq.Header.Set("Authorization", "Bearer "+token)
	detachReq.Header.Set("Content-Type", "application/json")
	detachRec := httptest.NewRecorder()
	router.ServeHTTP(detachRec, detachReq)
	if detachRec.Code != http.StatusOK {
		t.Fatalf("expected detach 200, got %d: %s", detachRec.Code, detachRec.Body.String())
	}

	deleteOk := httptest.NewRequest(http.MethodDelete, "/api/v1/tags/"+tag.ID, nil)
	deleteOk.Header.Set("Authorization", "Bearer "+token)
	deleteOkRec := httptest.NewRecorder()
	router.ServeHTTP(deleteOkRec, deleteOk)
	if deleteOkRec.Code != http.StatusNoContent {
		t.Fatalf("expected delete 204, got %d: %s", deleteOkRec.Code, deleteOkRec.Body.String())
	}
}
