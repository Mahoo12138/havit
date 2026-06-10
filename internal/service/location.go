package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"
)

type LocationService struct {
	db *sql.DB
}

func NewLocationService(db *sql.DB) *LocationService {
	return &LocationService{db: db}
}

type LocationCreateInput struct {
	Name     string  `json:"name"`
	ParentID *string `json:"parent_id,omitempty"`
	Type     string  `json:"type,omitempty"`
}

type LocationUpdateInput struct {
	Name     *string `json:"name,omitempty"`
	ParentID *string `json:"parent_id,omitempty"`
	Type     *string `json:"type,omitempty"`
}

func (s *LocationService) Create(ctx context.Context, in LocationCreateInput) (*model.Location, error) {
	if in.Name == "" {
		return nil, errors.New("name required")
	}
	if in.Type == "" {
		in.Type = "physical"
	}

	now := time.Now().Unix()
	id := ulid.Make().String()

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO locations (id, parent_id, name, type, sort_order, is_private, created_at, updated_at)
		VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
		id, in.ParentID, in.Name, in.Type, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("insert location: %w", err)
	}
	return s.Get(ctx, id)
}

func (s *LocationService) Get(ctx context.Context, id string) (*model.Location, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, parent_id, name, type, qr_code, is_private, owner_id, sort_order, created_at, updated_at
		FROM locations WHERE id = ?`, id)

	var l model.Location
	var isPrivate int
	if err := row.Scan(
		&l.ID, &l.ParentID, &l.Name, &l.Type, &l.QRCode,
		&isPrivate, &l.OwnerID, &l.SortOrder, &l.CreatedAt, &l.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	l.IsPrivate = isPrivate != 0
	return &l, nil
}

func (s *LocationService) Tree(ctx context.Context) ([]*model.Location, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, parent_id, name, type, qr_code, is_private, owner_id, sort_order, created_at, updated_at
		FROM locations ORDER BY sort_order, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	all := []*model.Location{}
	for rows.Next() {
		var l model.Location
		var isPrivate int
		if err := rows.Scan(
			&l.ID, &l.ParentID, &l.Name, &l.Type, &l.QRCode,
			&isPrivate, &l.OwnerID, &l.SortOrder, &l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			return nil, err
		}
		l.IsPrivate = isPrivate != 0
		l.Children = []*model.Location{}
		all = append(all, &l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	byID := map[string]*model.Location{}
	for _, l := range all {
		byID[l.ID] = l
	}

	roots := []*model.Location{}
	for _, l := range all {
		if l.ParentID == nil {
			roots = append(roots, l)
			continue
		}
		parent, ok := byID[*l.ParentID]
		if !ok {
			roots = append(roots, l)
			continue
		}
		parent.Children = append(parent.Children, l)
	}
	return roots, nil
}

func (s *LocationService) Update(ctx context.Context, id string, in LocationUpdateInput) (*model.Location, error) {
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	if in.Name != nil {
		cur.Name = *in.Name
	}
	if in.ParentID != nil {
		cur.ParentID = in.ParentID
	}
	if in.Type != nil {
		cur.Type = *in.Type
	}

	now := time.Now().Unix()
	_, err = s.db.ExecContext(ctx, `
		UPDATE locations SET name = ?, parent_id = ?, type = ?, updated_at = ? WHERE id = ?`,
		cur.Name, cur.ParentID, cur.Type, now, id,
	)
	if err != nil {
		return nil, err
	}
	cur.UpdatedAt = now
	return cur, nil
}

func (s *LocationService) Delete(ctx context.Context, id string) error {
	var childCount, itemCount int
	if err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM locations WHERE parent_id = ?`, id,
	).Scan(&childCount); err != nil {
		return err
	}
	if err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM items WHERE location_id = ?`, id,
	).Scan(&itemCount); err != nil {
		return err
	}
	if childCount > 0 || itemCount > 0 {
		return errors.New("location not empty")
	}

	res, err := s.db.ExecContext(ctx, `DELETE FROM locations WHERE id = ?`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *LocationService) GenerateQRCode(ctx context.Context, id string) (*model.Location, error) {
	loc, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if loc.QRCode != nil && *loc.QRCode != "" {
		return loc, nil
	}

	now := time.Now().Unix()
	for {
		code := "LOC-" + strings.ToUpper(ulid.Make().String()[16:])
		res, err := s.db.ExecContext(ctx, `
			UPDATE locations
			SET qr_code = ?, updated_at = ?
			WHERE id = ? AND qr_code IS NULL`,
			code, now, id,
		)
		if err != nil {
			if strings.Contains(err.Error(), "UNIQUE") {
				continue
			}
			return nil, err
		}
		if n, _ := res.RowsAffected(); n > 0 {
			return s.Get(ctx, id)
		}
		return s.Get(ctx, id)
	}
}

func (s *LocationService) ScanQRCode(ctx context.Context, code string) (*model.LocationScanResult, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return nil, errors.New("qr_code required")
	}

	row := s.db.QueryRowContext(ctx, `SELECT id FROM locations WHERE qr_code = ?`, code)
	var locationID string
	if err := row.Scan(&locationID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	loc, err := s.Get(ctx, locationID)
	if err != nil {
		return nil, err
	}
	locationIDs, err := s.descendantIDs(ctx, locationID)
	if err != nil {
		return nil, err
	}
	items, err := s.itemsInLocations(ctx, locationIDs)
	if err != nil {
		return nil, err
	}
	return &model.LocationScanResult{Location: loc, Items: items}, nil
}

func (s *LocationService) descendantIDs(ctx context.Context, rootID string) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, parent_id FROM locations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	children := map[string][]string{}
	for rows.Next() {
		var id string
		var parentID *string
		if err := rows.Scan(&id, &parentID); err != nil {
			return nil, err
		}
		if parentID != nil {
			children[*parentID] = append(children[*parentID], id)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	out := []string{}
	var walk func(string)
	walk = func(id string) {
		out = append(out, id)
		for _, childID := range children[id] {
			walk(childID)
		}
	}
	walk(rootID)
	return out, nil
}

func (s *LocationService) itemsInLocations(ctx context.Context, locationIDs []string) ([]*model.Item, error) {
	if len(locationIDs) == 0 {
		return []*model.Item{}, nil
	}
	placeholders := strings.TrimRight(strings.Repeat("?,", len(locationIDs)), ",")
	args := make([]any, 0, len(locationIDs))
	for _, id := range locationIDs {
		args = append(args, id)
	}

	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag,
			purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number, warranty_contact,
			current_stock, min_stock_threshold, lifespan_days, in_use_since,
			is_private, owner_id, created_at, updated_at
		FROM items
		WHERE status != ? AND location_id IN (%s)
		ORDER BY updated_at DESC, name ASC`, placeholders),
		append([]any{model.StatusArchived}, args...)...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []*model.Item{}
	for rows.Next() {
		var it model.Item
		var isPrivate int
		if err := rows.Scan(
			&it.ID, &it.Name, &it.Description, &it.Category, &it.Type, &it.Status,
			&it.LocationID, &it.HomeBaseLocationID, &it.CurrentStatusTag,
			&it.PurchasePrice, &it.PurchaseCurrency, &it.PurchaseDate, &it.PurchasePlatform,
			&it.WarrantyExpiresAt, &it.SerialNumber, &it.WarrantyContact,
			&it.CurrentStock, &it.MinStockThreshold, &it.LifespanDays, &it.InUseSince,
			&isPrivate, &it.OwnerID, &it.CreatedAt, &it.UpdatedAt,
		); err != nil {
			return nil, err
		}
		it.IsPrivate = isPrivate != 0
		applyConsumableDerivedFields(&it)
		items = append(items, &it)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	itemSvc := NewItemService(s.db)
	if err := itemSvc.loadTagsForItems(ctx, items); err != nil {
		return nil, err
	}
	return items, nil
}
