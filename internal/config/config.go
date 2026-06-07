package config

import (
	"crypto/rand"
	"encoding/hex"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server  ServerConfig
	Data    DataConfig
	Auth    AuthConfig
	AI      AIConfig
	Storage StorageConfig
	Backup  BackupConfig
}

type ServerConfig struct {
	Port    int
	BaseURL string `mapstructure:"base_url"`
}

type DataConfig struct {
	Dir string
}

type AuthConfig struct {
	JWTSecret           string `mapstructure:"jwt_secret"`
	SessionExpireHours  int    `mapstructure:"session_expire_hours"`
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

func Load() *Config {
	v := viper.New()

	v.SetDefault("server.port", 3000)
	v.SetDefault("server.base_url", "http://localhost:3000")
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

	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath("/data")
	v.AddConfigPath(".")
	_ = v.ReadInConfig()

	v.SetEnvPrefix("HAVIT")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	var cfg Config
	_ = v.Unmarshal(&cfg)

	if cfg.Auth.JWTSecret == "" {
		cfg.Auth.JWTSecret = generateSecret()
		v.Set("auth.jwt_secret", cfg.Auth.JWTSecret)
		_ = v.WriteConfigAs(filepath.Join(cfg.Data.Dir, "config.yaml"))
	}

	return &cfg
}

func generateSecret() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
