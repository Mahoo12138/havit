package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/config"
	"github.com/mahoo12138/havit/internal/middleware"
)

// sensitiveKeys are masked to "••••••" in GET responses.
var sensitiveKeys = map[string]bool{
	"ai.api_key":         true,
	"notify.apprise_url": true,
	"notify.webhook_url": true,
	"notify.ntfy_url":    true,
}

// knownConfigs defines the full schema of instance-level settings.
var knownConfigs = []struct {
	Key         string
	Type        string // "string" | "bool" | "int" | "sensitive" | "enum"
	Options     []string
	Description string
}{
	{Key: "ai.enabled", Type: "bool", Description: "Enable AI features"},
	{Key: "ai.base_url", Type: "string", Description: "AI API base URL"},
	{Key: "ai.api_key", Type: "sensitive", Description: "AI API key"},
	{Key: "ai.model", Type: "string", Description: "Text/chat model"},
	{Key: "ai.vision_model", Type: "string", Description: "Vision model"},
	{Key: "ai.confidence_strategy", Type: "enum", Options: []string{"strict", "relaxed"}, Description: "Hallucination guard strategy"},
	{Key: "notify.apprise_url", Type: "sensitive", Description: "Apprise server URL"},
	{Key: "notify.webhook_url", Type: "sensitive", Description: "Webhook URL"},
	{Key: "notify.ntfy_url", Type: "sensitive", Description: "Ntfy topic URL"},
	{Key: "storage.max_photo_size_mb", Type: "int", Description: "Max photo upload size (MB)"},
	{Key: "storage.webp_quality", Type: "int", Description: "Thumbnail WebP quality (1–100)"},
	{Key: "auth.allow_registration", Type: "bool", Description: "Allow new member registration"},
}

type configEntry struct {
	Key          string   `json:"key"`
	Value        string   `json:"value"`
	ControlledBy string   `json:"controlled_by"`
	CanEdit      bool     `json:"can_edit"`
	Type         string   `json:"type"`
	Options      []string `json:"options,omitempty"`
	Description  string   `json:"description"`
}

type SettingsHandler struct {
	cfgSvc *config.ConfigService
}

func NewSettingsHandler(cfgSvc *config.ConfigService) *SettingsHandler {
	return &SettingsHandler{cfgSvc: cfgSvc}
}

func (h *SettingsHandler) Mount(r chi.Router) {
	r.Route("/system/configs", func(r chi.Router) {
		r.Get("/", h.list)
		r.Patch("/{key}", h.update)
	})
}

func (h *SettingsHandler) list(w http.ResponseWriter, r *http.Request) {
	entries := make([]configEntry, 0, len(knownConfigs))
	for _, kc := range knownConfigs {
		controlledBy := h.cfgSvc.ControlledBy(kc.Key)
		rawVal := h.cfgSvc.GetString(kc.Key)
		displayVal := rawVal
		if sensitiveKeys[kc.Key] && rawVal != "" {
			displayVal = "••••••"
		}
		entries = append(entries, configEntry{
			Key:          kc.Key,
			Value:        displayVal,
			ControlledBy: controlledBy,
			CanEdit:      controlledBy != "env",
			Type:         kc.Type,
			Options:      kc.Options,
			Description:  kc.Description,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"configs": entries})
}

func (h *SettingsHandler) update(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")

	// Validate key is known
	var found bool
	for _, kc := range knownConfigs {
		if kc.Key == key {
			found = true
			break
		}
	}
	if !found {
		writeError(w, http.StatusNotFound, fmt.Errorf("unknown config key: %s", key))
		return
	}

	// Reject env-locked keys
	if h.cfgSvc.IsLockedByEnv(key) {
		writeError(w, http.StatusForbidden, fmt.Errorf("key %q is locked by environment variable", key))
		return
	}

	var body struct {
		Value string `json:"value"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	callerClaims, _ := middleware.ClaimsFrom(r.Context())
	callerID := callerClaims.UserID
	if err := h.cfgSvc.SetDBConfig(r.Context(), key, body.Value, callerID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	controlledBy := h.cfgSvc.ControlledBy(key)
	displayVal := body.Value
	if sensitiveKeys[key] && body.Value != "" {
		displayVal = "••••••"
	}
	writeJSON(w, http.StatusOK, configEntry{
		Key:          key,
		Value:        displayVal,
		ControlledBy: controlledBy,
		CanEdit:      true,
	})
}
