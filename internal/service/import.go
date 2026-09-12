package service

import (
	"context"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
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

// OnDuplicate controls how rows that match an existing item (same name + same
// location) are handled on commit.
type OnDuplicate string

const (
	// OnDuplicateSkip keeps the existing item untouched and counts the row as skipped.
	OnDuplicateSkip OnDuplicate = "skip"
	// OnDuplicateUpdate overwrites the existing item's non-empty fields with the row.
	OnDuplicateUpdate OnDuplicate = "update"
	// OnDuplicateAppend creates a new item regardless of any duplicate.
	OnDuplicateAppend OnDuplicate = "append"
)

type ImportService struct {
	db *sql.DB
}

func NewImportService(db *sql.DB) *ImportService {
	return &ImportService{db: db}
}

type ImportOptions struct {
	Format      ImportFormat
	OnDuplicate OnDuplicate
	// Mapping maps a Havit field name to a CSV source column, given as a
	// header name or a 0-based column index. When empty, columns are
	// auto-detected from the header via fieldAliases.
	Mapping map[string]string
}

// ImportRow is one parsed record. CSV values come from the mapped columns;
// JSON values are normalized from any JSON type into their string form.
type ImportRow struct {
	Name              string `json:"name"`
	Type              string `json:"type"`
	Status            string `json:"status"`
	Category          string `json:"category"`
	Description       string `json:"description"`
	Location          string `json:"location"`
	HomeBaseLocation  string `json:"home_base_location"`
	CurrentStatusTag  string `json:"current_status_tag"`
	PurchasePrice     string `json:"purchase_price"`
	PurchaseCurrency  string `json:"purchase_currency"`
	PurchaseDate      string `json:"purchase_date"`
	PurchasePlatform  string `json:"purchase_platform"`
	WarrantyExpiresAt string `json:"warranty_expires_at"`
	SerialNumber      string `json:"serial_number"`
	WarrantyContact   string `json:"warranty_contact"`
	CurrentStock      string `json:"current_stock"`
	MinStockThreshold string `json:"min_stock_threshold"`
	LifespanDays      string `json:"lifespan_days"`
	InUseSince        string `json:"in_use_since"`
	IsPrivate         string `json:"is_private"`
	Tags              string `json:"tags"`
}

type ImportResult struct {
	Total   int           `json:"total"`
	Created int           `json:"created"`
	Updated int           `json:"updated"`
	Skipped int           `json:"skipped"`
	Failed  int           `json:"failed"`
	Errors  []ImportError `json:"errors,omitempty"`
}

type ImportError struct {
	Line    int               `json:"line"`
	Name    string            `json:"name"`
	Message string            `json:"message"`
	// Row carries the parsed values of a failed row so the client can export
	// the failures as a re-importable file.
	Row map[string]string `json:"row,omitempty"`
}

type ImportPreview struct {
	Format string `json:"format"`
	// Headers lists the CSV source columns (empty for JSON).
	Headers []string `json:"headers,omitempty"`
	// Mapping is the effective field → source column mapping, keyed by the
	// actual header name used (or "col:<index>" when resolved numerically).
	Mapping map[string]string `json:"mapping"`
	// UnmappedRequired names required fields without a mapped column.
	UnmappedRequired []string     `json:"unmapped_required,omitempty"`
	Stats            PreviewStats `json:"stats"`
	Rows             []PreviewRow `json:"rows"`
	Truncated        bool         `json:"truncated"`
	Total            int          `json:"total"`
}

type PreviewStats struct {
	Ok        int `json:"ok"`
	Duplicate int `json:"duplicate"`
	Error     int `json:"error"`
}

type PreviewRow struct {
	Row      int            `json:"row"`
	Status   string         `json:"status"` // ok | duplicate | error
	Name     string         `json:"name"`
	Category string         `json:"category,omitempty"`
	Location string         `json:"location,omitempty"`
	Errors   []PreviewError `json:"errors,omitempty"`
}

type PreviewError struct {
	Field   string `json:"field,omitempty"`
	Message string `json:"message"`
}

// importFields is the canonical field order used for mapping, extraction and
// error-row export so CSV/JSON paths stay symmetric.
var importFields = []string{
	"name", "type", "status", "category", "description",
	"location", "home_base_location", "current_status_tag",
	"purchase_price", "purchase_currency", "purchase_date", "purchase_platform",
	"warranty_expires_at", "serial_number", "warranty_contact",
	"current_stock", "min_stock_threshold", "lifespan_days", "in_use_since",
	"is_private", "tags",
}

// fieldAliases lists the source column names (canonical export names plus
// common zh/en synonyms) accepted for each import field when auto-detecting.
var fieldAliases = map[string][]string{
	"name":               {"name", "名称", "title", "item", "item_name", "物品", "物品名称", "资产名称"},
	"type":               {"type", "类型", "item_type", "资产类型"},
	"status":             {"status", "状态", "item_status", "资产状态"},
	"category":           {"category", "分类", "类目", "品类"},
	"description":        {"description", "描述", "说明", "备注", "notes", "note"},
	"location":           {"location", "位置", "location_path", "位置路径", "place", "地点", "存放位置"},
	"home_base_location": {"home_base_location", "home_base_location_path", "基准位置", "基准地点", "归宿", "home_base"},
	"current_status_tag": {"current_status_tag", "current_status", "当前状态", "动态状态", "随身状态"},
	"purchase_price":     {"purchase_price", "price", "价格", "单价", "购买价格", "金额"},
	"purchase_currency":  {"purchase_currency", "currency", "币种", "货币", "购买币种"},
	"purchase_date":      {"purchase_date", "购买日期", "购入日期", "日期"},
	"purchase_platform":  {"purchase_platform", "购买平台", "平台", "platform"},
	"warranty_expires_at": {"warranty_expires_at", "warranty_expires", "保修到期", "保修期限", "保修截止"},
	"serial_number":      {"serial_number", "sn", "序列号", "SN", "编号"},
	"warranty_contact":   {"warranty_contact", "保修联系人", "保修联系"},
	"current_stock":      {"current_stock", "stock", "库存", "当前库存", "数量"},
	"min_stock_threshold": {"min_stock_threshold", "min_stock", "补货阈值", "库存下限", "最低库存"},
	"lifespan_days":      {"lifespan_days", "寿命", "使用寿命", "寿命天数"},
	"in_use_since":       {"in_use_since", "装入日期", "启用日期", "使用起始"},
	"is_private":         {"is_private", "private", "私有", "私密", "是否私有"},
	"tags":               {"tags", "tag", "标签"},
}

// importItem is the validated, typed form of an ImportRow used by commit.
type importItem struct {
	Name              string
	Type              string
	TypeSet           bool
	Status            string
	StatusSet         bool
	Category          string
	Description       string
	LocationPath      string
	HomeBasePath      string
	CurrentStatusTag  string
	PurchasePrice     *float64
	PurchaseCurrency  string
	PurchaseDate      *int64
	PurchasePlatform  string
	WarrantyExpiresAt *int64
	SerialNumber      string
	WarrantyContact   string
	CurrentStock      *int
	MinStockThreshold *int
	LifespanDays      *int
	InUseSince        *int64
	IsPrivate         bool
	IsPrivateSet      bool
	Tags              []string
}

func (s *ImportService) Import(ctx context.Context, body io.Reader, ownerID string, opts ImportOptions) (*ImportResult, error) {
	if opts.OnDuplicate == "" {
		opts.OnDuplicate = OnDuplicateSkip
	}
	rows, headers, _, unmapped, err := parseRows(opts.Format, body, opts.Mapping)
	if err != nil {
		return nil, err
	}
	// An explicit mapping must cover the required name field; without it every
	// row would fail with "name required" — fail fast instead.
	if opts.Format == ImportCSV && len(opts.Mapping) > 0 && containsStr(unmapped, "name") {
		return nil, errors.New("mapping must include the 'name' column")
	}
	_ = headers

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	locCache := map[string]string{}
	tagCache := map[string]string{}
	res := &ImportResult{Total: len(rows)}
	now := time.Now().Unix()

	for i, row := range rows {
		lineNum := lineNumber(opts.Format, i)
		item, verrs := validateImportRow(row)
		if len(verrs) > 0 {
			res.Failed++
			res.Errors = append(res.Errors, ImportError{
				Line: lineNum, Name: strings.TrimSpace(row.Name),
				Message: strings.Join(verrs, "; "),
				Row:     rowValues(row),
			})
			continue
		}

		var locID *string
		if item.LocationPath != "" {
			id, err := ensureLocationPath(ctx, tx, item.LocationPath, locCache, now)
			if err != nil {
				res.Failed++
				res.Errors = append(res.Errors, ImportError{
					Line: lineNum, Name: item.Name,
					Message: "location: " + err.Error(), Row: rowValues(row),
				})
				continue
			}
			locID = &id
		}

		var homeBaseID *string
		if item.HomeBasePath != "" {
			id, err := ensureLocationPath(ctx, tx, item.HomeBasePath, locCache, now)
			if err != nil {
				res.Failed++
				res.Errors = append(res.Errors, ImportError{
					Line: lineNum, Name: item.Name,
					Message: "home_base_location: " + err.Error(), Row: rowValues(row),
				})
				continue
			}
			homeBaseID = &id
		}

		existingID, found, err := findExistingItem(ctx, tx, item.Name, locID, ownerID)
		if err != nil {
			res.Failed++
			res.Errors = append(res.Errors, ImportError{
				Line: lineNum, Name: item.Name, Message: "lookup: " + err.Error(), Row: rowValues(row),
			})
			continue
		}

		switch opts.OnDuplicate {
		case OnDuplicateAppend:
			// Always create, ignore any existing item.
		case OnDuplicateUpdate:
			if found {
				if err := s.updateExistingItem(ctx, tx, existingID, item, tagCache, now); err != nil {
					res.Failed++
					res.Errors = append(res.Errors, ImportError{
						Line: lineNum, Name: item.Name, Message: err.Error(), Row: rowValues(row),
					})
					continue
				}
				res.Updated++
				continue
			}
		default: // OnDuplicateSkip
			if found {
				res.Skipped++
				continue
			}
		}

		if err := s.insertItem(ctx, tx, item, locID, homeBaseID, ownerID, tagCache, now); err != nil {
			res.Failed++
			res.Errors = append(res.Errors, ImportError{
				Line: lineNum, Name: item.Name, Message: err.Error(), Row: rowValues(row),
			})
			continue
		}
		res.Created++
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return res, nil
}

// Preview parses and validates the payload without writing anything, returning
// per-row status so the client can confirm before committing.
func (s *ImportService) Preview(ctx context.Context, body io.Reader, ownerID string, opts ImportOptions) (*ImportPreview, error) {
	rows, headers, usedMapping, unmapped, err := parseRows(opts.Format, body, opts.Mapping)
	if err != nil {
		return nil, err
	}

	preview := &ImportPreview{
		Format:  string(opts.Format),
		Headers: headers,
		Mapping: usedMapping,
		Total:   len(rows),
	}
	if opts.Format == ImportCSV {
		preview.UnmappedRequired = unmapped
	}

	const maxPreviewRows = 200
	for i, row := range rows {
		item, verrs := validateImportRow(row)
		status := "ok"
		perr := []PreviewError{}
		if len(verrs) > 0 {
			status = "error"
			for _, m := range verrs {
				perr = append(perr, PreviewError{Message: m})
			}
			preview.Stats.Error++
		} else {
			var locID *string
			if item.LocationPath != "" {
				id, found, lerr := lookupLocationPath(ctx, s.db, item.LocationPath)
				if lerr != nil {
					status = "error"
					perr = append(perr, PreviewError{Message: "location: " + lerr.Error()})
					preview.Stats.Error++
				} else if found {
					locID = &id
				}
			}
			if status == "ok" {
				_, found, ferr := findExistingItem(ctx, s.db, item.Name, locID, ownerID)
				if ferr != nil {
					status = "error"
					perr = append(perr, PreviewError{Message: "lookup: " + ferr.Error()})
					preview.Stats.Error++
				} else if found {
					status = "duplicate"
					preview.Stats.Duplicate++
				} else {
					preview.Stats.Ok++
				}
			}
		}
		if len(preview.Rows) < maxPreviewRows {
			preview.Rows = append(preview.Rows, PreviewRow{
				Row:      lineNumber(opts.Format, i),
				Status:   status,
				Name:     item.Name,
				Category: item.Category,
				Location: item.LocationPath,
				Errors:   perr,
			})
		}
	}
	if len(rows) > maxPreviewRows {
		preview.Truncated = true
	}
	return preview, nil
}

// lineNumber maps a row index back to the 1-based line the user sees in the
// original file (CSV counts the header row; JSON does not).
func lineNumber(format ImportFormat, i int) int {
	if format == ImportCSV {
		return i + 2
	}
	return i + 1
}

// validateImportRow checks every field and returns the typed item. The first
// slice holds human-readable validation errors, one per failing field.
func validateImportRow(row ImportRow) (importItem, []string) {
	var item importItem
	var verrs []string
	fail := func(msg string) {
		verrs = append(verrs, msg)
	}

	item.Name = strings.TrimSpace(row.Name)
	item.Category = strings.TrimSpace(row.Category)
	item.Description = strings.TrimSpace(row.Description)
	item.LocationPath = strings.TrimSpace(row.Location)
	item.HomeBasePath = strings.TrimSpace(row.HomeBaseLocation)
	item.CurrentStatusTag = strings.TrimSpace(row.CurrentStatusTag)
	item.SerialNumber = strings.TrimSpace(row.SerialNumber)
	item.WarrantyContact = strings.TrimSpace(row.WarrantyContact)
	item.PurchaseCurrency = strings.TrimSpace(row.PurchaseCurrency)
	item.PurchasePlatform = strings.TrimSpace(row.PurchasePlatform)

	if item.Name == "" {
		fail("name required")
	}

	item.Type = strings.TrimSpace(row.Type)
	if item.Type == "" {
		item.Type = string(model.ItemTypeDurable)
	} else if !validItemType(item.Type) {
		fail("invalid type: " + item.Type)
	} else {
		item.TypeSet = true
	}

	item.Status = strings.TrimSpace(row.Status)
	if item.Status == "" {
		item.Status = string(model.StatusInStock)
	} else if !validItemStatus(model.ItemStatus(item.Status)) {
		fail("invalid status: " + item.Status)
	} else {
		item.StatusSet = true
	}

	if v := strings.TrimSpace(row.PurchasePrice); v != "" {
		p, err := strconv.ParseFloat(v, 64)
		if err != nil {
			fail("purchase_price: " + err.Error())
		} else {
			item.PurchasePrice = &p
		}
	}
	if v := strings.TrimSpace(row.PurchaseDate); v != "" {
		ts, err := parseDate(v)
		if err != nil {
			fail("purchase_date: " + err.Error())
		} else {
			item.PurchaseDate = &ts
		}
	}
	if v := strings.TrimSpace(row.WarrantyExpiresAt); v != "" {
		ts, err := parseDate(v)
		if err != nil {
			fail("warranty_expires_at: " + err.Error())
		} else {
			item.WarrantyExpiresAt = &ts
		}
	}
	if v := strings.TrimSpace(row.InUseSince); v != "" {
		ts, err := parseDate(v)
		if err != nil {
			fail("in_use_since: " + err.Error())
		} else {
			item.InUseSince = &ts
		}
	}
	if v := strings.TrimSpace(row.CurrentStock); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			fail("current_stock: invalid integer: " + v)
		} else {
			item.CurrentStock = &n
		}
	}
	if v := strings.TrimSpace(row.MinStockThreshold); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			fail("min_stock_threshold: invalid integer: " + v)
		} else {
			item.MinStockThreshold = &n
		}
	}
	if v := strings.TrimSpace(row.LifespanDays); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			fail("lifespan_days: invalid integer: " + v)
		} else {
			item.LifespanDays = &n
		}
	}
	if v := strings.TrimSpace(row.IsPrivate); v != "" {
		b, err := parseBool(v)
		if err != nil {
			fail("is_private: " + err.Error())
		} else {
			item.IsPrivate = b
			item.IsPrivateSet = true
		}
	}
	item.Tags = parseTags(row.Tags)

	// Mirror ItemService.Create: tracked spares default to a threshold of 1.
	if item.Type == string(model.ItemTypeTrackedSpares) && item.MinStockThreshold == nil {
		n := 1
		item.MinStockThreshold = &n
	}

	return item, verrs
}

