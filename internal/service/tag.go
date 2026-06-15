package service

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"

	apperr "github.com/mahoo12138/havit/internal/errors"
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

type TagUpdateInput struct {
	Name  string `json:"name"`
	Color string `json:"color"`
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
		`INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
		id, name, color, time.Now().Unix(),
	)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *TagService) Update(ctx context.Context, id string, in TagUpdateInput) (*model.Tag, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, errors.New("name required")
	}

	current, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	if name != current.Name {
		if existing, err := s.getByName(ctx, name); err == nil && existing.ID != id {
			return nil, apperr.Wrapf(apperr.CodeTagNameConflict, http.StatusConflict, "tag name %q already in use", name)
		} else if err != nil && !errors.Is(err, ErrNotFound) {
			return nil, err
		}
	}

	var color any
	if strings.TrimSpace(in.Color) != "" {
		color = strings.TrimSpace(in.Color)
	}

	if _, err := s.db.ExecContext(ctx,
		`UPDATE tags SET name = ?, color = ? WHERE id = ?`,
		name, color, id,
	); err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *TagService) Delete(ctx context.Context, id string) error {
	if _, err := s.Get(ctx, id); err != nil {
		return err
	}
	var usage int
	if err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM item_tags WHERE tag_id = ?`, id,
	).Scan(&usage); err != nil {
		return err
	}
	if usage > 0 {
		return apperr.Wrapf(apperr.CodeTagInUse, http.StatusConflict,
			"tag is in use by %d item(s); remove the tag from items before deleting", usage)
	}
	_, err := s.db.ExecContext(ctx, `DELETE FROM tags WHERE id = ?`, id)
	return err
}

func (s *TagService) List(ctx context.Context) ([]*model.Tag, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT t.id, t.name, t.color, t.created_at, COUNT(it.item_id) AS usage_count
		FROM tags t
		LEFT JOIN item_tags it ON it.tag_id = t.id
		GROUP BY t.id
		ORDER BY t.name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Tag{}
	for rows.Next() {
		tag, err := scanTagWithUsage(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, tag)
	}
	return out, rows.Err()
}

func (s *TagService) Get(ctx context.Context, id string) (*model.Tag, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT t.id, t.name, t.color, t.created_at, COUNT(it.item_id) AS usage_count
		FROM tags t
		LEFT JOIN item_tags it ON it.tag_id = t.id
		WHERE t.id = ?
		GROUP BY t.id
	`, id)
	tag, err := scanTagWithUsage(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return tag, nil
}

func (s *TagService) getByName(ctx context.Context, name string) (*model.Tag, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT t.id, t.name, t.color, t.created_at, COUNT(it.item_id) AS usage_count
		FROM tags t
		LEFT JOIN item_tags it ON it.tag_id = t.id
		WHERE t.name = ?
		GROUP BY t.id
	`, name)
	tag, err := scanTagWithUsage(row)
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

func scanTagWithUsage(row tagScanner) (*model.Tag, error) {
	var tag model.Tag
	var color sql.NullString
	if err := row.Scan(&tag.ID, &tag.Name, &color, &tag.CreatedAt, &tag.UsageCount); err != nil {
		return nil, err
	}
	if color.Valid {
		value := color.String
		tag.Color = &value
	}
	return &tag, nil
}
