package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"
)

var ErrNotFound = errors.New("not found")

type ItemService struct {
	db *sql.DB
}

func NewItemService(db *sql.DB) *ItemService {
	return &ItemService{db: db}
}

type ItemCreateInput struct {
	Name             string         `json:"name"`
	Description      *string        `json:"description,omitempty"`
	Category         *string        `json:"category,omitempty"`
	Type             model.ItemType `json:"type"`
	LocationID       *string        `json:"location_id,omitempty"`
	PurchasePrice    *float64       `json:"purchase_price,omitempty"`
	PurchaseCurrency *string        `json:"purchase_currency,omitempty"`
	PurchaseDate     *int64         `json:"purchase_date,omitempty"`
	PurchasePlatform *string        `json:"purchase_platform,omitempty"`
	SerialNumber     *string        `json:"serial_number,omitempty"`
}

type ItemUpdateInput struct {
	Name             *string           `json:"name,omitempty"`
	Description      *string           `json:"description,omitempty"`
	Category         *string           `json:"category,omitempty"`
	Type             *model.ItemType   `json:"type,omitempty"`
	Status           *model.ItemStatus `json:"status,omitempty"`
	LocationID       *string           `json:"location_id,omitempty"`
	PurchasePrice    *float64          `json:"purchase_price,omitempty"`
	PurchaseCurrency *string           `json:"purchase_currency,omitempty"`
	PurchaseDate     *int64            `json:"purchase_date,omitempty"`
	PurchasePlatform *string           `json:"purchase_platform,omitempty"`
	SerialNumber     *string           `json:"serial_number,omitempty"`
}

func (s *ItemService) Create(ctx context.Context, in ItemCreateInput) (*model.Item, error) {
	if in.Name == "" {
		return nil, errors.New("name required")
	}
	if in.LocationID == nil || *in.LocationID == "" {
		return nil, errors.New("location_id required")
	}
	if in.Type == "" {
		in.Type = model.ItemTypeDurable
	}
	if !validItemType(string(in.Type)) {
		return nil, fmt.Errorf("invalid type: %s", in.Type)
	}

	now := time.Now().Unix()
	id := ulid.Make().String()

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO items (
			id, name, description, category, type, status,
			location_id, purchase_price, purchase_currency, purchase_date,
			purchase_platform, serial_number,
			is_private, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, 'in_stock', ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
		id, in.Name, in.Description, in.Category, in.Type,
		in.LocationID, in.PurchasePrice, in.PurchaseCurrency, in.PurchaseDate,
		in.PurchasePlatform, in.SerialNumber,
		now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("insert item: %w", err)
	}

	if _, err := s.db.ExecContext(ctx,
		`INSERT INTO items_fts (item_id, name, description, category, serial_number)
		 VALUES (?, ?, ?, ?, ?)`,
		id, in.Name, derefStr(in.Description), derefStr(in.Category), derefStr(in.SerialNumber),
	); err != nil {
		return nil, fmt.Errorf("insert fts: %w", err)
	}

	return s.Get(ctx, id)
}

