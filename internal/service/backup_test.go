package service

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/mahoo12138/havit/internal/db"
)

func TestBackupRunCreatesConsistentSnapshotArchiveAndRemovesTempDB(t *testing.T) {
	ctx := context.Background()
	dataDir := t.TempDir()
	database, err := db.Open("file:" + filepath.Join(dataDir, "havit.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() { _ = database.Close() })
	if err := db.Migrate(database); err != nil {
		t.Fatalf("migrate db: %v", err)
	}
	if _, err := database.ExecContext(ctx,
		`INSERT INTO locations (id, name, type, sort_order, is_private, created_at, updated_at)
		 VALUES ('loc-1', '书房', 'physical', 0, 0, 1, 1)`); err != nil {
		t.Fatalf("insert location: %v", err)
	}
	attachmentDir := filepath.Join(dataDir, "attachments", "item-1")
	if err := os.MkdirAll(attachmentDir, 0o755); err != nil {
		t.Fatalf("create attachments dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(attachmentDir, "photo.jpg"), []byte("photo"), 0o644); err != nil {
		t.Fatalf("write attachment: %v", err)
	}

	result, err := NewBackupService(database, dataDir, 30).Run(ctx)
	if err != nil {
		t.Fatalf("run backup: %v", err)
	}
	if result.Path == "" || result.Size == 0 {
		t.Fatalf("expected backup result with path and size, got %#v", result)
	}
	if _, err := os.Stat(filepath.Join(dataDir, "backups", "temp_backup.db")); !os.IsNotExist(err) {
		t.Fatalf("expected temp backup db removed, got err=%v", err)
	}

	names := tarEntryNames(t, result.Path)
	if !names["havit.db"] {
		t.Fatalf("expected havit.db snapshot in archive, got %#v", names)
	}
	if !names["attachments/item-1/photo.jpg"] {
		t.Fatalf("expected attachment in archive, got %#v", names)
	}
}

func TestNextBackupRunSupportsDailyCron(t *testing.T) {
	now := time.Date(2026, 6, 10, 2, 30, 0, 0, time.UTC)
	next, err := nextBackupRun(now, "0 3 * * *")
	if err != nil {
		t.Fatalf("next backup run: %v", err)
	}
	want := time.Date(2026, 6, 10, 3, 0, 0, 0, time.UTC)
	if !next.Equal(want) {
		t.Fatalf("expected %s, got %s", want, next)
	}

	afterToday := time.Date(2026, 6, 10, 3, 1, 0, 0, time.UTC)
	next, err = nextBackupRun(afterToday, "0 3 * * *")
	if err != nil {
		t.Fatalf("next backup run after today: %v", err)
	}
	want = time.Date(2026, 6, 11, 3, 0, 0, 0, time.UTC)
	if !next.Equal(want) {
		t.Fatalf("expected %s, got %s", want, next)
	}
}

func TestNextBackupRunRejectsUnsupportedCron(t *testing.T) {
	if _, err := nextBackupRun(time.Now(), "*/15 * * * *"); err == nil {
		t.Fatal("expected stepped cron to be rejected")
	}
	if _, err := nextBackupRun(time.Now(), "0 3 * *"); err == nil {
		t.Fatal("expected incomplete cron to be rejected")
	}
}

func tarEntryNames(t *testing.T, path string) map[string]bool {
	t.Helper()
	file, err := os.Open(path)
	if err != nil {
		t.Fatalf("open archive: %v", err)
	}
	defer file.Close()
	gz, err := gzip.NewReader(file)
	if err != nil {
		t.Fatalf("open gzip: %v", err)
	}
	defer gz.Close()
	tr := tar.NewReader(gz)
	out := map[string]bool{}
	for {
		header, err := tr.Next()
		if err != nil {
			break
		}
		out[header.Name] = true
	}
	return out
}