func (s *ImportService) insertItem(ctx context.Context, tx *sql.Tx, item importItem, locID, homeBaseID *string, ownerID string, tagCache map[string]string, now int64) error {
	id := ulid.Make().String()
	_, err := tx.ExecContext(ctx, `
		INSERT INTO items (
			id, name, description, category, type, status,
			location_id, home_base_location_id, current_status_tag,
			purchase_price, purchase_currency, purchase_date, purchase_platform,
			warranty_expires_at, serial_number, warranty_contact,
			current_stock, min_stock_threshold, lifespan_days, in_use_since,
			is_private, owner_id, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id,
		item.Name,
		nullableStr(item.Description),
		nullableStr(item.Category),
		item.Type,
		item.Status,
		locID,
		homeBaseID,
		nullableStr(item.CurrentStatusTag),
		item.PurchasePrice,
		nullableStr(item.PurchaseCurrency),
		item.PurchaseDate,
		nullableStr(item.PurchasePlatform),
		item.WarrantyExpiresAt,
		nullableStr(item.SerialNumber),
		nullableStr(item.WarrantyContact),
		item.CurrentStock,
		item.MinStockThreshold,
		item.LifespanDays,
		item.InUseSince,
		item.IsPrivate,
		nullableStr(ownerID),
		now, now,
	)
	if err != nil {
		return fmt.Errorf("insert item: %w", err)
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO items_fts (item_id, name, description, category, serial_number)
		 VALUES (?, ?, ?, ?, ?)`,
		id, item.Name, item.Description, item.Category, item.SerialNumber,
	); err != nil {
		return fmt.Errorf("insert fts: %w", err)
	}
	if err := attachTags(ctx, tx, id, item.Tags, tagCache, now); err != nil {
		return err
	}
	return nil
}