func (s *ItemService) Get(ctx context.Context, id string) (*model.Item, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag,
			purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number,
			is_private, owner_id, created_at, updated_at
		FROM items WHERE id = ?`, id)

	var it model.Item
	var isPrivate int
	if err := row.Scan(
		&it.ID, &it.Name, &it.Description, &it.Category, &it.Type, &it.Status,
		&it.LocationID, &it.HomeBaseLocationID, &it.CurrentStatusTag,
		&it.PurchasePrice, &it.PurchaseCurrency, &it.PurchaseDate, &it.PurchasePlatform,
		&it.WarrantyExpiresAt, &it.SerialNumber,
		&isPrivate, &it.OwnerID, &it.CreatedAt, &it.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	it.IsPrivate = isPrivate != 0
	return &it, nil
}

type ItemListFilter struct {
	Query    string
	Status   string
	Type     string
	Location string
	Limit    int
	Offset   int
}

func (s *ItemService) List(ctx context.Context, f ItemListFilter) ([]*model.Item, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}

	args := []any{}
	where := "1 = 1"

	if f.Query != "" {
		where += ` AND items.id IN (SELECT item_id FROM items_fts WHERE items_fts MATCH ?)`
		args = append(args, f.Query)
	}
	if f.Status != "" {
		where += ` AND status = ?`
		args = append(args, f.Status)
	} else {
		where += ` AND status != ?`
		args = append(args, model.StatusArchived)
	}
	if f.Type != "" {
		where += ` AND type = ?`
		args = append(args, f.Type)
	}
	if f.Location != "" {
		where += ` AND location_id = ?`
		args = append(args, f.Location)
	}

	args = append(args, f.Limit, f.Offset)

	q := fmt.Sprintf(`
		SELECT id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag,
			purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number,
			is_private, owner_id, created_at, updated_at
		FROM items WHERE %s
		ORDER BY updated_at DESC
		LIMIT ? OFFSET ?`, where)

	rows, err := s.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Item{}
	for rows.Next() {
		var it model.Item
		var isPrivate int
		if err := rows.Scan(
			&it.ID, &it.Name, &it.Description, &it.Category, &it.Type, &it.Status,
			&it.LocationID, &it.HomeBaseLocationID, &it.CurrentStatusTag,
			&it.PurchasePrice, &it.PurchaseCurrency, &it.PurchaseDate, &it.PurchasePlatform,
			&it.WarrantyExpiresAt, &it.SerialNumber,
			&isPrivate, &it.OwnerID, &it.CreatedAt, &it.UpdatedAt,
		); err != nil {
			return nil, err
		}
		it.IsPrivate = isPrivate != 0
		out = append(out, &it)
	}
	return out, rows.Err()
}

func (s *ItemService) Update(ctx context.Context, id string, in ItemUpdateInput) (*model.Item, error) {
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	if in.Name != nil {
		cur.Name = *in.Name
	}
	if in.Description != nil {
		cur.Description = in.Description
	}
	if in.Category != nil {
		cur.Category = in.Category
	}
	if in.Type != nil {
		if !validItemType(string(*in.Type)) {
			return nil, fmt.Errorf("invalid type: %s", *in.Type)
		}
		cur.Type = *in.Type
	}
	if in.Status != nil {
		if !validItemStatus(*in.Status) {
			return nil, fmt.Errorf("invalid status: %s", *in.Status)
		}
		cur.Status = *in.Status
	}
	if in.LocationID != nil {
		cur.LocationID = in.LocationID
	}
	if in.PurchasePrice != nil {
		cur.PurchasePrice = in.PurchasePrice
	}
	if in.PurchaseCurrency != nil {
		cur.PurchaseCurrency = in.PurchaseCurrency
	}
	if in.PurchaseDate != nil {
		cur.PurchaseDate = in.PurchaseDate
	}
	if in.PurchasePlatform != nil {
		cur.PurchasePlatform = in.PurchasePlatform
	}
	if in.SerialNumber != nil {
		cur.SerialNumber = in.SerialNumber
	}

	now := time.Now().Unix()
	_, err = s.db.ExecContext(ctx, `
		UPDATE items SET
			name = ?, description = ?, category = ?, type = ?, status = ?,
			location_id = ?,
			purchase_price = ?, purchase_currency = ?, purchase_date = ?, purchase_platform = ?,
			serial_number = ?,
			updated_at = ?
		WHERE id = ?`,
		cur.Name, cur.Description, cur.Category, cur.Type, cur.Status,
		cur.LocationID,
		cur.PurchasePrice, cur.PurchaseCurrency, cur.PurchaseDate, cur.PurchasePlatform,
		cur.SerialNumber,
		now, id,
	)
	if err != nil {
		return nil, err
	}

	if _, err := s.db.ExecContext(ctx,
		`UPDATE items_fts SET name=?, description=?, category=?, serial_number=? WHERE item_id=?`,
		cur.Name, derefStr(cur.Description), derefStr(cur.Category), derefStr(cur.SerialNumber), id,
	); err != nil {
		return nil, err
	}

	cur.UpdatedAt = now
	return cur, nil
}

func (s *ItemService) Archive(ctx context.Context, id string) error {
	now := time.Now().Unix()
	res, err := s.db.ExecContext(ctx,
		`UPDATE items SET status = 'archived', updated_at = ? WHERE id = ?`,
		now, id,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func derefStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func validItemStatus(s model.ItemStatus) bool {
	switch s {
	case model.StatusInStock, model.StatusBorrowed, model.StatusIdle, model.StatusForSale,
		model.StatusSold, model.StatusGivenAway, model.StatusLost, model.StatusStolen,
		model.StatusUnreturned, model.StatusDamaged, model.StatusArchived:
		return true
	}
	return false
}
