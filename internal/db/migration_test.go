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

	if _, err := provider.Down(ctx); err != nil {
		t.Fatalf("goose down latest migration: %v", err)
	}
	if _, err := provider.Down(ctx); err != nil {
		t.Fatalf("goose down initial migration: %v", err)
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
