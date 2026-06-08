package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"strings"
	"testing"
)

func TestPhotoUploadListAndReadHTTPFlow(t *testing.T) {
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

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "相机",
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

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, mime.QEncoding.Encode("utf-8", "camera.jpg")))
	header.Set("Content-Type", "image/jpeg")
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	if _, err := part.Write([]byte("fake-jpeg")); err != nil {
		t.Fatalf("write form file: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := authedRequest(http.MethodPost, "/api/v1/items/"+item.ID+"/photos", token, strings.NewReader(body.String()))
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected photo upload 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var uploaded struct {
		ID          string `json:"id"`
		URL         string `json:"url"`
		ContentType string `json:"content_type"`
	}
	decodeJSON(t, rec, &uploaded)
	if uploaded.ID == "" || uploaded.URL == "" || uploaded.ContentType != "image/jpeg" {
		t.Fatalf("unexpected upload response: %#v", uploaded)
	}

	list := httptest.NewRecorder()
	router.ServeHTTP(list, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID+"/attachments", token, nil))
	if list.Code != http.StatusOK {
		t.Fatalf("expected attachment list 200, got %d: %s", list.Code, list.Body.String())
	}
	var listed struct {
		Attachments []struct {
			ID string `json:"id"`
		} `json:"attachments"`
	}
	if err := json.Unmarshal(list.Body.Bytes(), &listed); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(listed.Attachments) != 1 || listed.Attachments[0].ID != uploaded.ID {
		t.Fatalf("expected uploaded attachment in list, got %s", list.Body.String())
	}

	read := httptest.NewRecorder()
	router.ServeHTTP(read, authedRequest(http.MethodGet, uploaded.URL, token, nil))
	if read.Code != http.StatusOK {
		t.Fatalf("expected attachment read 200, got %d: %s", read.Code, read.Body.String())
	}
	if read.Body.String() != "fake-jpeg" {
		t.Fatalf("unexpected attachment content: %q", read.Body.String())
	}
	if got := read.Header().Get("Content-Type"); got != "image/jpeg" {
		t.Fatalf("expected image/jpeg content-type, got %q", got)
	}
}

func TestPhotoUploadRejectsNonImageFile(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)
	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "相机",
		"type":        "durable",
		"location_id": loc.ID,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", `form-data; name="file"; filename="note.txt"`)
	header.Set("Content-Type", "text/plain")
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("create part: %v", err)
	}
	if _, err := part.Write([]byte("not an image")); err != nil {
		t.Fatalf("write part: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := authedRequest(http.MethodPost, "/api/v1/items/"+item.ID+"/photos", token, strings.NewReader(body.String()))
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected non-image upload 400, got %d: %s", rec.Code, rec.Body.String())
	}
}
