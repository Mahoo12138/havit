package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/mahoo12138/havit/internal/config"
)

func TestOpenAIProviderRecognizeItemUsesVisionRequestAndParsesDraft(t *testing.T) {
	var request struct {
		Model    string `json:"model"`
		Messages []struct {
			Role    string `json:"role"`
			Content []struct {
				Type     string `json:"type"`
				Text     string `json:"text"`
				ImageURL *struct {
					URL string `json:"url"`
				} `json:"image_url"`
			} `json:"content"`
		} `json:"messages"`
		ResponseFormat struct {
			Type string `json:"type"`
		} `json:"response_format"`
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
		if auth := r.Header.Get("Authorization"); auth != "Bearer test-key" {
			t.Fatalf("expected bearer auth, got %q", auth)
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		_, _ = w.Write([]byte(`{
			"choices": [
				{"message": {"content": "{\"name\":\"Sony 相机\",\"category\":\"数码电子\",\"description\":null}"}}
			]
		}`))
	}))
	defer server.Close()

	provider := NewOpenAIProvider(testConfigService(t, map[string]string{
		"ai.base_url":     server.URL,
		"ai.api_key":      "test-key",
		"ai.model":        "text-model",
		"ai.vision_model": "vision-model",
	}))
	draft, err := provider.RecognizeItem(context.Background(), []byte("image bytes"), "image/jpeg")
	if err != nil {
		t.Fatalf("recognize item: %v", err)
	}
	if request.Model != "vision-model" {
		t.Fatalf("expected vision model, got %q", request.Model)
	}
	if request.ResponseFormat.Type != "json_object" {
		t.Fatalf("expected json_object response format, got %q", request.ResponseFormat.Type)
	}
	if len(request.Messages) != 2 || len(request.Messages[1].Content) != 2 {
		t.Fatalf("unexpected messages: %#v", request.Messages)
	}
	imageURL := request.Messages[1].Content[1].ImageURL
	if imageURL == nil || !strings.HasPrefix(imageURL.URL, "data:image/jpeg;base64,") {
		t.Fatalf("expected image data URL, got %#v", imageURL)
	}
	if draft.Name == nil || *draft.Name != "Sony 相机" {
		t.Fatalf("expected parsed draft name, got %#v", draft)
	}
	if draft.Description != nil {
		t.Fatalf("expected null description to stay nil, got %#v", draft.Description)
	}
}

func TestOpenAIProviderParseSearchQueryParsesAndNormalizesFilter(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var request struct {
			Model string `json:"model"`
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if request.Model != "text-model" {
			t.Fatalf("expected text model, got %q", request.Model)
		}
		_, _ = w.Write([]byte(`{
			"choices": [
				{"message": {"content": "{\"keywords\":[\"相机\"],\"status\":\"idle\",\"type\":\"durable\",\"location_hint\":\"书房\",\"tags\":[\"#摄影\"],\"time_filter\":{\"field\":null,\"op\":null,\"value\":null,\"value2\":null},\"idle_days\":180,\"warranty_expiring_days\":null,\"stock_low\":false,\"sort\":\"updated_at\",\"sort_dir\":\"ASC\"}"}}
			]
		}`))
	}))
	defer server.Close()

	provider := NewOpenAIProvider(testConfigService(t, map[string]string{
		"ai.base_url":     server.URL,
		"ai.model":        "text-model",
		"ai.vision_model": "vision-model",
	}))
	filter, err := provider.ParseSearchQuery(context.Background(), "家里有哪些闲置超过半年的摄影器材")
	if err != nil {
		t.Fatalf("parse search query: %v", err)
	}
	if filter.Status == nil || *filter.Status != "idle" {
		t.Fatalf("expected idle status, got %#v", filter.Status)
	}
	if len(filter.Tags) != 1 || filter.Tags[0] != "摄影" {
		t.Fatalf("expected normalized tag, got %#v", filter.Tags)
	}
	if filter.SortDir != "asc" {
		t.Fatalf("expected normalized asc sort dir, got %q", filter.SortDir)
	}
	if filter.IdleDays == nil || *filter.IdleDays != 180 {
		t.Fatalf("expected idle days, got %#v", filter.IdleDays)
	}
}

func testConfigService(t *testing.T, values map[string]string) *config.ConfigService {
	t.Helper()

	ctx := context.Background()
	database := newTestDB(t)
	for key, value := range values {
		if _, err := database.ExecContext(ctx,
			`INSERT INTO system_configs (key, value, updated_at, updated_by) VALUES (?, ?, 1, NULL)`,
			key, value,
		); err != nil {
			t.Fatalf("set config %s: %v", key, err)
		}
	}
	return config.NewConfigService(database)
}
