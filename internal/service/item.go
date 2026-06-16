package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"sort"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"

	apperr "github.com/mahoo12138/havit/internal/errors"
)

var ErrNotFound = apperr.ErrNotFound
var ErrInvalidItemType = apperr.ErrInvalidItemType

type ItemService struct {
	db *sql.DB
}

func NewItemService(db *sql.DB) *ItemService {
	return &ItemService{db: db}
}

type ItemCreateInput struct {
	Name               string         `json:"name"`
	Description        *string        `json:"description,omitempty"`
	Category           *string        `json:"category,omitempty"`
	Type               model.ItemType `json:"type"`
	LocationID         *string        `json:"location_id,omitempty"`
	HomeBaseLocationID *string        `json:"home_base_location_id,omitempty"`
	CurrentStatusTag   *string        `json:"current_status_tag,omitempty"`
	PurchasePrice      *float64       `json:"purchase_price,omitempty"`
	PurchaseCurrency   *string        `json:"purchase_currency,omitempty"`
	PurchaseDate       *int64         `json:"purchase_date,omitempty"`
	PurchasePlatform   *string        `json:"purchase_platform,omitempty"`
	SerialNumber       *string        `json:"serial_number,omitempty"`
	WarrantyExpiresAt  *int64         `json:"warranty_expires_at,omitempty"`
	WarrantyContact    *string        `json:"warranty_contact,omitempty"`
	CurrentStock       *int           `json:"current_stock,omitempty"`
	MinStockThreshold  *int           `json:"min_stock_threshold,omitempty"`
	LifespanDays       *int           `json:"lifespan_days,omitempty"`
	InUseSince         *int64         `json:"in_use_since,omitempty"`
	IsPrivate          bool           `json:"is_private,omitempty"`
	OwnerID            *string        `json:"owner_id,omitempty"`
	Metadata           json.RawMessage `json:"metadata,omitempty"`
}

type ItemUpdateInput struct {
	Name               *string           `json:"name,omitempty"`
	Description        *string           `json:"description,omitempty"`
	Category           *string           `json:"category,omitempty"`
	Type               *model.ItemType   `json:"type,omitempty"`
	Status             *model.ItemStatus `json:"status,omitempty"`
	LocationID         *string           `json:"location_id,omitempty"`
	HomeBaseLocationID *string           `json:"home_base_location_id,omitempty"`
	CurrentStatusTag   *string           `json:"current_status_tag,omitempty"`
	PurchasePrice      *float64          `json:"purchase_price,omitempty"`
	PurchaseCurrency   *string           `json:"purchase_currency,omitempty"`
	PurchaseDate       *int64            `json:"purchase_date,omitempty"`
	PurchasePlatform   *string           `json:"purchase_platform,omitempty"`
	SerialNumber       *string           `json:"serial_number,omitempty"`
	WarrantyExpiresAt  *int64            `json:"warranty_expires_at,omitempty"`
	WarrantyContact    *string           `json:"warranty_contact,omitempty"`
	CurrentStock       *int              `json:"current_stock,omitempty"`
	MinStockThreshold  *int              `json:"min_stock_threshold,omitempty"`
	LifespanDays       *int              `json:"lifespan_days,omitempty"`
	InUseSince         *int64            `json:"in_use_since,omitempty"`
	Metadata           json.RawMessage   `json:"metadata,omitempty"`
}

type PurchaseEventInput struct {
	Quantity    int      `json:"quantity"`
	Price       *float64 `json:"price,omitempty"`
	Currency    *string  `json:"currency,omitempty"`
	PurchasedAt int64    `json:"purchased_at,omitempty"`
	Notes       *string  `json:"notes,omitempty"`
}

type EDCStatusInput struct {
	CurrentStatusTag string  `json:"current_status_tag"`
	LocationID       *string `json:"location_id,omitempty"`
}

type WarrantyListFilter struct {
	ExpiringDays int
}

type LossRecordFilter struct {
	From *int64
	To   *int64
}

type LossRecord struct {
	ItemID           string           `json:"item_id"`
	Name             string           `json:"name"`
	Status           model.ItemStatus `json:"status"`
	LossDate         int64            `json:"loss_date"`
	PurchasePrice    *float64         `json:"purchase_price,omitempty"`
	PurchaseCurrency *string          `json:"purchase_currency,omitempty"`
	ExitNotes        *string          `json:"exit_notes,omitempty"`
}

