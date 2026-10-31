package db

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"

	"github.com/pressly/goose/v3"
	_ "modernc.org/sqlite"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func Open(dsn string) (*sql.DB, error) {
	d, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	for _, pragma := range []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA synchronous=NORMAL",
		"PRAGMA foreign_keys=ON",
		"PRAGMA busy_timeout=5000",
		"PRAGMA cache_size=-32000",
	} {
		if _, err := d.Exec(pragma); err != nil {
			return nil, fmt.Errorf("pragma %q: %w", pragma, err)
		}
	}
	d.SetMaxOpenConns(1)
	return d, nil
}

func Migrate(ctx context.Context, d *sql.DB) error {
	// Drop legacy schema_migrations table from the old custom migration system.
	// goose maintains its own version table (goose_db_version).
	d.Exec("DROP TABLE IF EXISTS schema_migrations")

	subFS, err := fs.Sub(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("sub fs: %w", err)
	}

	provider, err := goose.NewProvider(goose.DialectSQLite3, d, subFS)
	if err != nil {
		return fmt.Errorf("goose provider: %w", err)
	}

	results, err := provider.Up(ctx)
	if err != nil {
		return fmt.Errorf("goose up: %w", err)
	}
	for _, r := range results {
		slog.Info("migration applied", "version", r.Source.Version, "duration", r.Duration)
	}
	if err := ensureUserProfileColumns(ctx, d); err != nil {
		return err
	}
	return nil
}

// ensureUserProfileColumns repairs databases created before the pre-1.0
// migration history was flattened. The initial migration already contains
// these columns for new installs; older databases recorded goose versions
// without them, so goose has nothing to apply.
func ensureUserProfileColumns(ctx context.Context, database *sql.DB) error {
	rows, err := database.QueryContext(ctx, `PRAGMA table_info(users)`)
	if err != nil {
		return fmt.Errorf("inspect users schema: %w", err)
	}
	defer rows.Close()

	columns := map[string]bool{}
	for rows.Next() {
		var cid, notNull, pk int
		var name, columnType string
		var defaultValue any
		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultValue, &pk); err != nil {
			return fmt.Errorf("scan users schema: %w", err)
		}
		columns[name] = true
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if len(columns) == 0 {
		return fmt.Errorf("users table is missing after migration")
	}

	missing := []struct {
		name string
		ddl  string
	}{
		{"nickname", `ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT ''`},
		{"email", `ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''`},
		{"bio", `ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''`},
		{"avatar", `ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT ''`},
	}
	for _, column := range missing {
		if columns[column.name] {
			continue
		}
		if _, err := database.ExecContext(ctx, column.ddl); err != nil {
			return fmt.Errorf("add users.%s: %w", column.name, err)
		}
		slog.Info("schema compatibility column added", "table", "users", "column", column.name)
	}
	return nil
}