// updateExistingItem overwrites the existing item's non-empty fields. Empty
// import fields keep the stored value; a non-empty tags column replaces the
// item's full tag set.
func (s *ImportService) updateExistingItem(ctx context.Context, tx *sql.Tx, id string, item importItem, tagCache map[string]string, now int64) error {
	set := []string{"updated_at = ?"}
	args := []any{now}

	add := func(col string, v any) {
		set = append(set, col+" = ?")
		args = append(args, v)
	}

	if item.Category != "" {
		add("category", item.Category)
	}
	if item.Description != "" {
		add("description", item.Description)
	}
	if item.TypeSet {
		add("type", item.Type)
	}
	if item.StatusSet {
		add("status", item.Status)
	}
	if item.LocationPath != "" {
		locID, err := ensureLocationPath(ctx, tx, item.LocationPath, map[string]string{}, now)
		if err != nil {
			return fmt.Errorf("location: %w", err)
		}
		add("location_id", locID)
	}
	if item.HomeBasePath != "" {
		homeBaseID, err := ensureLocationPath(ctx, tx, item.HomeBasePath, map[string]string{}, now)
		if err != nil {
			return fmt.Errorf("home_base_location: %w", err)
		}
		add("home_base_location_id", homeBaseID)
	}
	if item.CurrentStatusTag != "" {
		add("current_status_tag", item.CurrentStatusTag)
	}
	if item.PurchasePrice != nil {
		add("purchase_price", *item.PurchasePrice)
	}
	if item.PurchaseCurrency != "" {
		add("purchase_currency", item.PurchaseCurrency)
	}
	if item.PurchaseDate != nil {
		add("purchase_date", *item.PurchaseDate)
	}
	if item.PurchasePlatform != "" {
		add("purchase_platform", item.PurchasePlatform)
	}
	if item.WarrantyExpiresAt != nil {
		add("warranty_expires_at", *item.WarrantyExpiresAt)
	}
	if item.SerialNumber != "" {
		add("serial_number", item.SerialNumber)
	}
	if item.WarrantyContact != "" {
		add("warranty_contact", item.WarrantyContact)
	}
	if item.CurrentStock != nil {
		add("current_stock", *item.CurrentStock)
	}
	if item.MinStockThreshold != nil {
		add("min_stock_threshold", *item.MinStockThreshold)
	}
	if item.LifespanDays != nil {
		add("lifespan_days", *item.LifespanDays)
	}
	if item.InUseSince != nil {
		add("in_use_since", *item.InUseSince)
	}
	if item.IsPrivateSet {
		add("is_private", boolInt(item.IsPrivate))
	}

	if len(set) == 1 {
		// Nothing to update besides updated_at; still bump the timestamp.
	}
	sqlSet := strings.Join(set, ", ")
	if _, err := tx.ExecContext(ctx, "UPDATE items SET "+sqlSet+" WHERE id = ?", append(args, id)...); err != nil {
		return fmt.Errorf("update item: %w", err)
	}

	if _, err := tx.ExecContext(ctx,
		`UPDATE items_fts SET name = ?, description = ?, category = ?, serial_number = ? WHERE item_id = ?`,
		item.Name, item.Description, item.Category, item.SerialNumber, id,
	); err != nil {
		return fmt.Errorf("update fts: %w", err)
	}

	if len(item.Tags) > 0 {
		if _, err := tx.ExecContext(ctx, `DELETE FROM item_tags WHERE item_id = ?`, id); err != nil {
			return fmt.Errorf("clear tags: %w", err)
		}
		if err := attachTags(ctx, tx, id, item.Tags, tagCache, now); err != nil {
			return err
		}
	}
	return nil
}

