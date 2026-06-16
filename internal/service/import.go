package service

import (
	"context"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"
)

type ImportFormat string

const (
	ImportCSV  ImportFormat = "csv"
	ImportJSON ImportFormat = "json"
)

type ImportService struct {
	db *sql.DB
}

func NewImportService(db *sql.DB) *ImportService {
	return &ImportService{db: db}
}

type ImportRow struct {
	Name             string  `json:"name"`
	Type             string  `json:"type"`
	Category         string  `json:"category"`
	Description      string  `json:"description"`
	Location         string  `json:"location"`
	PurchasePrice    string  `json:"purchase_price"`
	PurchaseCurrency string  `json:"purchase_currency"`
	PurchaseDate     string  `json:"purchase_date"`
	SerialNumber     string  `json:"serial_number"`
}

type ImportResult struct {
	Total    int           `json:"total"`
	Created  int           `json:"created"`
	Skipped  int           `json:"skipped"`
	Failed   int           `json:"failed"`
	Errors   []ImportError `json:"errors,omitempty"`
}

type ImportError struct {
	Line    int    `json:"line"`
	Name    string `json:"name"`
	Message string `json:"message"`
}

func (s *ImportService) Import(ctx context.Context, format ImportFormat, body io.Reader, ownerID string) (*ImportResult, error) {
	rows, err := parseRows(format, body)
	if err != nil {
		return nil, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	locCache := map[string]string{}
	res := &ImportResult{Total: len(rows)}
	now := time.Now().Unix()

	for i, row := range rows {
		lineNum := i + 2 // header is line 1, JSON shifts by 1 too — close enough for diagnostics
		if format == ImportJSON {
			lineNum = i + 1
		}

		if strings.TrimSpace(row.Name) == "" {
			res.Failed++
			res.Errors = append(res.Errors, ImportError{Line: lineNum, Name: row.Name, Message: "name required"})
			continue
		}

		itemType := strings.TrimSpace(row.Type)
		if itemType == "" {
			itemType = string(model.ItemTypeDurable)
		}
		if !validItemType(itemType) {
			res.Failed++
			res.Errors = append(res.Errors, ImportError{Line: lineNum, Name: row.Name, Message: "invalid type: " + itemType})
			continue
		}

		var locID *string
		if path := strings.TrimSpace(row.Location); path != "" {
			id, err := ensureLocationPath(ctx, tx, path, locCache, now)
			if err != nil {
				res.Failed++
				res.Errors = append(res.Errors, ImportError{Line: lineNum, Name: row.Name, Message: "location: " + err.Error()})
				continue
			}
			locID = &id
		}

		var price *float64
		if v := strings.TrimSpace(row.PurchasePrice); v != "" {
			p, err := strconv.ParseFloat(v, 64)
			if err != nil {
				res.Failed++
				res.Errors = append(res.Errors, ImportError{Line: lineNum, Name: row.Name, Message: "purchase_price: " + err.Error()})
				continue
			}
			price = &p
		}

		var purchaseDate *int64
		if v := strings.TrimSpace(row.PurchaseDate); v != "" {
			ts, err := parseDate(v)
			if err != nil {
				res.Failed++
				res.Errors = append(res.Errors, ImportError{Line: lineNum, Name: row.Name, Message: "purchase_date: " + err.Error()})
				continue
			}
			purchaseDate = &ts
		}

		// Check for duplicate: same name in the same location (or both without location).
		if itemExists(ctx, tx, row.Name, locID) {
			res.Skipped++
			continue
		}

		id := ulid.Make().String()
		_, err := tx.ExecContext(ctx, `
			INSERT INTO items (
				id, name, description, category, type, status,
				location_id, purchase_price, purchase_currency, purchase_date,
				serial_number, is_private, owner_id, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, 'in_stock', ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
			id,
			row.Name,
			nullableStr(row.Description),
			nullableStr(row.Category),
			itemType,
			locID,
			price,
			nullableStr(row.PurchaseCurrency),
			purchaseDate,
			nullableStr(row.SerialNumber),
			nullableStr(ownerID),
			now, now,
		)
		if err != nil {
			res.Failed++
			res.Errors = append(res.Errors, ImportError{Line: lineNum, Name: row.Name, Message: err.Error()})
			continue
		}

		if _, err := tx.ExecContext(ctx,
			`INSERT INTO items_fts (item_id, name, description, category, serial_number)
			 VALUES (?, ?, ?, ?, ?)`,
			id, row.Name, row.Description, row.Category, row.SerialNumber,
		); err != nil {
			res.Failed++
			res.Errors = append(res.Errors, ImportError{Line: lineNum, Name: row.Name, Message: "fts: " + err.Error()})
			continue
		}

		res.Created++
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return res, nil
}

func parseRows(format ImportFormat, body io.Reader) ([]ImportRow, error) {
	switch format {
	case ImportCSV:
		return parseCSV(body)
	case ImportJSON:
		return parseJSON(body)
	default:
		return nil, fmt.Errorf("unsupported format: %s", format)
	}
}

func parseCSV(body io.Reader) ([]ImportRow, error) {
	r := csv.NewReader(body)
	r.FieldsPerRecord = -1
	r.TrimLeadingSpace = true

	records, err := r.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("csv parse: %w", err)
	}
	if len(records) == 0 {
		return nil, errors.New("empty csv")
	}

	header := records[0]
	idx := map[string]int{}
	for i, h := range header {
		idx[strings.ToLower(strings.TrimSpace(h))] = i
	}
	if _, ok := idx["name"]; !ok {
		return nil, errors.New("csv must have a 'name' column")
	}

	get := func(row []string, key string) string {
		i, ok := idx[key]
		if !ok || i >= len(row) {
			return ""
		}
		return row[i]
	}

	out := make([]ImportRow, 0, len(records)-1)
	for _, row := range records[1:] {
		out = append(out, ImportRow{
			Name:             get(row, "name"),
			Type:             get(row, "type"),
			Category:         get(row, "category"),
			Description:      get(row, "description"),
			Location:         get(row, "location"),
			PurchasePrice:    get(row, "purchase_price"),
			PurchaseCurrency: get(row, "purchase_currency"),
			PurchaseDate:     get(row, "purchase_date"),
			SerialNumber:     get(row, "serial_number"),
		})
	}
	return out, nil
}

func parseJSON(body io.Reader) ([]ImportRow, error) {
	var rows []ImportRow
	if err := json.NewDecoder(body).Decode(&rows); err != nil {
		return nil, fmt.Errorf("json parse: %w", err)
	}
	return rows, nil
}

// ensureLocationPath walks a path like "卧室 → 书桌 → 抽屉" and creates missing nodes,
// returning the id of the leaf.
func ensureLocationPath(ctx context.Context, tx *sql.Tx, path string, cache map[string]string, now int64) (string, error) {
	segments := splitPath(path)
	if len(segments) == 0 {
		return "", errors.New("empty path")
	}

	var parentID *string
	cacheKey := ""
	for _, name := range segments {
		if cacheKey == "" {
			cacheKey = name
		} else {
			cacheKey = cacheKey + "\x00" + name
		}
		if id, ok := cache[cacheKey]; ok {
			pid := id
			parentID = &pid
			continue
		}

		var id string
		var err error
		if parentID == nil {
			err = tx.QueryRowContext(ctx,
				`SELECT id FROM locations WHERE parent_id IS NULL AND name = ?`, name,
			).Scan(&id)
		} else {
			err = tx.QueryRowContext(ctx,
				`SELECT id FROM locations WHERE parent_id = ? AND name = ?`, *parentID, name,
			).Scan(&id)
		}
		if errors.Is(err, sql.ErrNoRows) {
			id = ulid.Make().String()
			if _, err := tx.ExecContext(ctx,
				`INSERT INTO locations (id, parent_id, name, type, sort_order, is_private, created_at, updated_at)
				 VALUES (?, ?, ?, 'room', 0, 0, ?, ?)`,
				id, parentID, name, now, now,
			); err != nil {
				return "", err
			}
		} else if err != nil {
			return "", err
		}
		cache[cacheKey] = id
		pid := id
		parentID = &pid
	}
	return *parentID, nil
}

func splitPath(p string) []string {
	separators := []string{"→", "->", "/", ">"}
	for _, sep := range separators {
		p = strings.ReplaceAll(p, sep, "\x00")
	}
	parts := strings.Split(p, "\x00")
	out := make([]string, 0, len(parts))
	for _, s := range parts {
		s = strings.TrimSpace(s)
		if s != "" {
			out = append(out, s)
		}
	}
	return out
}

func parseDate(s string) (int64, error) {
	// epoch seconds
	if n, err := strconv.ParseInt(s, 10, 64); err == nil {
		return n, nil
	}
	for _, layout := range []string{"2006-01-02", "2006/01/02", time.RFC3339} {
		if t, err := time.Parse(layout, s); err == nil {
			return t.Unix(), nil
		}
	}
	return 0, fmt.Errorf("unrecognized date format: %s", s)
}

func validItemType(t string) bool {
	switch model.ItemType(t) {
	case model.ItemTypeDurable, model.ItemTypePredictiveSupplies, model.ItemTypeTrackedSpares,
		model.ItemTypeEssentials, model.ItemTypeVirtual:
		return true
	}
	return false
}

func nullableStr(s string) any {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return s
}

// itemExists reports whether an item with the given name and location already exists.
func itemExists(ctx context.Context, tx *sql.Tx, name string, locID *string) bool {
	var n int
	if locID != nil {
		_ = tx.QueryRowContext(ctx,
			`SELECT COUNT(*) FROM items WHERE name = ? AND location_id = ?`,
			name, *locID,
		).Scan(&n)
	} else {
		_ = tx.QueryRowContext(ctx,
			`SELECT COUNT(*) FROM items WHERE name = ? AND location_id IS NULL`,
			name,
		).Scan(&n)
	}
	return n > 0
}
