package service

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"database/sql"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type BackupService struct {
	db       *sql.DB
	dataDir  string
	keepDays int
}

func NewBackupService(db *sql.DB, dataDir string, keepDays int) *BackupService {
	return &BackupService{db: db, dataDir: dataDir, keepDays: keepDays}
}

type BackupResult struct {
	Path      string `json:"path"`
	Size      int64  `json:"size"`
	CreatedAt int64  `json:"created_at"`
}

func (s *BackupService) Run(ctx context.Context) (*BackupResult, error) {
	backupDir := filepath.Join(s.dataDir, "backups")
	if err := os.MkdirAll(backupDir, 0o755); err != nil {
		return nil, err
	}

	timestamp := time.Now().Format("2006-01-02T150405")
	tempDB := filepath.Join(backupDir, "temp_backup.db")
	finalTar := filepath.Join(backupDir, fmt.Sprintf("%s_havit.tar.gz", timestamp))
	_ = os.Remove(tempDB)

	escaped := strings.ReplaceAll(tempDB, "'", "''")
	if _, err := s.db.ExecContext(ctx, fmt.Sprintf("VACUUM INTO '%s'", escaped)); err != nil {
		return nil, fmt.Errorf("vacuum into: %w", err)
	}
	defer os.Remove(tempDB)

	if err := createTarGz(finalTar, []backupEntry{
		{path: tempDB, name: "havit.db"},
		{path: filepath.Join(s.dataDir, "attachments"), name: "attachments"},
	}); err != nil {
		return nil, fmt.Errorf("tar: %w", err)
	}

	if err := s.pruneOldBackups(); err != nil {
		return nil, err
	}

	info, err := os.Stat(finalTar)
	if err != nil {
		return nil, err
	}
	return &BackupResult{
		Path:      finalTar,
		Size:      info.Size(),
		CreatedAt: time.Now().Unix(),
	}, nil
}

func (s *BackupService) StartScheduler(ctx context.Context, cronExpr string) {
	go func() {
		for {
			next, err := nextBackupRun(time.Now(), cronExpr)
			if err != nil {
				slog.Error("backup scheduler disabled", "err", err)
				return
			}
			timer := time.NewTimer(time.Until(next))
			select {
			case <-timer.C:
				if _, err := s.Run(ctx); err != nil {
					slog.Error("scheduled backup failed", "err", err)
				}
			case <-ctx.Done():
				timer.Stop()
				return
			}
		}
	}()
}

func nextBackupRun(now time.Time, cronExpr string) (time.Time, error) {
	parts := strings.Fields(cronExpr)
	if len(parts) != 5 {
		return time.Time{}, fmt.Errorf("backup cron must have 5 fields")
	}
	if parts[2] != "*" || parts[3] != "*" || parts[4] != "*" {
		return time.Time{}, fmt.Errorf("backup cron supports daily schedules only")
	}
	minute, err := parseCronNumber(parts[0], 0, 59)
	if err != nil {
		return time.Time{}, fmt.Errorf("backup cron minute: %w", err)
	}
	hour, err := parseCronNumber(parts[1], 0, 23)
	if err != nil {
		return time.Time{}, fmt.Errorf("backup cron hour: %w", err)
	}
	next := time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, now.Location())
	if !next.After(now) {
		next = next.Add(24 * time.Hour)
	}
	return next, nil
}

func parseCronNumber(raw string, minValue, maxValue int) (int, error) {
	value, err := strconv.Atoi(raw)
	if err != nil {
		return 0, err
	}
	if value < minValue || value > maxValue {
		return 0, fmt.Errorf("value %d outside %d..%d", value, minValue, maxValue)
	}
	return value, nil
}

func (s *BackupService) pruneOldBackups() error {
	if s.keepDays <= 0 {
		return nil
	}
	backupDir := filepath.Join(s.dataDir, "backups")
	entries, err := os.ReadDir(backupDir)
	if err != nil {
		return err
	}
	cutoff := time.Now().Add(-time.Duration(s.keepDays) * 24 * time.Hour)
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), "_havit.tar.gz") {
			continue
		}
		path := filepath.Join(backupDir, entry.Name())
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if info.ModTime().Before(cutoff) {
			if err := os.Remove(path); err != nil {
				return err
			}
		}
	}
	return nil
}

type backupEntry struct {
	path string
	name string
}

func createTarGz(output string, entries []backupEntry) error {
	file, err := os.Create(output)
	if err != nil {
		return err
	}
	defer file.Close()

	gz := gzip.NewWriter(file)
	defer gz.Close()

	tw := tar.NewWriter(gz)
	defer tw.Close()

	for _, entry := range entries {
		if _, err := os.Stat(entry.path); os.IsNotExist(err) {
			continue
		} else if err != nil {
			return err
		}
		if err := addPathToTar(tw, entry.path, entry.name); err != nil {
			return err
		}
	}
	return nil
}

func addPathToTar(tw *tar.Writer, src, name string) error {
	return filepath.WalkDir(src, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		info, err := d.Info()
		if err != nil {
			return err
		}
		header, err := tar.FileInfoHeader(info, "")
		if err != nil {
			return err
		}
		rel := name
		if path != src {
			child, err := filepath.Rel(src, path)
			if err != nil {
				return err
			}
			rel = filepath.ToSlash(filepath.Join(name, child))
		}
		header.Name = rel
		if err := tw.WriteHeader(header); err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()
		_, err = io.Copy(tw, file)
		return err
	})
}