type ItemExitInput struct {
	ExitType     string           `json:"exit_type"`
	Status       model.ItemStatus `json:"status,omitempty"`
	ExitDate     int64            `json:"exit_date,omitempty"`
	ExitPrice    *float64         `json:"exit_price,omitempty"`
	ExitCurrency *string          `json:"exit_currency,omitempty"`
	ExitNotes    *string          `json:"exit_notes,omitempty"`
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
	if in.Type == model.ItemTypeConsumableB && in.MinStockThreshold == nil {
		threshold := 1
		in.MinStockThreshold = &threshold
	}

	now := time.Now().Unix()
	id := ulid.Make().String()

	metadata := in.Metadata
	if len(metadata) == 0 || string(metadata) == "null" {
		metadata = json.RawMessage(`{}`)
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO items (
			id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag,
			purchase_price, purchase_currency, purchase_date,
			purchase_platform, serial_number, warranty_expires_at, warranty_contact,
			current_stock, min_stock_threshold, lifespan_days, in_use_since,
			is_private, owner_id, metadata, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, 'in_stock', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, in.Name, in.Description, in.Category, in.Type,
		in.LocationID, in.HomeBaseLocationID, in.CurrentStatusTag,
		in.PurchasePrice, in.PurchaseCurrency, in.PurchaseDate,
		in.PurchasePlatform, in.SerialNumber, in.WarrantyExpiresAt, in.WarrantyContact,
		in.CurrentStock, in.MinStockThreshold, in.LifespanDays, in.InUseSince,
		in.IsPrivate, in.OwnerID,
		string(metadata),
		now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("insert item: %w", err)
	}
	if err := s.replaceWarrantyReminders(ctx, id, in.WarrantyExpiresAt); err != nil {
		return nil, fmt.Errorf("warranty reminders: %w", err)
	}

	if _, err := s.db.ExecContext(ctx,
		`INSERT INTO items_fts (item_id, name, description, category, serial_number)
		 VALUES (?, ?, ?, ?, ?)`,
		id, in.Name, derefStr(in.Description), derefStr(in.Category), derefStr(in.SerialNumber),
	); err != nil {
		return nil, fmt.Errorf("insert fts: %w", err)
	}

	s.logEvent(ctx, id, "created", nil)

	return s.Get(ctx, id)
}

func (s *ItemService) Get(ctx context.Context, id string) (*model.Item, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag, parent_item_id,
			purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number, warranty_contact,
			exit_type, exit_date, exit_price, exit_currency, exit_notes,
			current_stock, min_stock_threshold, lifespan_days, in_use_since,
			metadata, is_private, owner_id, created_at, updated_at
		FROM items WHERE id = ?`, id)

	var it model.Item
	var isPrivate int
	var metadata string
	if err := row.Scan(
		&it.ID, &it.Name, &it.Description, &it.Category, &it.Type, &it.Status,
		&it.LocationID, &it.HomeBaseLocationID, &it.CurrentStatusTag, &it.ParentItemID,
		&it.PurchasePrice, &it.PurchaseCurrency, &it.PurchaseDate, &it.PurchasePlatform,
		&it.WarrantyExpiresAt, &it.SerialNumber, &it.WarrantyContact,
		&it.ExitType, &it.ExitDate, &it.ExitPrice, &it.ExitCurrency, &it.ExitNotes,
		&it.CurrentStock, &it.MinStockThreshold, &it.LifespanDays, &it.InUseSince,
		&metadata, &isPrivate, &it.OwnerID, &it.CreatedAt, &it.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	it.IsPrivate = isPrivate != 0
	it.Metadata = json.RawMessage(metadata)
	applyConsumableDerivedFields(&it)
	if err := s.loadTags(ctx, &it); err != nil {
		return nil, err
	}
	return &it, nil
}

type ItemListFilter struct {
	Query    string
	Status   string
	Type     string
	Location string
	Tag      string
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
		where += ` AND status NOT IN (?, ?, ?, ?, ?, ?, ?)`
		args = append(args,
			model.StatusSold,
			model.StatusGivenAway,
			model.StatusLost,
			model.StatusStolen,
			model.StatusUnreturned,
			model.StatusDamaged,
			model.StatusArchived,
		)
	}
	if f.Type != "" {
		where += ` AND type = ?`
		args = append(args, f.Type)
	}
	if f.Location != "" {
		where += ` AND location_id = ?`
		args = append(args, f.Location)
	}
	if f.Tag != "" {
		where += ` AND EXISTS (
			SELECT 1 FROM item_tags
			WHERE item_tags.item_id = items.id AND item_tags.tag_id = ?
		)`
		args = append(args, f.Tag)
	}

	args = append(args, f.Limit, f.Offset)

	q := fmt.Sprintf(`
		SELECT id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag,
			purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number, warranty_contact,
			exit_type, exit_date, exit_price, exit_currency, exit_notes,
			current_stock, min_stock_threshold, lifespan_days, in_use_since,
			metadata, is_private, owner_id, created_at, updated_at
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
		var metadata string
		if err := rows.Scan(
			&it.ID, &it.Name, &it.Description, &it.Category, &it.Type, &it.Status,
			&it.LocationID, &it.HomeBaseLocationID, &it.CurrentStatusTag,
			&it.PurchasePrice, &it.PurchaseCurrency, &it.PurchaseDate, &it.PurchasePlatform,
			&it.WarrantyExpiresAt, &it.SerialNumber, &it.WarrantyContact,
			&it.ExitType, &it.ExitDate, &it.ExitPrice, &it.ExitCurrency, &it.ExitNotes,
			&it.CurrentStock, &it.MinStockThreshold, &it.LifespanDays, &it.InUseSince,
			&metadata, &isPrivate, &it.OwnerID, &it.CreatedAt, &it.UpdatedAt,
		); err != nil {
			return nil, err
		}
		it.IsPrivate = isPrivate != 0
		it.Metadata = json.RawMessage(metadata)
		applyConsumableDerivedFields(&it)
		out = append(out, &it)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := s.loadTagsForItems(ctx, out); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *ItemService) WarrantyItems(ctx context.Context, f WarrantyListFilter) ([]*model.Item, error) {
	args := []any{model.StatusArchived}
	where := "warranty_expires_at IS NOT NULL AND status != ?"
	if f.ExpiringDays > 0 {
		where += " AND warranty_expires_at <= ?"
		args = append(args, time.Now().Add(time.Duration(f.ExpiringDays)*24*time.Hour).Unix())
	}

	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag,
			purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number, warranty_contact,
			current_stock, min_stock_threshold, lifespan_days, in_use_since,
			metadata, is_private, owner_id, created_at, updated_at
		FROM items WHERE %s
		ORDER BY warranty_expires_at ASC, name ASC`, where), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Item{}
	for rows.Next() {
		var it model.Item
		var isPrivate int
		var metadata string
		if err := rows.Scan(
			&it.ID, &it.Name, &it.Description, &it.Category, &it.Type, &it.Status,
			&it.LocationID, &it.HomeBaseLocationID, &it.CurrentStatusTag,
			&it.PurchasePrice, &it.PurchaseCurrency, &it.PurchaseDate, &it.PurchasePlatform,
			&it.WarrantyExpiresAt, &it.SerialNumber, &it.WarrantyContact,
			&it.CurrentStock, &it.MinStockThreshold, &it.LifespanDays, &it.InUseSince,
			&metadata, &isPrivate, &it.OwnerID, &it.CreatedAt, &it.UpdatedAt,
		); err != nil {
			return nil, err
		}
		it.IsPrivate = isPrivate != 0
		it.Metadata = json.RawMessage(metadata)
		applyConsumableDerivedFields(&it)
		out = append(out, &it)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := s.loadTagsForItems(ctx, out); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *ItemService) Graveyard(ctx context.Context) ([]*model.Item, error) {
	statuses := []model.ItemStatus{
		model.StatusSold,
		model.StatusGivenAway,
		model.StatusLost,
		model.StatusStolen,
		model.StatusUnreturned,
		model.StatusDamaged,
		model.StatusArchived,
	}
	placeholders := strings.TrimRight(strings.Repeat("?,", len(statuses)), ",")
	args := make([]any, 0, len(statuses))
	for _, status := range statuses {
		args = append(args, status)
	}

	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag,
			purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number, warranty_contact,
			exit_type, exit_date, exit_price, exit_currency, exit_notes,
			current_stock, min_stock_threshold, lifespan_days, in_use_since,
			metadata, is_private, owner_id, created_at, updated_at
		FROM items
		WHERE status IN (%s)
		ORDER BY COALESCE(exit_date, updated_at) DESC, name ASC`, placeholders), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Item{}
	for rows.Next() {
		var it model.Item
		var isPrivate int
		var metadata string
		if err := rows.Scan(
			&it.ID, &it.Name, &it.Description, &it.Category, &it.Type, &it.Status,
			&it.LocationID, &it.HomeBaseLocationID, &it.CurrentStatusTag,
			&it.PurchasePrice, &it.PurchaseCurrency, &it.PurchaseDate, &it.PurchasePlatform,
			&it.WarrantyExpiresAt, &it.SerialNumber, &it.WarrantyContact,
			&it.ExitType, &it.ExitDate, &it.ExitPrice, &it.ExitCurrency, &it.ExitNotes,
			&it.CurrentStock, &it.MinStockThreshold, &it.LifespanDays, &it.InUseSince,
			&metadata, &isPrivate, &it.OwnerID, &it.CreatedAt, &it.UpdatedAt,
		); err != nil {
			return nil, err
		}
		it.IsPrivate = isPrivate != 0
		it.Metadata = json.RawMessage(metadata)
		applyConsumableDerivedFields(&it)
		out = append(out, &it)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := s.loadTagsForItems(ctx, out); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *ItemService) LossRecords(ctx context.Context, f LossRecordFilter) ([]*LossRecord, error) {
	statuses := []model.ItemStatus{
		model.StatusLost,
		model.StatusStolen,
		model.StatusUnreturned,
		model.StatusDamaged,
	}
	placeholders := strings.TrimRight(strings.Repeat("?,", len(statuses)), ",")
	args := make([]any, 0, len(statuses)+2)
	for _, status := range statuses {
		args = append(args, status)
	}
	where := fmt.Sprintf("status IN (%s)", placeholders)
	if f.From != nil {
		where += " AND COALESCE(exit_date, updated_at) >= ?"
		args = append(args, *f.From)
	}
	if f.To != nil {
		where += " AND COALESCE(exit_date, updated_at) <= ?"
		args = append(args, *f.To)
	}

	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT id, name, status, COALESCE(exit_date, updated_at),
			purchase_price, purchase_currency, exit_notes
		FROM items
		WHERE %s
		ORDER BY COALESCE(exit_date, updated_at) DESC, name ASC`, where), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*LossRecord{}
	for rows.Next() {
		var record LossRecord
		if err := rows.Scan(
			&record.ItemID, &record.Name, &record.Status, &record.LossDate,
			&record.PurchasePrice, &record.PurchaseCurrency, &record.ExitNotes,
		); err != nil {
			return nil, err
		}
		out = append(out, &record)
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
	if in.HomeBaseLocationID != nil {
		cur.HomeBaseLocationID = in.HomeBaseLocationID
	}
	if in.CurrentStatusTag != nil {
		cur.CurrentStatusTag = in.CurrentStatusTag
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
	warrantyChanged := false
	if in.WarrantyExpiresAt != nil {
		cur.WarrantyExpiresAt = in.WarrantyExpiresAt
		warrantyChanged = true
	}
	if in.WarrantyContact != nil {
		cur.WarrantyContact = in.WarrantyContact
	}
	if in.CurrentStock != nil {
		cur.CurrentStock = in.CurrentStock
	}
	if in.MinStockThreshold != nil {
		cur.MinStockThreshold = in.MinStockThreshold
	}
	if in.LifespanDays != nil {
		cur.LifespanDays = in.LifespanDays
	}
	if in.InUseSince != nil {
		cur.InUseSince = in.InUseSince
	}
	if len(in.Metadata) > 0 {
		cur.Metadata = in.Metadata
	}

	now := time.Now().Unix()
	metadataStr := string(cur.Metadata)
	if metadataStr == "" {
		metadataStr = "{}"
	}
	_, err = s.db.ExecContext(ctx, `
		UPDATE items SET
			name = ?, description = ?, category = ?, type = ?, status = ?,
			location_id = ?, home_base_location_id = ?, current_status_tag = ?,
			purchase_price = ?, purchase_currency = ?, purchase_date = ?, purchase_platform = ?,
			serial_number = ?, warranty_expires_at = ?, warranty_contact = ?,
			current_stock = ?, min_stock_threshold = ?, lifespan_days = ?, in_use_since = ?,
			metadata = ?, updated_at = ?
		WHERE id = ?`,
		cur.Name, cur.Description, cur.Category, cur.Type, cur.Status,
		cur.LocationID, cur.HomeBaseLocationID, cur.CurrentStatusTag,
		cur.PurchasePrice, cur.PurchaseCurrency, cur.PurchaseDate, cur.PurchasePlatform,
		cur.SerialNumber, cur.WarrantyExpiresAt, cur.WarrantyContact,
		cur.CurrentStock, cur.MinStockThreshold, cur.LifespanDays, cur.InUseSince,
		metadataStr, now, id,
	)
	if err != nil {
		return nil, err
	}
	if warrantyChanged {
		if err := s.replaceWarrantyReminders(ctx, id, cur.WarrantyExpiresAt); err != nil {
			return nil, err
		}
	}

	if _, err := s.db.ExecContext(ctx,
		`UPDATE items_fts SET name=?, description=?, category=?, serial_number=? WHERE item_id=?`,
		cur.Name, derefStr(cur.Description), derefStr(cur.Category), derefStr(cur.SerialNumber), id,
	); err != nil {
		return nil, err
	}

	s.logEvent(ctx, id, "updated", nil)

	cur.UpdatedAt = now
	applyConsumableDerivedFields(cur)
	return cur, nil
}

func (s *ItemService) SetEDCStatus(ctx context.Context, id string, in EDCStatusInput) (*model.Item, error) {
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if cur.Type != model.ItemTypeEDC {
		return nil, ErrInvalidItemType
	}
	if in.CurrentStatusTag == "" {
		return nil, errors.New("current_status_tag required")
	}

	now := time.Now().Unix()
	_, err = s.db.ExecContext(ctx, `
		UPDATE items
		SET current_status_tag = ?, location_id = ?, updated_at = ?
		WHERE id = ?`,
		in.CurrentStatusTag, in.LocationID, now, id,
	)
	if err != nil {
		return nil, err
	}
	s.logEvent(ctx, id, "edc_status_changed", nil)
	return s.Get(ctx, id)
}

func (s *ItemService) ReturnEDCHome(ctx context.Context, id string) (*model.Item, error) {
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if cur.Type != model.ItemTypeEDC {
		return nil, ErrInvalidItemType
	}
	if cur.HomeBaseLocationID == nil || *cur.HomeBaseLocationID == "" {
		return nil, errors.New("home_base_location_id required")
	}

	now := time.Now().Unix()
	_, err = s.db.ExecContext(ctx, `
		UPDATE items
		SET current_status_tag = NULL, location_id = ?, updated_at = ?
		WHERE id = ?`,
		*cur.HomeBaseLocationID, now, id,
	)
	if err != nil {
		return nil, err
	}
	s.logEvent(ctx, id, "edc_returned_home", nil)
	return s.Get(ctx, id)
}

func (s *ItemService) PackEDCAll(ctx context.Context, locationID string) (int, error) {
	if locationID == "" {
		return 0, errors.New("location_id required")
	}
	now := time.Now().Unix()
	res, err := s.db.ExecContext(ctx, `
		UPDATE items
		SET location_id = ?, current_status_tag = 'away', updated_at = ?
		WHERE type = 'edc'
		  AND status = 'in_stock'
		  AND (home_base_location_id IS NULL OR location_id = home_base_location_id)`,
		locationID, now,
	)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return int(n), nil
}

func (s *ItemService) ReturnEDCAll(ctx context.Context) (int, error) {
	now := time.Now().Unix()
	res, err := s.db.ExecContext(ctx, `
		UPDATE items
		SET location_id = home_base_location_id, current_status_tag = NULL, updated_at = ?
		WHERE type = 'edc'
		  AND status = 'in_stock'
		  AND home_base_location_id IS NOT NULL
		  AND location_id != home_base_location_id`,
		now,
	)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return int(n), nil
}

func (s *ItemService) ListContents(ctx context.Context, containerID string) ([]*model.Item, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag,
			purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number, warranty_contact,
			exit_type, exit_date, exit_price, exit_currency, exit_notes,
			current_stock, min_stock_threshold, lifespan_days, in_use_since,
			metadata, is_private, owner_id, created_at, updated_at
		FROM items WHERE parent_item_id = ?
		ORDER BY name ASC`, containerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []*model.Item{}
	for rows.Next() {
		var it model.Item
		var isPrivate int
		var metadata string
		if err := rows.Scan(
			&it.ID, &it.Name, &it.Description, &it.Category, &it.Type, &it.Status,
			&it.LocationID, &it.HomeBaseLocationID, &it.CurrentStatusTag,
			&it.PurchasePrice, &it.PurchaseCurrency, &it.PurchaseDate, &it.PurchasePlatform,
			&it.WarrantyExpiresAt, &it.SerialNumber, &it.WarrantyContact,
			&it.ExitType, &it.ExitDate, &it.ExitPrice, &it.ExitCurrency, &it.ExitNotes,
			&it.CurrentStock, &it.MinStockThreshold, &it.LifespanDays, &it.InUseSince,
			&metadata, &isPrivate, &it.OwnerID, &it.CreatedAt, &it.UpdatedAt,
		); err != nil {
			return nil, err
		}
		it.IsPrivate = isPrivate != 0
		it.Metadata = json.RawMessage(metadata)
		applyConsumableDerivedFields(&it)
		out = append(out, &it)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := s.loadTagsForItems(ctx, out); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *ItemService) PutIntoContainer(ctx context.Context, itemID, containerID string) error {
	if itemID == containerID {
		return errors.New("an item cannot contain itself")
	}
	container, err := s.Get(ctx, containerID)
	if err != nil {
		return err
	}
	now := time.Now().Unix()
	_, err = s.db.ExecContext(ctx, `
		UPDATE items SET parent_item_id = ?, location_id = ?, updated_at = ?
		WHERE id = ?`,
		containerID, container.LocationID, now, itemID,
	)
	if err != nil {
		return err
	}
	s.logEvent(ctx, itemID, "put_into_container", nil)
	return nil
}

func (s *ItemService) RemoveFromContainer(ctx context.Context, itemID string) error {
	now := time.Now().Unix()
	res, err := s.db.ExecContext(ctx, `
		UPDATE items SET parent_item_id = NULL, updated_at = ?
		WHERE id = ?`, now, itemID,
	)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	s.logEvent(ctx, itemID, "removed_from_container", nil)
	return nil
}

func (s *ItemService) Exit(ctx context.Context, id string, in ItemExitInput) (*model.Item, error) {
	if in.ExitType == "" {
		return nil, errors.New("exit_type required")
	}
	status := in.Status
	if status == "" {
		status = statusForExitType(in.ExitType)
	}
	if !validExitStatus(status) {
		return nil, fmt.Errorf("invalid exit status: %s", status)
	}
	now := time.Now().Unix()
	if in.ExitDate == 0 {
		in.ExitDate = now
	}

	res, err := s.db.ExecContext(ctx, `
		UPDATE items SET
			status = ?,
			exit_type = ?,
			exit_date = ?,
			exit_price = ?,
			exit_currency = ?,
			exit_notes = ?,
			updated_at = ?
		WHERE id = ?`,
		status, in.ExitType, in.ExitDate, in.ExitPrice, in.ExitCurrency, in.ExitNotes, now, id,
	)
	if err != nil {
		return nil, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return nil, ErrNotFound
	}
	// Remove from FTS index so exited items are not searchable.
	_, _ = s.db.ExecContext(ctx, `DELETE FROM items_fts WHERE item_id = ?`, id)
	payload := fmt.Sprintf(`{"exit_type":%q}`, in.ExitType)
	s.logEvent(ctx, id, "exited", &payload)

	// Auto-create abnormal record for abnormal exit statuses.
	if abnormalType := abnormalTypeForStatus(status); abnormalType != "" {
		responsiblePerson := ""
		if abnormalType == "unreturned" {
			responsiblePerson = s.activeBorrowerName(ctx, id)
		}
		if err := s.createAbnormalRecord(ctx, id, abnormalType, responsiblePerson, in.ExitPrice, in.ExitCurrency); err != nil {
			slog.Warn("auto-create abnormal record failed", "item_id", id, "err", err)
		}
	}

	return s.Get(ctx, id)
}

func (s *ItemService) UseOne(ctx context.Context, id string) (*model.Item, error) {
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if cur.Type != model.ItemTypeConsumableB {
		return nil, ErrInvalidItemType
	}

	stock := 0
	if cur.CurrentStock != nil {
		stock = *cur.CurrentStock
	}
	if stock > 0 {
		stock--
	}
	usedOne := cur.CurrentStock != nil && *cur.CurrentStock > 0

	now := time.Now().Unix()
	inUseSince := now
	if cur.InUseSince != nil {
		inUseSince = *cur.InUseSince
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `
		UPDATE items
		SET current_stock = ?, in_use_since = ?, updated_at = ?
		WHERE id = ?`,
		stock, inUseSince, now, id,
	); err != nil {
		return nil, err
	}

	if usedOne && cur.LifespanDays != nil && *cur.LifespanDays > 0 {
		triggerAt := inUseSince + int64(*cur.LifespanDays)*24*60*60
		reminderID := ulid.Make().String()
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO reminders (id, item_id, type, trigger_at, is_dismissed)
			VALUES (?, ?, 'filter_life', ?, 0)`,
			reminderID, id, triggerAt,
		); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	s.logEvent(ctx, id, "used_one", nil)
	return s.Get(ctx, id)
}

func (s *ItemService) CreatePurchaseEvent(ctx context.Context, itemID string, in PurchaseEventInput) (*model.PurchaseEvent, error) {
	item, err := s.Get(ctx, itemID)
	if err != nil {
		return nil, err
	}
	if item.Type != model.ItemTypeConsumableA {
		return nil, ErrInvalidItemType
	}
	if in.Quantity <= 0 {
		in.Quantity = 1
	}
	now := time.Now().Unix()
	if in.PurchasedAt == 0 {
		in.PurchasedAt = now
	}

	id := ulid.Make().String()
	if _, err := s.db.ExecContext(ctx, `
		INSERT INTO purchase_events (id, item_id, quantity, price, currency, purchased_at, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		id, itemID, in.Quantity, in.Price, in.Currency, in.PurchasedAt, in.Notes,
	); err != nil {
		return nil, err
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE items SET updated_at = ? WHERE id = ?`, now, itemID); err != nil {
		return nil, err
	}
	return s.getPurchaseEvent(ctx, id)
}

func (s *ItemService) ListPurchaseEvents(ctx context.Context, itemID string) ([]*model.PurchaseEvent, *int64, error) {
	item, err := s.Get(ctx, itemID)
	if err != nil {
		return nil, nil, err
	}
	if item.Type != model.ItemTypeConsumableA {
		return nil, nil, ErrInvalidItemType
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, quantity, price, currency, purchased_at, notes
		FROM purchase_events
		WHERE item_id = ?
		ORDER BY purchased_at ASC, id ASC`, itemID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	events := []*model.PurchaseEvent{}
	for rows.Next() {
		event, err := scanPurchaseEvent(rows)
		if err != nil {
			return nil, nil, err
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}

	return events, nextPurchaseAt(events), nil
}

func (s *ItemService) CreateCalibrationEvent(ctx context.Context, itemID string, signal string) (*model.CalibrationEvent, error) {
	item, err := s.Get(ctx, itemID)
	if err != nil {
		return nil, err
	}
	if item.Type != model.ItemTypeConsumableA {
		return nil, ErrInvalidItemType
	}
	if signal != "almost_empty" && signal != "plenty_left" {
		return nil, errors.New("invalid calibration signal")
	}

	now := time.Now().Unix()
	id := ulid.Make().String()
	if _, err := s.db.ExecContext(ctx, `
		INSERT INTO calibration_events (id, item_id, signal, created_at)
		VALUES (?, ?, ?, ?)`,
		id, itemID, signal, now,
	); err != nil {
		return nil, err
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE items SET updated_at = ? WHERE id = ?`, now, itemID); err != nil {
		return nil, err
	}
	return s.getCalibrationEvent(ctx, id)
}

func (s *ItemService) ListCalibrationEvents(ctx context.Context, itemID string) ([]*model.CalibrationEvent, error) {
	item, err := s.Get(ctx, itemID)
	if err != nil {
		return nil, err
	}
	if item.Type != model.ItemTypeConsumableA {
		return nil, ErrInvalidItemType
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, signal, created_at
		FROM calibration_events
		WHERE item_id = ?
		ORDER BY created_at DESC, id DESC`, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := []*model.CalibrationEvent{}
	for rows.Next() {
		event, err := scanCalibrationEvent(rows)
		if err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, rows.Err()
}

func applyConsumableDerivedFields(item *model.Item) {
	if item.Type != model.ItemTypeConsumableB {
		return
	}

	threshold := 1
	if item.MinStockThreshold != nil {
		threshold = *item.MinStockThreshold
	}
	stock := 0
	if item.CurrentStock != nil {
		stock = *item.CurrentStock
	}
	item.NeedsRestock = stock < threshold

	if item.InUseSince != nil && item.LifespanDays != nil && *item.LifespanDays > 0 {
		expiresAt := *item.InUseSince + int64(*item.LifespanDays)*24*60*60
		item.LifeExpiresAt = &expiresAt
	}
}

func (s *ItemService) replaceWarrantyReminders(ctx context.Context, itemID string, expiresAt *int64) error {
	if _, err := s.db.ExecContext(ctx,
		`DELETE FROM reminders WHERE item_id = ? AND type IN ('warranty_30d', 'warranty_7d')`,
		itemID,
	); err != nil {
		return err
	}
	if expiresAt == nil {
		return nil
	}
	for _, offsetDays := range []int64{30, 7} {
		triggerAt := *expiresAt - offsetDays*24*60*60
		reminderID := ulid.Make().String()
		reminderType := fmt.Sprintf("warranty_%dd", offsetDays)
		if _, err := s.db.ExecContext(ctx, `
			INSERT INTO reminders (id, item_id, type, trigger_at, is_dismissed)
			VALUES (?, ?, ?, ?, 0)`,
			reminderID, itemID, reminderType, triggerAt,
		); err != nil {
			return err
		}
	}
	return nil
}

func (s *ItemService) getPurchaseEvent(ctx context.Context, id string) (*model.PurchaseEvent, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, quantity, price, currency, purchased_at, notes
		FROM purchase_events WHERE id = ?`, id)
	return scanPurchaseEvent(row)
}

func (s *ItemService) getCalibrationEvent(ctx context.Context, id string) (*model.CalibrationEvent, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, signal, created_at
		FROM calibration_events WHERE id = ?`, id)
	return scanCalibrationEvent(row)
}

type purchaseEventScanner interface {
	Scan(dest ...any) error
}

func scanPurchaseEvent(row purchaseEventScanner) (*model.PurchaseEvent, error) {
	var event model.PurchaseEvent
	if err := row.Scan(
		&event.ID, &event.ItemID, &event.Quantity, &event.Price, &event.Currency,
		&event.PurchasedAt, &event.Notes,
	); err != nil {
		return nil, err
	}
	return &event, nil
}

type calibrationEventScanner interface {
	Scan(dest ...any) error
}

func scanCalibrationEvent(row calibrationEventScanner) (*model.CalibrationEvent, error) {
	var event model.CalibrationEvent
	if err := row.Scan(&event.ID, &event.ItemID, &event.Signal, &event.CreatedAt); err != nil {
		return nil, err
	}
	return &event, nil
}

func nextPurchaseAt(events []*model.PurchaseEvent) *int64 {
	if len(events) < 2 {
		return nil
	}
	intervals := make([]int64, 0, len(events)-1)
	for i := 1; i < len(events); i++ {
		delta := events[i].PurchasedAt - events[i-1].PurchasedAt
		if delta > 0 {
			intervals = append(intervals, delta)
		}
	}
	if len(intervals) == 0 {
		return nil
	}
	sort.Slice(intervals, func(i, j int) bool { return intervals[i] < intervals[j] })
	median := intervals[len(intervals)/2]
	next := events[len(events)-1].PurchasedAt + median
	return &next
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
	// Remove from FTS index so archived items are not searchable.
	_, _ = s.db.ExecContext(ctx, `DELETE FROM items_fts WHERE item_id = ?`, id)
	s.logEvent(ctx, id, "archived", nil)
	return nil
}

func (s *ItemService) ReplaceTags(ctx context.Context, id string, tagIDs []string) (*model.Item, error) {
	if _, err := s.Get(ctx, id); err != nil {
		return nil, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM item_tags WHERE item_id = ?`, id); err != nil {
		return nil, err
	}

	seen := map[string]bool{}
	for _, tagID := range tagIDs {
		if tagID == "" || seen[tagID] {
			continue
		}
		seen[tagID] = true
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)`,
			id, tagID,
		); err != nil {
			return nil, err
		}
	}

	now := time.Now().Unix()
	if _, err := tx.ExecContext(ctx, `UPDATE items SET updated_at = ? WHERE id = ?`, now, id); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func derefStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

// logEvent writes an audit event to item_events. Errors are logged but not returned.
func (s *ItemService) logEvent(ctx context.Context, itemID, eventType string, payload *string) {
	eventID := ulid.Make().String()
	if _, err := s.db.ExecContext(ctx,
		`INSERT INTO item_events (id, item_id, event_type, payload, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
		eventID, itemID, eventType, payload, time.Now().Unix(),
	); err != nil {
		slog.Error("log item event", "item", itemID, "type", eventType, "err", err)
	}
}

func (s *ItemService) ListEvents(ctx context.Context, itemID string) ([]*model.ItemEvent, error) {
	if _, err := s.Get(ctx, itemID); err != nil {
		return nil, err
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, actor_id, event_type, payload, created_at
		FROM item_events
		WHERE item_id = ?
		ORDER BY created_at DESC, id DESC`, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.ItemEvent{}
	for rows.Next() {
		var ev model.ItemEvent
		if err := rows.Scan(&ev.ID, &ev.ItemID, &ev.ActorID, &ev.EventType, &ev.Payload, &ev.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, &ev)
	}
	return out, rows.Err()
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

func statusForExitType(exitType string) model.ItemStatus {
	switch exitType {
	case "sold":
		return model.StatusSold
	case "given_away":
		return model.StatusGivenAway
	case "lost":
		return model.StatusLost
	case "stolen":
		return model.StatusStolen
	case "damaged", "discarded":
		return model.StatusDamaged
	default:
		return model.StatusArchived
	}
}

func validExitStatus(s model.ItemStatus) bool {
	switch s {
	case model.StatusSold, model.StatusGivenAway, model.StatusLost, model.StatusStolen,
		model.StatusUnreturned, model.StatusDamaged, model.StatusArchived:
		return true
	}
	return false
}

func abnormalTypeForStatus(s model.ItemStatus) string {
	switch s {
	case model.StatusLost:
		return "lost"
	case model.StatusStolen:
		return "stolen"
	case model.StatusUnreturned:
		return "unreturned"
	case model.StatusDamaged:
		return "damaged"
	default:
		return ""
	}
}

func (s *ItemService) activeBorrowerName(ctx context.Context, itemID string) string {
	var name string
	err := s.db.QueryRowContext(ctx, `
		SELECT borrower_name FROM loans
		WHERE item_id = ? AND status IN ('active', 'unreturned')
		ORDER BY loaned_at DESC LIMIT 1`, itemID).Scan(&name)
	if err != nil {
		return ""
	}
	return name
}

func (s *ItemService) createAbnormalRecord(ctx context.Context, itemID, abnormalType, responsiblePerson string, estimatedLoss *float64, currency *string) error {
	now := time.Now().Unix()
	id := ulid.Make().String()
	initialStatus := initialProcessingStatusForExit(abnormalType)
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO abnormal_records (
			id, item_id, abnormal_type, processing_status,
			responsible_person, estimated_loss, estimated_loss_currency,
			recoverable_amount, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
		id, itemID, abnormalType, initialStatus,
		nilIfEmptyStr(responsiblePerson), estimatedLoss, currency,
		now, now,
	)
	return err
}

func initialProcessingStatusForExit(abnormalType string) string {
	switch abnormalType {
	case "stolen":
		return "reporting"
	case "lost":
		return "searching"
	case "unreturned":
		return "pending_compensation"
	case "damaged":
		return "scrapped"
	default:
		return "pending"
	}
}

func nilIfEmptyStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func (s *ItemService) loadTags(ctx context.Context, item *model.Item) error {
	tags, err := s.tagsForItem(ctx, item.ID)
	if err != nil {
		return err
	}
	item.Tags = tags
	return nil
}

func (s *ItemService) loadTagsForItems(ctx context.Context, items []*model.Item) error {
	for _, item := range items {
		if err := s.loadTags(ctx, item); err != nil {
			return err
		}
	}
	return nil
}

func (s *ItemService) tagsForItem(ctx context.Context, itemID string) ([]*model.Tag, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT tags.id, tags.name, tags.color
		FROM tags
		JOIN item_tags ON item_tags.tag_id = tags.id
		WHERE item_tags.item_id = ?
		ORDER BY tags.name ASC`, itemID)
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
