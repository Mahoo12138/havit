package service

import (
	"context"
	"database/sql"
	"encoding/csv"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/mahoo12138/havit/internal/model"
)

type ExportFormat string

const (
	ExportCSV  ExportFormat = "csv"
	ExportJSON ExportFormat = "json"
)

type ExportService struct {
	db *sql.DB
}

func NewExportService(db *sql.DB) *ExportService {
	return &ExportService{db: db}
}

type ItemsExport struct {
	ExportedAt         int64                         `json:"exported_at"`
	Items              []ExportItem                  `json:"items"`
	PurchaseEvents     []*model.PurchaseEvent        `json:"purchase_events,omitempty"`
	CalibrationEvents  []*model.CalibrationEvent     `json:"calibration_events,omitempty"`
	Loans              []*model.Loan                 `json:"loans,omitempty"`
	VirtualCredentials []*model.VirtualCredential    `json:"virtual_credentials,omitempty"`
	VirtualAddons      []*model.VirtualAddonPurchase `json:"virtual_addons,omitempty"`
	Reminders          []*model.Reminder             `json:"reminders,omitempty"`
}

type ExportItem struct {
	ID                string       `json:"id"`
	Name              string       `json:"name"`
	Type              string       `json:"type"`
	Status            string       `json:"status"`
	Category          *string      `json:"category,omitempty"`
	Description       *string      `json:"description,omitempty"`
	LocationID        *string      `json:"location_id,omitempty"`
	LocationPath      *string      `json:"location_path,omitempty"`
	PurchasePrice     *float64     `json:"purchase_price,omitempty"`
	PurchaseCurrency  *string      `json:"purchase_currency,omitempty"`
	PurchaseDate      *int64       `json:"purchase_date,omitempty"`
	PurchasePlatform  *string      `json:"purchase_platform,omitempty"`
	WarrantyExpiresAt *int64       `json:"warranty_expires_at,omitempty"`
	SerialNumber      *string      `json:"serial_number,omitempty"`
	WarrantyContact   *string      `json:"warranty_contact,omitempty"`
	ExitType          *string      `json:"exit_type,omitempty"`
	ExitDate          *int64       `json:"exit_date,omitempty"`
	ExitPrice         *float64     `json:"exit_price,omitempty"`
	ExitCurrency      *string      `json:"exit_currency,omitempty"`
	ExitNotes         *string      `json:"exit_notes,omitempty"`
	CurrentStock      *int         `json:"current_stock,omitempty"`
	MinStockThreshold *int         `json:"min_stock_threshold,omitempty"`
	LifespanDays      *int         `json:"lifespan_days,omitempty"`
	InUseSince        *int64       `json:"in_use_since,omitempty"`
	IsPrivate         bool         `json:"is_private"`
	OwnerID           *string      `json:"owner_id,omitempty"`
	CreatedAt         int64        `json:"created_at"`
	UpdatedAt         int64        `json:"updated_at"`
	Tags              []*model.Tag `json:"tags,omitempty"`
}

