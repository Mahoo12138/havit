package service

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"io"
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
	if err := db.Migrate(ctx, database); err != nil {
		t.Fatalf("migrate db: %v", err)
	}
	if _, err := database.ExecContext(ctx,
		`INSERT INTO locations (id, name, type, sort_order, is_private, created_at, updated_at)
		 VALUES ('loc-1', '书房', 'room', 0, 0, 1, 1)`); err != nil {
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

func TestBackupRestoresIntoFreshDataDir(t *testing.T) {
	ctx := context.Background()
	srcDir := t.TempDir()
	database, err := db.Open("file:" + filepath.Join(srcDir, "havit.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() { _ = database.Close() })
	if err := db.Migrate(ctx, database); err != nil {
		t.Fatalf("migrate db: %v", err)
	}
	if _, err := database.ExecContext(ctx,
		`INSERT INTO locations (id, name, type, sort_order, is_private, created_at, updated_at)
		 VALUES ('loc-1', '书房', 'room', 0, 0, 1, 1)`); err != nil {
		t.Fatalf("insert location: %v", err)
	}
	if _, err := database.ExecContext(ctx,
		`INSERT INTO items (id, name, type, status, location_id, created_at, updated_at)
		 VALUES ('item-1', '相机', 'durable', 'in_stock', 'loc-1', 1, 1)`); err != nil {
		t.Fatalf("insert item: %v", err)
	}
	attachmentDir := filepath.Join(srcDir, "attachments", "item-1")
	if err := os.MkdirAll(attachmentDir, 0o755); err != nil {
		t.Fatalf("create attachments dir: %v", err)
	}
	photo := []byte("restore-me-photo")
	if err := os.WriteFile(filepath.Join(attachmentDir, "photo.jpg"), photo, 0o644); err != nil {
		t.Fatalf("write attachment: %v", err)
	}

	result, err := NewBackupService(database, srcDir, 30).Run(ctx)
	if err != nil {
		t.Fatalf("run backup: %v", err)
	}

	// Restore into a brand-new data directory, the way a fresh deployment
	// would: unpack the archive and boot the app against it.
	restoreDir := t.TempDir()
	untarTo(t, result.Path, restoreDir)

	restored, err := db.Open("file:" + filepath.Join(restoreDir, "havit.db"))
	if err != nil {
		t.Fatalf("open restored db: %v", err)
	}
	t.Cleanup(func() { _ = restored.Close() })
	if err := db.Migrate(ctx, restored); err != nil {
		t.Fatalf("migrate restored db: %v", err)
	}

	var locationCount, itemCount int
	if err := restored.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM locations WHERE id = 'loc-1'`).Scan(&locationCount); err != nil {
		t.Fatalf("count restored locations: %v", err)
	}
	if locationCount != 1 {
		t.Fatalf("expected restored location, got %d", locationCount)
	}
	if err := restored.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM items WHERE id = 'item-1' AND status = 'in_stock'`).Scan(&itemCount); err != nil {
		t.Fatalf("count restored items: %v", err)
	}
	if itemCount != 1 {
		t.Fatalf("expected restored item, got %d", itemCount)
	}

	restoredPhoto, err := os.ReadFile(filepath.Join(restoreDir, "attachments", "item-1", "photo.jpg"))
	if err != nil {
		t.Fatalf("read restored attachment: %v", err)
	}
	if string(restoredPhoto) != string(photo) {
		t.Fatalf("restored attachment bytes differ: got %q want %q", restoredPhoto, photo)
	}
}

func untarTo(t *testing.T, archive, dest string) {
	t.Helper()
	file, err := os.Open(archive)
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
	for {
		header, err := tr.Next()
		if err != nil {
			break
		}
		target := filepath.Join(dest, filepath.FromSlash(header.Name))
		if header.Typeflag == tar.TypeDir {
			if err := os.MkdirAll(target, 0o755); err != nil {
				t.Fatalf("mkdir %s: %v", target, err)
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			t.Fatalf("mkdir parent %s: %v", target, err)
		}
		out, err := os.Create(target)
		if err != nil {
			t.Fatalf("create %s: %v", target, err)
		}
		if _, err := io.Copy(out, tr); err != nil {
			out.Close()
			t.Fatalf("extract %s: %v", target, err)
		}
		out.Close()
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
