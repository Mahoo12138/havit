package db

import (
	"context"
	"database/sql"
	"io/fs"
	"path/filepath"
	"testing"

	"github.com/pressly/goose/v3"
)

func TestInitialMigrationDownRemovesSchema(t *testing.T) {
	ctx := context.Background()
	database, err := Open("file:" + filepath.Join(t.TempDir(), "havit.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Close()
	})

	subFS, err := fs.Sub(migrationsFS, "migrations")
	if err != nil {
		t.Fatalf("sub fs: %v", err)
	}
	provider, err := goose.NewProvider(goose.DialectSQLite3, database, subFS)
	if err != nil {
		t.Fatalf("goose provider: %v", err)
	}
	if _, err := provider.Up(ctx); err != nil {
		t.Fatalf("goose up: %v", err)
	}

	if _, err := provider.DownTo(ctx, 0); err != nil {
		t.Fatalf("goose down all migrations: %v", err)
	}

	for _, table := range []string{"users", "items", "locations", "system_configs", "items_fts"} {
		if tableExists(t, database, table) {
			t.Fatalf("expected %s to be removed after rolling back initial migration", table)
		}
	}
}

func tableExists(t *testing.T, database *sql.DB, name string) bool {
	t.Helper()

	var count int
	if err := database.QueryRow(
		`SELECT COUNT(*) FROM sqlite_master WHERE type IN ('table', 'view') AND name = ?`,
		name,
	).Scan(&count); err != nil {
		t.Fatalf("check table %s: %v", name, err)
	}
	return count > 0
}

func TestEnsureUserProfileColumnsRepairsLegacySchema(t *testing.T) {
	ctx := context.Background()
	database, err := Open("file:" + filepath.Join(t.TempDir(), "havit.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() { _ = database.Close() })

	if _, err := database.ExecContext(ctx, `
		CREATE TABLE users (
			id            TEXT PRIMARY KEY,
			username      TEXT NOT NULL UNIQUE,
			password      TEXT NOT NULL,
			role          TEXT NOT NULL DEFAULT 'member',
			token_version INTEGER NOT NULL DEFAULT 0,
			created_at    INTEGER NOT NULL
		)`); err != nil {
		t.Fatalf("create legacy users table: %v", err)
	}
	if err := ensureUserProfileColumns(ctx, database); err != nil {
		t.Fatalf("repair legacy users table: %v", err)
	}
	for _, column := range []string{"nickname", "email", "bio", "avatar"} {
		if !userColumnExists(t, database, column) {
			t.Fatalf("expected users.%s to be added", column)
		}
	}
}

func userColumnExists(t *testing.T, database *sql.DB, name string) bool {
	t.Helper()

	rows, err := database.Query(`PRAGMA table_info(users)`)
	if err != nil {
		t.Fatalf("inspect users schema: %v", err)
	}
	defer rows.Close()
	for rows.Next() {
		var cid, notNull, pk int
		var columnName, columnType string
		var defaultValue any
		if err := rows.Scan(&cid, &columnName, &columnType, &notNull, &defaultValue, &pk); err != nil {
			t.Fatalf("scan users schema: %v", err)
		}
		if columnName == name {
			return true
		}
	}
	return false
}
