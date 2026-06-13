package config

import (
	"context"
	"database/sql"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// configDefaults provides code-level defaults for dynamically managed keys.
// These are the tier-1 fallback for ConfigService (env > DB > these defaults).
var configDefaults = map[string]string{
	"ai.enabled":              "false",
	"ai.base_url":             "https://api.openai.com/v1",
	"ai.api_key":              "",
	"ai.model":                "gpt-4o-mini",
	"ai.vision_model":         "gpt-4o",
	"ai.timeout_seconds":      "10",
	"ai.confidence_strategy":  "strict",
	"notify.apprise_url":      "",
	"notify.webhook_url":      "",
	"notify.ntfy_url":         "",
	"storage.max_photo_size_mb": "20",
	"storage.webp_quality":    "80",
	"auth.allow_registration": "true",
}

// ConfigService implements 4-tier priority config resolution:
// Tier 4 (highest): environment variables (HAVIT_* prefix)
// Tier 3: database system_configs table (hot-reloaded, no restart needed)
// Tier 1: code defaults in configDefaults map
type ConfigService struct {
	db      *sql.DB
	mu      sync.RWMutex
	dbCache map[string]string
}

// NewConfigService creates a ConfigService and loads the initial DB cache.
func NewConfigService(db *sql.DB) *ConfigService {
	s := &ConfigService{
		db:      db,
		dbCache: make(map[string]string),
	}
	_ = s.RefreshDBCache()
	return s
}

// GetString returns the highest-priority value for key.
func (s *ConfigService) GetString(key string) string {
	if val := s.envLookup(key); val != "" {
		return val
	}
	s.mu.RLock()
	val, ok := s.dbCache[key]
	s.mu.RUnlock()
	if ok && val != "" {
		return val
	}
	return configDefaults[key]
}

// GetBool returns true if the resolved string value is "true", "1", or "yes".
func (s *ConfigService) GetBool(key string) bool {
	v := strings.ToLower(s.GetString(key))
	return v == "true" || v == "1" || v == "yes"
}

// GetInt parses the resolved value as int, returning def if parsing fails.
func (s *ConfigService) GetInt(key string, def int) int {
	if n, err := strconv.Atoi(s.GetString(key)); err == nil {
		return n
	}
	return def
}

// IsLockedByEnv reports whether key is overridden by an environment variable.
func (s *ConfigService) IsLockedByEnv(key string) bool {
	return s.envLookup(key) != ""
}

// RefreshDBCache reloads all rows from system_configs into the in-memory cache.
// Called once at startup and again after each SetDBConfig write.
func (s *ConfigService) RefreshDBCache() error {
	rows, err := s.db.Query("SELECT key, value FROM system_configs")
	if err != nil {
		return err
	}
	defer rows.Close()
	newCache := make(map[string]string)
	for rows.Next() {
		var k, v string
		if scanErr := rows.Scan(&k, &v); scanErr == nil {
			newCache[k] = v
		}
	}
	s.mu.Lock()
	s.dbCache = newCache
	s.mu.Unlock()
	return nil
}

// SetDBConfig writes or updates a key in system_configs, then refreshes the cache.
func (s *ConfigService) SetDBConfig(ctx context.Context, key, value, updatedBy string) error {
	now := time.Now().Unix()
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO system_configs (key, value, updated_at, updated_by)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(key) DO UPDATE SET
		   value      = excluded.value,
		   updated_at = excluded.updated_at,
		   updated_by = excluded.updated_by`,
		key, value, now, updatedBy,
	)
	if err != nil {
		return err
	}
	return s.RefreshDBCache()
}

// ControlledBy returns "env", "database", or "default" for a given key.
func (s *ConfigService) ControlledBy(key string) string {
	if s.IsLockedByEnv(key) {
		return "env"
	}
	s.mu.RLock()
	_, inDB := s.dbCache[key]
	s.mu.RUnlock()
	if inDB {
		return "database"
	}
	return "default"
}

func (s *ConfigService) envLookup(key string) string {
	envKey := "HAVIT_" + strings.ToUpper(strings.ReplaceAll(key, ".", "_"))
	if val, exists := os.LookupEnv(envKey); exists && val != "" {
		return val
	}
	return ""
}
