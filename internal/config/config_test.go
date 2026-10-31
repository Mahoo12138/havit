package config

import (
	"os"
	"path/filepath"
	"testing"
)

func mustLoad(t *testing.T, root string) *Config {
	t.Helper()
	cfg, err := LoadFrom([]string{root})
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	return cfg
}

func TestLoadGeneratesAndPersistsJWTSecretWhenDataDirDoesNotExist(t *testing.T) {
	root := t.TempDir()
	t.Setenv("HAVIT_DATA_DIR", filepath.Join(root, "data"))
	t.Setenv("HAVIT_AUTH_JWT_SECRET", "")

	cfg := mustLoad(t, root)

	if cfg.Auth.JWTSecret == "" {
		t.Fatal("expected generated jwt secret")
	}

	configPath := filepath.Join(cfg.Data.Dir, "config.yaml")
	raw, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatalf("expected generated config at %s: %v", configPath, err)
	}
	if len(raw) == 0 {
		t.Fatalf("expected generated config to be non-empty")
	}
}

func TestLoadReusesPersistedJWTSecretAcrossRestarts(t *testing.T) {
	root := t.TempDir()
	t.Setenv("HAVIT_DATA_DIR", filepath.Join(root, "data"))
	t.Setenv("HAVIT_AUTH_JWT_SECRET", "")

	first := mustLoad(t, root)
	if first.Auth.JWTSecret == "" {
		t.Fatal("expected generated jwt secret")
	}
	second := mustLoad(t, root)
	if second.Auth.JWTSecret != first.Auth.JWTSecret {
		t.Fatalf("expected persisted secret %q, got %q", first.Auth.JWTSecret, second.Auth.JWTSecret)
	}
}

func TestLoadAcceptsJWTSecretFromEnv(t *testing.T) {
	root := t.TempDir()
	dataDir := filepath.Join(root, "data")
	t.Setenv("HAVIT_DATA_DIR", dataDir)
	t.Setenv("HAVIT_AUTH_JWT_SECRET", "env-secret")

	cfg := mustLoad(t, root)
	if cfg.Auth.JWTSecret != "env-secret" {
		t.Fatalf("expected env secret, got %q", cfg.Auth.JWTSecret)
	}
	if _, err := os.Stat(filepath.Join(dataDir, "config.yaml")); !os.IsNotExist(err) {
		t.Fatalf("expected env secret not to be written to disk, stat err=%v", err)
	}
}

func TestLoadKeepsExistingJWTSecret(t *testing.T) {
	root := t.TempDir()
	dataDir := filepath.Join(root, "data")
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		t.Fatalf("create data dir: %v", err)
	}
	configPath := filepath.Join(root, "config.yaml")
	if err := os.WriteFile(configPath, []byte("auth:\n  jwt_secret: existing-secret\n"), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}
	t.Setenv("HAVIT_DATA_DIR", dataDir)
	t.Setenv("HAVIT_AUTH_JWT_SECRET", "")

	cfg := mustLoad(t, root)

	if cfg.Auth.JWTSecret != "existing-secret" {
		t.Fatalf("expected existing secret, got %q", cfg.Auth.JWTSecret)
	}
	if _, err := os.Stat(filepath.Join(dataDir, "config.yaml")); !os.IsNotExist(err) {
		t.Fatalf("expected no generated data config, stat err=%v", err)
	}
}

func TestLoadAcceptsRunModeEnvAlias(t *testing.T) {
	root := t.TempDir()
	t.Setenv("HAVIT_DATA_DIR", filepath.Join(root, "data"))
	t.Setenv("HAVIT_AUTH_JWT_SECRET", "test-secret")
	t.Setenv("HAVIT_RUN_MODE", "demo")

	cfg := mustLoad(t, root)

	if cfg.Mode != "demo" {
		t.Fatalf("expected mode from HAVIT_RUN_MODE, got %q", cfg.Mode)
	}
}

func TestLoadPrefersModeEnvOverRunModeAlias(t *testing.T) {
	root := t.TempDir()
	t.Setenv("HAVIT_DATA_DIR", filepath.Join(root, "data"))
	t.Setenv("HAVIT_AUTH_JWT_SECRET", "test-secret")
	t.Setenv("HAVIT_RUN_MODE", "demo")
	t.Setenv("HAVIT_MODE", "release")

	cfg := mustLoad(t, root)

	if cfg.Mode != "release" {
		t.Fatalf("expected HAVIT_MODE to win, got %q", cfg.Mode)
	}
}

func TestLoadRejectsMalformedConfigFile(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "config.yaml"), []byte("auth: ["), 0o644); err != nil {
		t.Fatalf("write malformed config: %v", err)
	}
	t.Setenv("HAVIT_DATA_DIR", filepath.Join(root, "data"))
	t.Setenv("HAVIT_AUTH_JWT_SECRET", "")

	if _, err := LoadFrom([]string{root}); err == nil {
		t.Fatal("expected malformed config to fail loading")
	}
}

func TestLoadRejectsMalformedPersistedSecretFile(t *testing.T) {
	root := t.TempDir()
	dataDir := filepath.Join(root, "data")
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		t.Fatalf("create data dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(dataDir, "config.yaml"), []byte("auth: ["), 0o600); err != nil {
		t.Fatalf("write malformed persisted config: %v", err)
	}
	t.Setenv("HAVIT_DATA_DIR", dataDir)
	t.Setenv("HAVIT_AUTH_JWT_SECRET", "")

	if _, err := LoadFrom([]string{root}); err == nil {
		t.Fatal("expected malformed persisted secret to fail loading")
	}
}
