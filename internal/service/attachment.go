package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"

	apperr "github.com/mahoo12138/havit/internal/errors"
)

var ErrAISourceProtected = apperr.ErrAISourceProtected

type AttachmentService struct {
	db      *sql.DB
	dataDir string
}

func NewAttachmentService(db *sql.DB, dataDir string) *AttachmentService {
	return &AttachmentService{db: db, dataDir: dataDir}
}

type StoreAttachmentInput struct {
	ItemID      string
	Type        model.AttachmentType
	Filename    string
	ContentType string
	Reader      io.Reader
	IsAISource  bool
}

func (s *AttachmentService) Store(ctx context.Context, in StoreAttachmentInput) (*model.Attachment, error) {
	if in.ItemID == "" {
		return nil, errors.New("item_id required")
	}
	if in.Type == "" {
		return nil, errors.New("type required")
	}
	if in.Reader == nil {
		return nil, errors.New("file required")
	}
	if _, err := NewItemService(s.db).Get(ctx, in.ItemID); err != nil {
		return nil, err
	}

	now := time.Now().Unix()
	id := ulid.Make().String()
	filename := cleanFilename(in.Filename)
	relPath := filepath.Join("attachments", in.ItemID, id+"-"+filename)
	absPath := filepath.Join(s.dataDir, relPath)
	if err := os.MkdirAll(filepath.Dir(absPath), 0o755); err != nil {
		return nil, fmt.Errorf("create attachment dir: %w", err)
	}

	file, err := os.OpenFile(absPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return nil, fmt.Errorf("create attachment file: %w", err)
	}
	size, copyErr := io.Copy(file, in.Reader)
	closeErr := file.Close()
	if copyErr != nil {
		_ = os.Remove(absPath)
		return nil, fmt.Errorf("write attachment file: %w", copyErr)
	}
	if closeErr != nil {
		_ = os.Remove(absPath)
		return nil, fmt.Errorf("close attachment file: %w", closeErr)
	}

	isAI := 0
	if in.IsAISource {
		isAI = 1
	}
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO attachments (id, item_id, type, filename, path, size, content_type, is_ai_source, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, in.ItemID, in.Type, filename, filepath.ToSlash(relPath), size, in.ContentType, isAI, now,
	)
	if err != nil {
		_ = os.Remove(absPath)
		return nil, fmt.Errorf("insert attachment: %w", err)
	}

	return s.Get(ctx, id)
}

func (s *AttachmentService) List(ctx context.Context, itemID string) ([]*model.Attachment, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, type, filename, path, size, content_type, is_ai_source, created_at
		FROM attachments WHERE item_id = ? ORDER BY created_at DESC, id DESC`, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Attachment{}
	for rows.Next() {
		att, err := scanAttachment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, att)
	}
	return out, rows.Err()
}

func (s *AttachmentService) Get(ctx context.Context, id string) (*model.Attachment, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, type, filename, path, size, content_type, is_ai_source, created_at
		FROM attachments WHERE id = ?`, id)

	att, err := scanAttachment(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return att, nil
}

func (s *AttachmentService) Open(ctx context.Context, id string) (*model.Attachment, *os.File, error) {
	att, err := s.Get(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	file, err := os.Open(filepath.Join(s.dataDir, filepath.FromSlash(att.Path)))
	if err != nil {
		return nil, nil, err
	}
	return att, file, nil
}

type attachmentScanner interface {
	Scan(dest ...any) error
}

func scanAttachment(row attachmentScanner) (*model.Attachment, error) {
	var att model.Attachment
	var isAI int
	var contentType sql.NullString
	if err := row.Scan(
		&att.ID, &att.ItemID, &att.Type, &att.Filename, &att.Path, &att.Size,
		&contentType, &isAI, &att.CreatedAt,
	); err != nil {
		return nil, err
	}
	if contentType.Valid {
		att.ContentType = contentType.String
	}
	att.URL = "/api/v1/attachments/" + att.ID + "/content"
	att.IsAISource = isAI != 0
	return &att, nil
}

func (s *AttachmentService) Delete(ctx context.Context, id string) error {
	att, err := s.Get(ctx, id)
	if err != nil {
		return err
	}
	if att.IsAISource {
		return ErrAISourceProtected
	}

	// Remove file from disk.
	if err := os.Remove(filepath.Join(s.dataDir, filepath.FromSlash(att.Path))); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove attachment file: %w", err)
	}

	if _, err := s.db.ExecContext(ctx, `DELETE FROM attachments WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete attachment record: %w", err)
	}
	return nil
}

func cleanFilename(name string) string {
	name = filepath.Base(strings.TrimSpace(name))
	if name == "." || name == string(filepath.Separator) || name == "" {
		return "attachment"
	}
	return name
}