// attachTags upserts tag rows by name (unique) and links them to the item.
func attachTags(ctx context.Context, tx *sql.Tx, itemID string, names []string, cache map[string]string, now int64) error {
	for _, name := range names {
		id, ok := cache[name]
		if !ok {
			id = ulid.Make().String()
			if _, err := tx.ExecContext(ctx,
				`INSERT OR IGNORE INTO tags (id, name, created_at) VALUES (?, ?, ?)`, id, name, now,
			); err != nil {
				return fmt.Errorf("create tag %q: %w", name, err)
			}
			var existing string
			err := tx.QueryRowContext(ctx, `SELECT id FROM tags WHERE name = ?`, name).Scan(&existing)
			if err != nil {
				return fmt.Errorf("resolve tag %q: %w", name, err)
			}
			id = existing
			cache[name] = id
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)`, itemID, id,
		); err != nil {
			return fmt.Errorf("attach tag %q: %w", name, err)
		}
	}
	return nil
}

func parseRows(format ImportFormat, body io.Reader, mapping map[string]string) (rows []ImportRow, headers []string, used map[string]string, unmapped []string, err error) {
	switch format {
	case ImportCSV:
		return parseCSV(body, mapping)
	case ImportJSON:
		rows, err := parseJSON(body)
		return rows, nil, nil, nil, err
	default:
		return nil, nil, nil, nil, fmt.Errorf("unsupported format: %s", format)
	}
}

func parseCSV(body io.Reader, mapping map[string]string) ([]ImportRow, []string, map[string]string, []string, error) {
	r := csv.NewReader(body)
	r.FieldsPerRecord = -1
	r.TrimLeadingSpace = true

	records, err := r.ReadAll()
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("csv parse: %w", err)
	}
	if len(records) == 0 {
		return nil, nil, nil, nil, errors.New("empty csv")
	}

	header := records[0]
	colIdx, used, unmapped := buildColumnMap(header, mapping)

	out := make([]ImportRow, 0, len(records)-1)
	for _, record := range records[1:] {
		row := ImportRow{}
		for field, idx := range colIdx {
			if idx >= len(record) {
				continue
			}
			setImportField(&row, field, record[idx])
		}
		out = append(out, row)
	}
	return out, header, used, unmapped, nil
}

// buildColumnMap resolves the effective field → column mapping for a CSV
// header. Explicit mappings win; otherwise columns are auto-detected via
// fieldAliases. Unresolved required fields are reported as unmapped.
func buildColumnMap(header []string, mapping map[string]string) (colIdx map[string]int, used map[string]string, unmapped []string) {
	colIdx = map[string]int{}
	used = map[string]string{}

	if len(mapping) > 0 {
		for _, field := range importFields {
			col, ok := mapping[field]
			if !ok || strings.TrimSpace(col) == "" {
				continue
			}
			target := strings.ToLower(strings.TrimSpace(col))
			idx := -1
			for i, h := range header {
				if strings.ToLower(strings.TrimSpace(h)) == target {
					idx = i
					break
				}
			}
			if idx < 0 {
				if n, perr := strconv.Atoi(target); perr == nil && n >= 0 && n < len(header) {
					idx = n
				}
			}
			if idx >= 0 {
				colIdx[field] = idx
				used[field] = header[idx]
			}
		}
	} else {
		for i, h := range header {
			lh := strings.ToLower(strings.TrimSpace(h))
			for _, field := range importFields {
				if _, done := colIdx[field]; done {
					continue
				}
				for _, alias := range fieldAliases[field] {
					if strings.ToLower(alias) == lh {
						colIdx[field] = i
						used[field] = header[i]
						break
					}
				}
			}
		}
	}

	if _, ok := colIdx["name"]; !ok {
		unmapped = append(unmapped, "name")
	}
	return colIdx, used, unmapped
}

func parseJSON(body io.Reader) ([]ImportRow, error) {
	data, err := io.ReadAll(body)
	if err != nil {
		return nil, fmt.Errorf("json read: %w", err)
	}

	// Accept both a bare array and the export envelope {"items": [...]}.
	var raw []map[string]json.RawMessage
	var envelope struct {
		Items []map[string]json.RawMessage `json:"items"`
	}
	if err := json.Unmarshal(data, &envelope); err == nil && envelope.Items != nil {
		raw = envelope.Items
	} else if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("json parse: %w", err)
	}

	out := make([]ImportRow, 0, len(raw))
	for _, m := range raw {
		row := ImportRow{}
		for _, field := range importFields {
			key := jsonFieldKey(m, field)
			if key == "" {
				continue
			}
			s, serr := rawValueString(m[key])
			if serr != nil {
				continue
			}
			setImportField(&row, field, s)
		}
		out = append(out, row)
	}
	return out, nil
}

// jsonFieldKey returns the key in m holding the field's value: the exact
// canonical key first, then any alias present.
func jsonFieldKey(m map[string]json.RawMessage, field string) string {
	if _, ok := m[field]; ok {
		return field
	}
	for _, alias := range fieldAliases[field] {
		if _, ok := m[alias]; ok {
			return alias
		}
	}
	return ""
}

// rawValueString normalizes any JSON value into the string form used by
// ImportRow (null → empty, numbers/booleans stringified, arrays of tag objects
// joined for the tags field).
func rawValueString(v json.RawMessage) (string, error) {
	if len(v) == 0 || string(v) == "null" {
		return "", nil
	}
	var s string
	if err := json.Unmarshal(v, &s); err == nil {
		return s, nil
	}
	var f float64
	if err := json.Unmarshal(v, &f); err == nil {
		if f == math.Trunc(f) && !math.IsInf(f, 0) && math.Abs(f) < 1e15 {
			return strconv.FormatInt(int64(f), 10), nil
		}
		return strconv.FormatFloat(f, 'f', -1, 64), nil
	}
	var b bool
	if err := json.Unmarshal(v, &b); err == nil {
		return strconv.FormatBool(b), nil
	}
	var arr []json.RawMessage
	if err := json.Unmarshal(v, &arr); err == nil {
		names := make([]string, 0, len(arr))
		for _, item := range arr {
			var obj map[string]json.RawMessage
			if err := json.Unmarshal(item, &obj); err == nil {
				if n, ok := obj["name"]; ok {
					var name string
					if err := json.Unmarshal(n, &name); err == nil {
						names = append(names, name)
						continue
					}
				}
			}
			var name string
			if err := json.Unmarshal(item, &name); err == nil {
				names = append(names, name)
			}
		}
		return strings.Join(names, "|"), nil
	}
	return "", fmt.Errorf("unsupported json value: %s", v)
}

// setImportField writes a raw string into the ImportRow field identified by
// the canonical field name.
func setImportField(row *ImportRow, field, value string) {
	switch field {
	case "name":
		row.Name = value
	case "type":
		row.Type = value
	case "status":
		row.Status = value
	case "category":
		row.Category = value
	case "description":
		row.Description = value
	case "location":
		row.Location = value
	case "home_base_location":
		row.HomeBaseLocation = value
	case "current_status_tag":
		row.CurrentStatusTag = value
	case "purchase_price":
		row.PurchasePrice = value
	case "purchase_currency":
		row.PurchaseCurrency = value
	case "purchase_date":
		row.PurchaseDate = value
	case "purchase_platform":
		row.PurchasePlatform = value
	case "warranty_expires_at":
		row.WarrantyExpiresAt = value
	case "serial_number":
		row.SerialNumber = value
	case "warranty_contact":
		row.WarrantyContact = value
	case "current_stock":
		row.CurrentStock = value
	case "min_stock_threshold":
		row.MinStockThreshold = value
	case "lifespan_days":
		row.LifespanDays = value
	case "in_use_since":
		row.InUseSince = value
	case "is_private":
		row.IsPrivate = value
	case "tags":
		row.Tags = value
	}
}

// rowValues snapshots the parsed row into a field → trimmed value map used to
// export failed rows for correction and re-import.
func rowValues(row ImportRow) map[string]string {
	vals := map[string]string{}
	for _, field := range importFields {
		vals[field] = strings.TrimSpace(stringValueOf(&row, field))
	}
	return vals
}

func stringValueOf(row *ImportRow, field string) string {
	switch field {
	case "name":
		return row.Name
	case "type":
		return row.Type
	case "status":
		return row.Status
	case "category":
		return row.Category
	case "description":
		return row.Description
	case "location":
		return row.Location
	case "home_base_location":
		return row.HomeBaseLocation
	case "current_status_tag":
		return row.CurrentStatusTag
	case "purchase_price":
		return row.PurchasePrice
	case "purchase_currency":
		return row.PurchaseCurrency
	case "purchase_date":
		return row.PurchaseDate
	case "purchase_platform":
		return row.PurchasePlatform
	case "warranty_expires_at":
		return row.WarrantyExpiresAt
	case "serial_number":
		return row.SerialNumber
	case "warranty_contact":
		return row.WarrantyContact
	case "current_stock":
		return row.CurrentStock
	case "min_stock_threshold":
		return row.MinStockThreshold
	case "lifespan_days":
		return row.LifespanDays
	case "in_use_since":
		return row.InUseSince
	case "is_private":
		return row.IsPrivate
	case "tags":
		return row.Tags
	}
	return ""
}

// rowQuerierWithExec covers *sql.DB and *sql.Tx so path resolution works in
// both commit (transactional) and preview (read-only) contexts.
type rowQuerierWithExec interface {
	rowQuerierWithRow
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

// ensureLocationPath walks a path like "卧室 → 书桌 → 抽屉" and creates missing nodes,
// returning the id of the leaf.
func ensureLocationPath(ctx context.Context, tx rowQuerierWithExec, path string, cache map[string]string, now int64) (string, error) {
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

// lookupLocationPath returns the leaf location id when the full path already
// exists, without writing anything (used by preview).
func lookupLocationPath(ctx context.Context, q rowQuerierWithRow, path string) (string, bool, error) {
	segments := splitPath(path)
	if len(segments) == 0 {
		return "", false, errors.New("empty path")
	}
	var parentID *string
	for _, name := range segments {
		var id string
		var err error
		if parentID == nil {
			err = q.QueryRowContext(ctx,
				`SELECT id FROM locations WHERE parent_id IS NULL AND name = ?`, name,
			).Scan(&id)
		} else {
			err = q.QueryRowContext(ctx,
				`SELECT id FROM locations WHERE parent_id = ? AND name = ?`, *parentID, name,
			).Scan(&id)
		}
		if errors.Is(err, sql.ErrNoRows) {
			return "", false, nil
		}
		if err != nil {
			return "", false, err
		}
		pid := id
		parentID = &pid
	}
	return *parentID, true, nil
}

// findExistingItem reports whether an item with the given name and location
// already exists and is visible to the caller, returning its id. Visibility
// uses the same privacy rules as the read paths so update/skip never touches
// an item hidden from the importer.
func findExistingItem(ctx context.Context, q rowQuerierWithRow, name string, locID *string, owner string) (string, bool, error) {
	where := "name = ?"
	args := []any{name}
	if locID != nil {
		where += " AND location_id = ?"
		args = append(args, *locID)
	} else {
		where += " AND location_id IS NULL"
	}
	where, args = itemPrivacy("items", owner, where, args)
	visible, err := visibleLocationIDs(ctx, q, owner)
	if err != nil {
		return "", false, err
	}
	where, args = locationClause("items", visible, where, args)

	var id string
	err = q.QueryRowContext(ctx, `SELECT id FROM items WHERE `+where+` LIMIT 1`, args...).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return id, true, nil
}

type rowQuerierWithRow interface {
	rowQuerier
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
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

func parseBool(s string) (bool, error) {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "1", "true", "yes", "y", "是":
		return true, nil
	case "0", "false", "no", "n", "否", "":
		return false, nil
	}
	return false, fmt.Errorf("invalid boolean: %s", s)
}

func boolInt(v bool) int {
	if v {
		return 1
	}
	return 0
}

// parseTags splits a tags cell on the same separator the export uses.
func parseTags(s string) []string {
	parts := strings.Split(s, "|")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func containsStr(list []string, s string) bool {
	for _, v := range list {
		if v == s {
			return true
		}
	}
	return false
}
