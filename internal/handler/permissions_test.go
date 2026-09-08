package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func doReq(t *testing.T, router http.Handler, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var reader io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		reader = bytes.NewReader(raw)
	}
	req := httptest.NewRequest(method, path, reader)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	return rec
}

// newPermissionWorld sets up a release-mode router plus an owner session and a
// freshly created member session.
func newPermissionWorld(t *testing.T) (http.Handler, string, string, string, string) {
	t.Helper()
	router := newAuthTestRouterWithExternalURLs(t, "", "")
	base := "/api/v1"

	setup := doReq(t, router, http.MethodPost, base+"/auth/setup", "", map[string]string{
		"username": "owner@example.com", "password": "secret123",
	})
	if setup.Code != http.StatusCreated && setup.Code != http.StatusOK {
		t.Fatalf("setup: expected 200/201, got %d", setup.Code)
	}
	ownerToken := tokenFromResponse(t, setup)
	ownerID := userIDFromResponse(t, setup)

	createMember := doReq(t, router, http.MethodPost, base+"/users/", ownerToken, map[string]string{
		"username": "member@example.com", "password": "member123",
	})
	if createMember.Code != http.StatusCreated {
		t.Fatalf("create member: expected 201, got %d", createMember.Code)
	}
	memberID := userIDFromResponse(t, createMember)

	login := doReq(t, router, http.MethodPost, base+"/auth/login", "", map[string]string{
		"username": "member@example.com", "password": "member123",
	})
	if login.Code != http.StatusOK {
		t.Fatalf("member login: expected 200, got %d", login.Code)
	}
	memberToken := tokenFromResponse(t, login)
	return router, base, ownerToken, memberToken, ownerID + "," + memberID
}

func userIDFromResponse(t *testing.T, rec *httptest.ResponseRecorder) string {
	t.Helper()
	// Setup/login wrap the user in {"user": {...}}; user create returns the
	// user object directly. Accept both.
	var wrapped struct {
		User struct {
			ID string `json:"id"`
		} `json:"user"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &wrapped); err != nil {
		t.Fatalf("decode user response: %v", err)
	}
	if wrapped.User.ID != "" {
		return wrapped.User.ID
	}
	var direct struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &direct); err != nil {
		t.Fatalf("decode direct user response: %v", err)
	}
	if direct.ID == "" {
		t.Fatalf("expected user id in response, got %q", rec.Body.String())
	}
	return direct.ID
}

func TestOwnerOnlyRoutesRejectMembers(t *testing.T) {
	router, base, ownerToken, memberToken, ids := newPermissionWorld(t)
	parts := strings.Split(ids, ",")
	ownerID, memberID := parts[0], parts[1]

	// Owner-only routes must return 403 for members.
	memberForbidden := []struct {
		method string
		path   string
		body   any
	}{
		{http.MethodGet, base + "/users/", nil},
		{http.MethodPost, base + "/users/", map[string]string{"username": "x@x.com", "password": "x"}},
		{http.MethodDelete, base + "/users/" + ownerID, nil},
		{http.MethodPatch, base + "/users/" + ownerID + "/role", map[string]string{"role": "member"}},
		{http.MethodGet, base + "/system/configs", nil},
		{http.MethodPatch, base + "/system/configs/ai.enabled", map[string]string{"value": "true"}},
	}
	for _, tc := range memberForbidden {
		rec := doReq(t, router, tc.method, tc.path, memberToken, tc.body)
		if rec.Code != http.StatusForbidden {
			t.Errorf("%s %s: expected 403 for member, got %d", tc.method, tc.path, rec.Code)
		}
	}

	// The same routes work for the owner.
	if rec := doReq(t, router, http.MethodGet, base+"/users/", ownerToken, nil); rec.Code != http.StatusOK {
		t.Errorf("owner GET /users/: expected 200, got %d", rec.Code)
	}
	if rec := doReq(t, router, http.MethodGet, base+"/system/configs", ownerToken, nil); rec.Code != http.StatusOK {
		t.Errorf("owner GET /system/configs: expected 200, got %d", rec.Code)
	}

	// A member cannot promote/demote anyone, including via the owner's routes.
	rec := doReq(t, router, http.MethodPatch, base+"/users/"+memberID+"/role", memberToken, map[string]string{"role": "owner"})
	if rec.Code != http.StatusForbidden {
		t.Errorf("member self-promote: expected 403, got %d", rec.Code)
	}
}

func TestMemberCanManageOwnPreferences(t *testing.T) {
	router, base, _, memberToken, _ := newPermissionWorld(t)

	rec := doReq(t, router, http.MethodPatch, base+"/preferences", memberToken, map[string]string{"theme": "dark"})
	if rec.Code != http.StatusOK {
		t.Fatalf("member PATCH preferences: expected 200, got %d", rec.Code)
	}
	var prefs struct {
		Theme string `json:"theme"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &prefs); err != nil {
		t.Fatalf("decode preferences: %v", err)
	}
	if prefs.Theme != "dark" {
		t.Fatalf("expected theme dark, got %q", prefs.Theme)
	}
}

func TestUserDeletionConstraints(t *testing.T) {
	router, base, ownerToken, _, ids := newPermissionWorld(t)
	parts := strings.Split(ids, ",")
	ownerID, memberID := parts[0], parts[1]

	// The owner cannot delete or demote themselves.
	if rec := doReq(t, router, http.MethodDelete, base+"/users/"+ownerID, ownerToken, nil); rec.Code != http.StatusBadRequest {
		t.Errorf("owner delete self: expected 400, got %d", rec.Code)
	}
	if rec := doReq(t, router, http.MethodPatch, base+"/users/"+ownerID+"/role", ownerToken, map[string]string{"role": "member"}); rec.Code != http.StatusBadRequest {
		t.Errorf("owner demote self: expected 400, got %d", rec.Code)
	}
	// Role values are validated.
	if rec := doReq(t, router, http.MethodPatch, base+"/users/"+memberID+"/role", ownerToken, map[string]string{"role": "admin"}); rec.Code != http.StatusBadRequest {
		t.Errorf("invalid role: expected 400, got %d", rec.Code)
	}

	// A member with no assets can be deleted.
	if rec := doReq(t, router, http.MethodDelete, base+"/users/"+memberID, ownerToken, nil); rec.Code != http.StatusNoContent {
		t.Errorf("delete empty member: expected 204, got %d", rec.Code)
	}
}

func TestDeleteUserWithOwnedAssetsBlocked(t *testing.T) {
	router, base, ownerToken, memberToken, ids := newPermissionWorld(t)
	parts := strings.Split(ids, ",")
	memberID := parts[1]

	// The member creates a location and an item, so they own records.
	loc := doReq(t, router, http.MethodPost, base+"/locations/", memberToken, map[string]string{
		"name": "成员柜", "type": "furniture",
	})
	if loc.Code != http.StatusCreated {
		t.Fatalf("member create location: expected 201, got %d", loc.Code)
	}
	var locBody struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(loc.Body.Bytes(), &locBody); err != nil {
		t.Fatalf("decode location: %v", err)
	}
	item := doReq(t, router, http.MethodPost, base+"/items/", memberToken, map[string]any{
		"name": "成员物品", "type": "durable", "location_id": locBody.ID,
	})
	if item.Code != http.StatusCreated {
		t.Fatalf("member create item: expected 201, got %d", item.Code)
	}

	rec := doReq(t, router, http.MethodDelete, base+"/users/"+memberID, ownerToken, nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("delete member with assets: expected 400, got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "own") {
		t.Fatalf("expected a readable ownership message, got %q", rec.Body.String())
	}
}
