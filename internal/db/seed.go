package db

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"github.com/mahoo12138/havit/internal/db/seeds"
)

const DemoPassword = "havit-demo"
const demoHashPlaceholder = "__DEMO_PASSWORD_HASH__"

func InitDemoDataIfNeeded(ctx context.Context, d *sql.DB, mode string) error {
	if mode != "demo" {
		return nil
	}

	var count int
	if err := d.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&count); err != nil {
		return fmt.Errorf("count users: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("fatal: database already initialized, refusing to start in demo mode to protect existing data")
	}

	slog.Info("demo mode: empty database detected, injecting seed data")

	hash, err := bcrypt.GenerateFromPassword([]byte(DemoPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash demo password: %w", err)
	}
	script := strings.ReplaceAll(seeds.DemoSeedSQL, demoHashPlaceholder, string(hash))

	if _, err := d.ExecContext(ctx, script); err != nil {
		return fmt.Errorf("seed injection: %w", err)
	}
	slog.Info("demo mode: seed data injected successfully")
	return nil
}
