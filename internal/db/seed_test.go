package db

import (
	"context"
	"database/sql"
	"path/filepath"
	"strings"
	"testing"
)

func newSeedTestDB(t *testing.T) *sql.DB {
	t.Helper()

	database, err := Open("file:" + filepath.Join(t.TempDir(), "havit.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Close()
	})

	if err := Migrate(database); err != nil {
		t.Fatalf("migrate db: %v", err)
	}

	return database
}

func TestInitDemoDataRejectsDatabaseWithExistingLocations(t *testing.T) {
	ctx := context.Background()
	database := newSeedTestDB(t)

	if _, err := database.ExecContext(ctx, `
		INSERT INTO locations (id, name, type, created_at, updated_at)
		VALUES ('01PRODLOC000000000001', '生产位置', 'room', 1717770000, 1717770000)
	`); err != nil {
		t.Fatalf("insert existing location: %v", err)
	}

	err := InitDemoDataIfNeeded(ctx, database, "demo")
	if err == nil {
		t.Fatal("expected demo init to reject a non-empty database")
	}
	if !strings.Contains(err.Error(), "database already initialized") {
		t.Fatalf("expected initialized database error, got %v", err)
	}

	var users int
	if err := database.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&users); err != nil {
		t.Fatalf("count users: %v", err)
	}
	if users != 0 {
		t.Fatalf("expected no demo users to be inserted, got %d", users)
	}
}

func TestInitDemoDataSeedsEmptyDatabase(t *testing.T) {
	ctx := context.Background()
	database := newSeedTestDB(t)

	if err := InitDemoDataIfNeeded(ctx, database, "demo"); err != nil {
		t.Fatalf("seed empty demo database: %v", err)
	}

	var users int
	if err := database.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&users); err != nil {
		t.Fatalf("count users: %v", err)
	}
	if users != 1 {
		t.Fatalf("expected one demo user, got %d", users)
	}

	var items int
	if err := database.QueryRowContext(ctx, `SELECT COUNT(*) FROM items`).Scan(&items); err != nil {
		t.Fatalf("count items: %v", err)
	}
	if items != 5 {
		t.Fatalf("expected five demo items, got %d", items)
	}

	var virtualLocations int
	if err := database.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM locations WHERE name = '@随身' AND type = 'virtual'`,
	).Scan(&virtualLocations); err != nil {
		t.Fatalf("count virtual locations: %v", err)
	}
	if virtualLocations != 1 {
		t.Fatalf("expected @随身 virtual location, got %d", virtualLocations)
	}
}
