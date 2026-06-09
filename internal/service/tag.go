package service

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"
)

type TagService struct {
	db *sql.DB
}

func NewTagService(db *sql.DB) *TagService {
	return &TagService{db: db}
}

type TagCreateInput struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

func (s *TagService) Create(ctx context.Context, in TagCreateInput) (*model.Tag, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, errors.New("name required")
	}

	if existing, err := s.getByName(ctx, name); err == nil {
		return existing, nil
	} else if !errors.Is(err, ErrNotFound) {
		return nil, err
	}

	id := ulid.Make().String()
	var color any
	if strings.TrimSpace(in.Color) != "" {
		color = strings.TrimSpace(in.Color)
	}
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`,
		id, name, color,
	)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *TagService) List(ctx context.Context) ([]*model.Tag, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, color FROM tags ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Tag{}
	for rows.Next() {
		tag, err := scanTag(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, tag)
	}
	return out, rows.Err()
}

func (s *TagService) Get(ctx context.Context, id string) (*model.Tag, error) {
	row := s.db.QueryRowContext(ctx, `SELECT id, name, color FROM tags WHERE id = ?`, id)
	tag, err := scanTag(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return tag, nil
}

func (s *TagService) getByName(ctx context.Context, name string) (*model.Tag, error) {
	row := s.db.QueryRowContext(ctx, `SELECT id, name, color FROM tags WHERE name = ?`, name)
	tag, err := scanTag(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return tag, nil
}

type tagScanner interface {
	Scan(dest ...any) error
}

func scanTag(row tagScanner) (*model.Tag, error) {
	var tag model.Tag
	var color sql.NullString
	if err := row.Scan(&tag.ID, &tag.Name, &color); err != nil {
		return nil, err
	}
	if color.Valid {
		value := color.String
		tag.Color = &value
	}
	return &tag, nil
}
