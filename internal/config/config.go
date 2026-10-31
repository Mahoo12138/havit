package config

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Mode    string
	Server  ServerConfig
	Data    DataConfig
	Auth    AuthConfig
	AI      AIConfig
	Storage StorageConfig
	Backup  BackupConfig
	Notify  NotifyConfig
	Barcode BarcodeConfig
}

type ServerConfig struct {
	Port        int
	BaseURL     string `mapstructure:"base_url"`
	CORSOrigins string `mapstructure:"cors_origins"`
}

type DataConfig struct {
	Dir string
}

type AuthConfig struct {
	JWTSecret          string `mapstructure:"jwt_secret"`
	SessionExpireHours int    `mapstructure:"session_expire_hours"`
}

type AIConfig struct {
	Enabled        bool
	BaseURL        string `mapstructure:"base_url"`
	APIKey         string `mapstructure:"api_key"`
	Model          string
	VisionModel    string `mapstructure:"vision_model"`
	TimeoutSeconds int    `mapstructure:"timeout_seconds"`
}

type StorageConfig struct {
	MaxPhotoSizeMB      int `mapstructure:"max_photo_size_mb"`
	MaxAttachmentSizeMB int `mapstructure:"max_attachment_size_mb"`
	MaxTotalSizeGB      int `mapstructure:"max_total_size_gb"`
}

type BackupConfig struct {
	Enabled  bool
	Cron     string
	KeepDays int `mapstructure:"keep_days"`
}

type NotifyConfig struct {
	Enabled    bool
	AppriseURL string `mapstructure:"apprise_url"`
	NtfyURL    string `mapstructure:"ntfy_url"`
	WebhookURL string `mapstructure:"webhook_url"`
}

type BarcodeConfig struct {
	OpenFoodFacts bool   `mapstructure:"open_food_facts"`
	LookupAPIKey  string `mapstructure:"lookup_api_key"`
}

func Load() (*Config, error) {
	return LoadFrom([]string{"/data", "."})
}

func LoadFrom(configPaths []string) (*Config, error) {
	v := viper.New()

	v.SetDefault("mode", "release")
	v.SetDefault("server.port", 3000)
	v.SetDefault("server.base_url", "http://localhost:3000")
	v.SetDefault("server.cors_origins", "")
	v.SetDefault("data.dir", "./data")
	v.SetDefault("auth.session_expire_hours", 720)
	v.SetDefault("ai.enabled", false)
	v.SetDefault("ai.base_url", "https://api.openai.com/v1")
	v.SetDefault("ai.model", "gpt-4o-mini")
	v.SetDefault("ai.vision_model", "gpt-4o")
	v.SetDefault("ai.timeout_seconds", 10)
	v.SetDefault("storage.max_photo_size_mb", 20)
	v.SetDefault("storage.max_attachment_size_mb", 50)
	v.SetDefault("storage.max_total_size_gb", 10)
	v.SetDefault("backup.enabled", true)
	v.SetDefault("backup.cron", "0 3 * * *")
	v.SetDefault("backup.keep_days", 30)
	v.SetDefault("notify.enabled", false)
	v.SetDefault("notify.apprise_url", "")
	v.SetDefault("notify.ntfy_url", "")
	v.SetDefault("notify.webhook_url", "")
	v.SetDefault("barcode.open_food_facts", true)
	v.SetDefault("barcode.lookup_api_key", "")

	v.SetConfigName("config")
	v.SetConfigType("yaml")
	for _, p := range configPaths {
		v.AddConfigPath(p)
	}
	if err := v.ReadInConfig(); err != nil {
		var notFound viper.ConfigFileNotFoundError
		if !errors.As(err, &notFound) {
			return nil, fmt.Errorf("read config: %w", err)
		}
	}

	v.SetEnvPrefix("HAVIT")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()
	_ = v.BindEnv("auth.jwt_secret", "HAVIT_AUTH_JWT_SECRET")
	if os.Getenv("HAVIT_MODE") == "" {
		_ = v.BindEnv("mode", "HAVIT_RUN_MODE")
	}

	var cfg Config
	_ = v.Unmarshal(&cfg)

	// The generated secret is written to <data_dir>/config.yaml, which is not
	// one of the default search paths. Read it back explicitly so a restart
	// keeps the same JWT signing key and field-encryption key.
	if cfg.Auth.JWTSecret == "" {
		if secret, err := persistedSecret(cfg.Data.Dir); err != nil {
			return nil, err
		} else if secret != "" {
			cfg.Auth.JWTSecret = secret
			v.Set("auth.jwt_secret", secret)
		}
	}

	if cfg.Auth.JWTSecret == "" {
		generated, err := generateSecret()
		if err != nil {
			return nil, err
		}
		cfg.Auth.JWTSecret = generated
		v.Set("auth.jwt_secret", cfg.Auth.JWTSecret)
		if err := os.MkdirAll(cfg.Data.Dir, 0o755); err != nil {
			return nil, fmt.Errorf("create data dir for generated secret: %w", err)
		}
		path := filepath.Join(cfg.Data.Dir, "config.yaml")
		if used := v.ConfigFileUsed(); used != "" {
			if err := v.WriteConfig(); err != nil {
				return nil, fmt.Errorf("persist generated secret to %s: %w", used, err)
			}
			if err := os.Chmod(used, 0o600); err != nil {
				slog.Warn("restrict generated config permissions", "path", used, "err", err)
			}
		} else if err := v.WriteConfigAs(path); err != nil {
			return nil, fmt.Errorf("persist generated secret to %s: %w", path, err)
		} else if err := os.Chmod(path, 0o600); err != nil {
			slog.Warn("restrict generated config permissions", "path", path, "err", err)
		}
	}

	return &cfg, nil
}

func persistedSecret(dataDir string) (string, error) {
	if dataDir == "" {
		return "", nil
	}
	path := filepath.Join(dataDir, "config.yaml")
	if _, err := os.Stat(path); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return "", nil
		}
		return "", fmt.Errorf("stat persisted config %s: %w", path, err)
	}
	v := viper.New()
	v.SetConfigFile(path)
	v.SetConfigType("yaml")
	if err := v.ReadInConfig(); err != nil {
		return "", fmt.Errorf("read persisted config %s: %w", path, err)
	}
	return strings.TrimSpace(v.GetString("auth.jwt_secret")), nil
}

func generateSecret() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate secret: %w", err)
	}
	return hex.EncodeToString(b), nil
}
