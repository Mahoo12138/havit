package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadGeneratesAndPersistsJWTSecretWhenDataDirDoesNotExist(t *testing.T) {
	root := t.TempDir()
	t.Setenv("HAVIT_DATA_DIR", filepath.Join(root, "data"))
	t.Setenv("HAVIT_AUTH_JWT_SECRET", "")

	cfg := LoadFrom([]string{root})

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

	cfg := LoadFrom([]string{root})

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

	cfg := LoadFrom([]string{root})

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

	cfg := LoadFrom([]string{root})

	if cfg.Mode != "release" {
		t.Fatalf("expected HAVIT_MODE to win, got %q", cfg.Mode)
	}
}
