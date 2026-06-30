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

type CategoryService struct {
	db *sql.DB
}

func NewCategoryService(db *sql.DB) *CategoryService {
	return &CategoryService{db: db}
}

type CategoryCreateInput struct {
	Name     string `json:"name"`
	Icon     string `json:"icon,omitempty"`
	RootType string `json:"root_type"`
}

type CategoryUpdateInput struct {
	Name     string `json:"name"`
	Icon     string `json:"icon"`
	RootType string `json:"root_type"`
}

func (s *CategoryService) Create(ctx context.Context, in CategoryCreateInput) (*model.Category, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, errors.New("name required")
	}
	rootType := strings.TrimSpace(in.RootType)
	if rootType != "physical" && rootType != "virtual" {
		return nil, errors.New("root_type must be 'physical' or 'virtual'")
	}

	if existing, err := s.getByName(ctx, name); err == nil {
		return existing, nil
	} else if !errors.Is(err, ErrNotFound) {
		return nil, err
	}

	id := ulid.Make().String()
	var icon any
	if strings.TrimSpace(in.Icon) != "" {
		icon = strings.TrimSpace(in.Icon)
	}
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO categories (id, name, icon, root_type, is_system, created_at) VALUES (?, ?, ?, ?, 0, ?)`,
		id, name, icon, rootType, time.Now().Unix(),
	)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *CategoryService) Update(ctx context.Context, id string, in CategoryUpdateInput) (*model.Category, error) {
	current, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, errors.New("name required")
	}
	rootType := strings.TrimSpace(in.RootType)
	if rootType != "physical" && rootType != "virtual" {
		return nil, errors.New("root_type must be 'physical' or 'virtual'")
	}

	if name != current.Name {
		if existing, err := s.getByName(ctx, name); err == nil && existing.ID != id {
			return nil, apperr.Wrapf(apperr.CodeTagNameConflict, http.StatusConflict, "category name %q already in use", name)
		} else if err != nil && !errors.Is(err, ErrNotFound) {
			return nil, err
		}
	}

	var icon any
	if strings.TrimSpace(in.Icon) != "" {
		icon = strings.TrimSpace(in.Icon)
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx,
		`UPDATE categories SET name = ?, icon = ?, root_type = ? WHERE id = ?`,
		name, icon, rootType, id,
	); err != nil {
		return nil, err
	}
	if name != current.Name {
		now := time.Now().Unix()
		if _, err := tx.ExecContext(ctx,
			`UPDATE items SET category = ?, updated_at = ? WHERE category = ?`,
			name, now, current.Name,
		); err != nil {
			return nil, err
		}
		if _, err := tx.ExecContext(ctx,
			`UPDATE items_fts SET category = ? WHERE item_id IN (SELECT id FROM items WHERE category = ?)`,
			name, name,
		); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *CategoryService) Delete(ctx context.Context, id string) error {
	current, err := s.Get(ctx, id)
	if err != nil {
		return err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx,
		`UPDATE items_fts SET category = '' WHERE item_id IN (SELECT id FROM items WHERE category = ?)`,
		current.Name,
	); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		`UPDATE items SET category = NULL, updated_at = ? WHERE category = ?`,
		time.Now().Unix(), current.Name,
	); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM categories WHERE id = ?`, id); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *CategoryService) List(ctx context.Context) ([]*model.Category, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT c.id, c.name, c.icon, c.root_type, c.is_system, c.created_at,
		       COUNT(i.id) AS usage_count
		FROM categories c
		LEFT JOIN items i ON i.category = c.name
		GROUP BY c.id
		ORDER BY c.name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Category{}
	for rows.Next() {
		cat, err := scanCategory(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, cat)
	}
	return out, rows.Err()
}

func (s *CategoryService) Get(ctx context.Context, id string) (*model.Category, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT c.id, c.name, c.icon, c.root_type, c.is_system, c.created_at,
		       COUNT(i.id) AS usage_count
		FROM categories c
		LEFT JOIN items i ON i.category = c.name
		WHERE c.id = ?
		GROUP BY c.id
	`, id)
	cat, err := scanCategory(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return cat, nil
}

func (s *CategoryService) getByName(ctx context.Context, name string) (*model.Category, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT c.id, c.name, c.icon, c.root_type, c.is_system, c.created_at,
		       COUNT(i.id) AS usage_count
		FROM categories c
		LEFT JOIN items i ON i.category = c.name
		WHERE c.name = ?
		GROUP BY c.id
	`, name)
	cat, err := scanCategory(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return cat, nil
}

type categoryScanner interface {
	Scan(dest ...any) error
}

func scanCategory(row categoryScanner) (*model.Category, error) {
	var cat model.Category
	var icon sql.NullString
	if err := row.Scan(&cat.ID, &cat.Name, &icon, &cat.RootType, &cat.IsSystem, &cat.CreatedAt, &cat.UsageCount); err != nil {
		return nil, err
	}
	if icon.Valid {
		value := icon.String
		cat.Icon = &value
	}
	return &cat, nil
}
