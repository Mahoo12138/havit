package config

import (
	"crypto/rand"
	"encoding/hex"
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
	Port       int
	BaseURL    string `mapstructure:"base_url"`
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

func Load() *Config {
	return LoadFrom([]string{"/data", "."})
}

func LoadFrom(configPaths []string) *Config {
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
	_ = v.ReadInConfig()

	v.SetEnvPrefix("HAVIT")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()
	if os.Getenv("HAVIT_MODE") == "" {
		_ = v.BindEnv("mode", "HAVIT_RUN_MODE")
	}

	var cfg Config
	_ = v.Unmarshal(&cfg)

	if cfg.Auth.JWTSecret == "" {
		cfg.Auth.JWTSecret = generateSecret()
		v.Set("auth.jwt_secret", cfg.Auth.JWTSecret)
		_ = os.MkdirAll(cfg.Data.Dir, 0o755)
		_ = v.WriteConfigAs(filepath.Join(cfg.Data.Dir, "config.yaml"))
	}

	return &cfg
}

func generateSecret() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