func (s *ExportService) Items(ctx context.Context) (*ItemsExport, error) {
	locationPaths, err := s.locationPaths(ctx)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, name, description, category, type, status,
			location_id, purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number, warranty_contact,
			exit_type, exit_date, exit_price, exit_currency, exit_notes,
			current_stock, min_stock_threshold, lifespan_days, in_use_since,
			is_private, owner_id, created_at, updated_at
		FROM items
		ORDER BY updated_at DESC, name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []ExportItem{}
	for rows.Next() {
		var item ExportItem
		var isPrivate int
		if err := rows.Scan(
			&item.ID, &item.Name, &item.Description, &item.Category, &item.Type, &item.Status,
			&item.LocationID, &item.PurchasePrice, &item.PurchaseCurrency, &item.PurchaseDate,
			&item.PurchasePlatform, &item.WarrantyExpiresAt, &item.SerialNumber,
			&item.WarrantyContact,
			&item.ExitType, &item.ExitDate, &item.ExitPrice, &item.ExitCurrency, &item.ExitNotes,
			&item.CurrentStock, &item.MinStockThreshold, &item.LifespanDays, &item.InUseSince,
			&isPrivate, &item.OwnerID, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		item.IsPrivate = isPrivate != 0
		if item.LocationID != nil {
			if path, ok := locationPaths[*item.LocationID]; ok {
				item.LocationPath = &path
			}
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}

	tags, err := s.tagsForItems(ctx)
	if err != nil {
		return nil, err
	}
	for i := range items {
		items[i].Tags = tags[items[i].ID]
	}
	purchaseEvents, err := s.purchaseEvents(ctx)
	if err != nil {
		return nil, err
	}
	calibrationEvents, err := s.calibrationEvents(ctx)
	if err != nil {
		return nil, err
	}
	loans, err := s.loans(ctx)
	if err != nil {
		return nil, err
	}
	virtualCredentials, err := s.virtualCredentials(ctx)
	if err != nil {
		return nil, err
	}
	virtualAddons, err := s.virtualAddons(ctx)
	if err != nil {
		return nil, err
	}
	reminders, err := s.reminders(ctx)
	if err != nil {
		return nil, err
	}

	return &ItemsExport{
		ExportedAt:         time.Now().Unix(),
		Items:              items,
		PurchaseEvents:     purchaseEvents,
		CalibrationEvents:  calibrationEvents,
		Loans:              loans,
		VirtualCredentials: virtualCredentials,
		VirtualAddons:      virtualAddons,
		Reminders:          reminders,
	}, nil
}

func WriteItemsCSV(w io.Writer, items []ExportItem) error {
	cw := csv.NewWriter(w)
	header := []string{
		"name", "type", "status", "category", "description",
		"location_id", "location_path",
		"purchase_price", "purchase_currency", "purchase_date", "purchase_platform",
		"warranty_expires_at", "serial_number", "warranty_contact",
		"exit_type", "exit_date", "exit_price", "exit_currency", "exit_notes",
		"tags",
		"current_stock", "min_stock_threshold", "lifespan_days", "in_use_since",
		"is_private", "owner_id", "created_at", "updated_at",
	}
	if err := cw.Write(header); err != nil {
		return err
	}
	for _, item := range items {
		if err := cw.Write([]string{
			item.Name,
			item.Type,
			item.Status,
			stringPtrValue(item.Category),
			stringPtrValue(item.Description),
			stringPtrValue(item.LocationID),
			stringPtrValue(item.LocationPath),
			floatPtrValue(item.PurchasePrice),
			stringPtrValue(item.PurchaseCurrency),
			intPtrValue(item.PurchaseDate),
			stringPtrValue(item.PurchasePlatform),
			intPtrValue(item.WarrantyExpiresAt),
			stringPtrValue(item.SerialNumber),
			stringPtrValue(item.WarrantyContact),
			stringPtrValue(item.ExitType),
			intPtrValue(item.ExitDate),
			floatPtrValue(item.ExitPrice),
			stringPtrValue(item.ExitCurrency),
			stringPtrValue(item.ExitNotes),
			tagNamesValue(item.Tags),
			intPtrCSVValue(item.CurrentStock),
			intPtrCSVValue(item.MinStockThreshold),
			intPtrCSVValue(item.LifespanDays),
			intPtrValue(item.InUseSince),
			boolValue(item.IsPrivate),
			stringPtrValue(item.OwnerID),
			fmt.Sprintf("%d", item.CreatedAt),
			fmt.Sprintf("%d", item.UpdatedAt),
		}); err != nil {
			return err
		}
	}
	cw.Flush()
	return cw.Error()
}

func (s *ExportService) locationPaths(ctx context.Context) (map[string]string, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, parent_id, name FROM locations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type loc struct {
		id       string
		parentID *string
		name     string
	}
	locations := map[string]loc{}
	for rows.Next() {
		var l loc
		if err := rows.Scan(&l.id, &l.parentID, &l.name); err != nil {
			return nil, err
		}
		locations[l.id] = l
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	paths := map[string]string{}
	var build func(id string) string
	build = func(id string) string {
		if path, ok := paths[id]; ok {
			return path
		}
		l, ok := locations[id]
		if !ok {
			return ""
		}
		path := l.name
		if l.parentID != nil {
			if parent := build(*l.parentID); parent != "" {
				path = parent + "/" + l.name
			}
		}
		paths[id] = path
		return path
	}

	for id := range locations {
		build(id)
	}
	return paths, nil
}

func (s *ExportService) tagsForItems(ctx context.Context) (map[string][]*model.Tag, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT item_tags.item_id, tags.id, tags.name, tags.color
		FROM tags
		JOIN item_tags ON item_tags.tag_id = tags.id
		ORDER BY item_tags.item_id ASC, tags.name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := map[string][]*model.Tag{}
	for rows.Next() {
		var itemID string
		var tag model.Tag
		var color sql.NullString
		if err := rows.Scan(&itemID, &tag.ID, &tag.Name, &color); err != nil {
			return nil, err
		}
		if color.Valid {
			value := color.String
			tag.Color = &value
		}
		out[itemID] = append(out[itemID], &tag)
	}
	return out, rows.Err()
}

func (s *ExportService) purchaseEvents(ctx context.Context) ([]*model.PurchaseEvent, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, quantity, price, currency, purchased_at, notes
		FROM purchase_events
		ORDER BY purchased_at ASC, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := []*model.PurchaseEvent{}
	for rows.Next() {
		event, err := scanPurchaseEvent(rows)
		if err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, rows.Err()
}

func (s *ExportService) calibrationEvents(ctx context.Context) ([]*model.CalibrationEvent, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, signal, created_at
		FROM calibration_events
		ORDER BY created_at ASC, id ASC`)
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

func (s *ExportService) loans(ctx context.Context) ([]*model.Loan, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, borrower_name, borrower_contact,
			loaned_at, due_at, returned_at, status,
			compensation, compensation_currency, notes
		FROM loans
		ORDER BY loaned_at ASC, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	loans := []*model.Loan{}
	for rows.Next() {
		loan, err := scanLoan(rows)
		if err != nil {
			return nil, err
		}
		loans = append(loans, loan)
	}
	return loans, rows.Err()
}

func (s *ExportService) virtualCredentials(ctx context.Context) ([]*model.VirtualCredential, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, platform, account, order_id, license_key, purchased_at, price, currency
		FROM virtual_credentials
		ORDER BY platform ASC, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	credentials := []*model.VirtualCredential{}
	for rows.Next() {
		credential, err := scanVirtualCredential(rows)
		if err != nil {
			return nil, err
		}
		credentials = append(credentials, credential)
	}
	return credentials, rows.Err()
}

func (s *ExportService) virtualAddons(ctx context.Context) ([]*model.VirtualAddonPurchase, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, name, platform, price, currency, purchased_at
		FROM virtual_addon_purchases
		ORDER BY purchased_at ASC, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	addons := []*model.VirtualAddonPurchase{}
	for rows.Next() {
		addon, err := scanVirtualAddon(rows)
		if err != nil {
			return nil, err
		}
		addons = append(addons, addon)
	}
	return addons, rows.Err()
}

func (s *ExportService) reminders(ctx context.Context) ([]*model.Reminder, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, type, trigger_at, sent_at, is_dismissed
		FROM reminders
		ORDER BY trigger_at ASC, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reminders := []*model.Reminder{}
	for rows.Next() {
		reminder, err := scanReminder(rows)
		if err != nil {
			return nil, err
		}
		reminders = append(reminders, reminder)
	}
	return reminders, rows.Err()
}

func stringPtrValue(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func intPtrValue(p *int64) string {
	if p == nil {
		return ""
	}
	return fmt.Sprintf("%d", *p)
}

func intPtrCSVValue(p *int) string {
	if p == nil {
		return ""
	}
	return fmt.Sprintf("%d", *p)
}

func floatPtrValue(p *float64) string {
	if p == nil {
		return ""
	}
	return fmt.Sprintf("%g", *p)
}

func boolValue(v bool) string {
	if v {
		return "true"
	}
	return "false"
}

func tagNamesValue(tags []*model.Tag) string {
	names := make([]string, 0, len(tags))
	for _, tag := range tags {
		names = append(names, tag.Name)
	}
	return strings.Join(names, "|")
}
