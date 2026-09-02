package service

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

type SearchService struct {
	db *sql.DB
}

func NewSearchService(db *sql.DB) *SearchService {
	return &SearchService{db: db}
}

type SearchResult struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Status       string  `json:"status"`
	LocationID   *string `json:"location_id,omitempty"`
	LocationPath *string `json:"location_path,omitempty"`
	EssentialsHint      *string `json:"essentials_hint,omitempty"`
	LoanHint            *string `json:"loan_hint,omitempty"`

	// UpdatedAt is an internal scan target for the essentials hint and is not serialized.
	UpdatedAt int64 `json:"-"`
}

type SearchFilter struct {
	Keywords             []string          `json:"keywords"`
	Status               *string           `json:"status"`
	Type                 *string           `json:"type"`
	LocationHint         *string           `json:"location_hint"`
	Tags                 []string          `json:"tags"`
	TimeFilter           *SearchTimeFilter `json:"time_filter"`
	IdleDays             *int              `json:"idle_days"`
	WarrantyExpiringDays *int              `json:"warranty_expiring_days"`
	StockLow             *bool             `json:"stock_low"`
	Sort                 *string           `json:"sort"`
	SortDir              string            `json:"sort_dir"`
}

type SearchTimeFilter struct {
	Field  *string `json:"field"`
	Op     *string `json:"op"`
	Value  *int64  `json:"value"`
	Value2 *int64  `json:"value2"`
}

func (f *SearchFilter) Normalize() {
	if f == nil {
		return
	}
	f.Status = nonEmptyStringPtr(f.Status)
	f.Type = nonEmptyStringPtr(f.Type)
	f.LocationHint = nonEmptyStringPtr(f.LocationHint)
	f.Sort = nonEmptyStringPtr(f.Sort)
	f.SortDir = strings.ToLower(strings.TrimSpace(f.SortDir))
	if f.SortDir != "asc" {
		f.SortDir = "desc"
	}
	keywords := make([]string, 0, len(f.Keywords))
	for _, keyword := range f.Keywords {
		if trimmed := strings.TrimSpace(keyword); trimmed != "" {
			keywords = append(keywords, trimmed)
		}
	}
	f.Keywords = keywords
	tags := make([]string, 0, len(f.Tags))
	for _, tag := range f.Tags {
		if trimmed := strings.Trim(strings.TrimSpace(tag), "#"); trimmed != "" {
			tags = append(tags, trimmed)
		}
	}
	f.Tags = tags
	if f.TimeFilter != nil {
		f.TimeFilter.Field = nonEmptyStringPtr(f.TimeFilter.Field)
		f.TimeFilter.Op = nonEmptyStringPtr(f.TimeFilter.Op)
	}
}

func (s *SearchService) FTS(ctx context.Context, query string) ([]SearchResult, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return []SearchResult{}, nil
	}
	locationPaths, err := s.locationPaths(ctx)
	if err != nil {
		return nil, err
	}

	ftsResults, err := s.ftsMatch(ctx, query, locationPaths)
	if err != nil {
		// FTS is best-effort: a malformed query must not break search,
		// the LIKE pass below still covers the user's input.
		ftsResults = []SearchResult{}
	}

	// LIKE matches literal text, so quote characters copied from elsewhere
	// would never hit; strip them before building the pattern.
	likeQuery := strings.ReplaceAll(query, `"`, "")
	likeResults, err := s.like(ctx, likeQuery, locationPaths)
	if err != nil {
		return nil, err
	}
	results := mergeSearchResults(ftsResults, likeResults)
	if err := s.attachLoanHints(ctx, results); err != nil {
		return nil, err
	}
	return results, nil
}

// attachLoanHints fills in "who borrowed it / when it is due" hints for
// borrowed items so search results point to the next action, matching the
// product design's status-hint requirement for abnormal items.
func (s *SearchService) attachLoanHints(ctx context.Context, results []SearchResult) error {
	borrowedIDs := make([]string, 0, len(results))
	for _, result := range results {
		if result.Status == "borrowed" {
			borrowedIDs = append(borrowedIDs, result.ID)
		}
	}
	if len(borrowedIDs) == 0 {
		return nil
	}

	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(borrowedIDs)), ",")
	args := make([]any, 0, len(borrowedIDs))
	for _, id := range borrowedIDs {
		args = append(args, id)
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT item_id, borrower_name, due_at FROM loans
		WHERE status = 'active' AND item_id IN (`+placeholders+`)`,
		args...,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	hints := map[string]string{}
	for rows.Next() {
		var itemID, borrower string
		var dueAt *int64
		if err := rows.Scan(&itemID, &borrower, &dueAt); err != nil {
			return err
		}
		hint := "已借给 " + borrower
		if dueAt != nil {
			due := time.Unix(*dueAt, 0).Format("2006-01-02")
			if *dueAt < time.Now().Unix() {
				hint += "；应还 " + due + "，已逾期"
			} else {
				hint += "；应还 " + due
			}
		}
		hints[itemID] = hint
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for i := range results {
		if hint, ok := hints[results[i].ID]; ok {
			results[i].LoanHint = &hint
		}
	}
	return nil
}

// matchExpression turns user input into a safe FTS5 MATCH expression where each
// whitespace-separated term becomes a quoted phrase, so characters like ( ) : "
// cannot inject query syntax.
func matchExpression(query string) string {
	terms := strings.Fields(query)
	quoted := make([]string, 0, len(terms))
	for _, term := range terms {
		quoted = append(quoted, `"`+strings.ReplaceAll(term, `"`, `""`)+`"`)
	}
	return strings.Join(quoted, " AND ")
}

func (s *SearchService) ftsMatch(ctx context.Context, query string, locationPaths map[string]string) ([]SearchResult, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT items.id, items.name, items.type, items.status,
			items.location_id, items.home_base_location_id, items.current_status_tag, items.updated_at
		FROM items
		WHERE items.status NOT IN (?, ?, ?, ?, ?, ?, ?)
			AND items.id IN (SELECT item_id FROM items_fts WHERE items_fts MATCH ?)
		ORDER BY items.updated_at DESC, items.name ASC
		LIMIT 50`,
		"sold", "given_away", "lost", "stolen", "unreturned", "damaged", "archived",
		matchExpression(query),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSearchResults(rows, locationPaths)
}

func (s *SearchService) Filter(ctx context.Context, f SearchFilter) ([]SearchResult, error) {
	f.Normalize()
	locationPaths, err := s.locationPaths(ctx)
	if err != nil {
		return nil, err
	}

	args := []any{}
	where := "1 = 1"
	if f.Status != nil {
		where += " AND items.status = ?"
		args = append(args, *f.Status)
	} else {
		where += " AND items.status NOT IN (?, ?, ?, ?, ?, ?, ?)"
		args = append(args, "sold", "given_away", "lost", "stolen", "unreturned", "damaged", "archived")
	}
	if f.Type != nil {
		where += " AND items.type = ?"
		args = append(args, *f.Type)
	}
	for _, keyword := range f.Keywords {
		like := "%" + keyword + "%"
		where += ` AND (
			items.name LIKE ?
			OR COALESCE(items.description, '') LIKE ?
			OR COALESCE(items.category, '') LIKE ?
			OR COALESCE(items.serial_number, '') LIKE ?
		)`
		args = append(args, like, like, like, like)
	}
	if f.LocationHint != nil {
		like := "%" + *f.LocationHint + "%"
		where += ` AND EXISTS (
			SELECT 1 FROM locations
			WHERE locations.id = items.location_id AND locations.name LIKE ?
		)`
		args = append(args, like)
	}
	for _, tag := range f.Tags {
		where += ` AND EXISTS (
			SELECT 1 FROM item_tags
			JOIN tags ON tags.id = item_tags.tag_id
			WHERE item_tags.item_id = items.id AND tags.name = ?
		)`
		args = append(args, tag)
	}
	if f.WarrantyExpiringDays != nil && *f.WarrantyExpiringDays >= 0 {
		where += " AND items.warranty_expires_at IS NOT NULL AND items.warranty_expires_at <= ?"
		args = append(args, time.Now().Add(time.Duration(*f.WarrantyExpiringDays)*24*time.Hour).Unix())
	}
	if f.IdleDays != nil && *f.IdleDays >= 0 {
		where += " AND items.status = ? AND items.updated_at <= ?"
		args = append(args, "idle", time.Now().Add(-time.Duration(*f.IdleDays)*24*time.Hour).Unix())
	}
	if f.StockLow != nil && *f.StockLow {
		where += ` AND items.type = 'tracked_spares'
			AND items.current_stock IS NOT NULL
			AND items.min_stock_threshold IS NOT NULL
			AND items.current_stock <= items.min_stock_threshold`
	}
	if f.TimeFilter != nil && f.TimeFilter.Field != nil && f.TimeFilter.Op != nil && f.TimeFilter.Value != nil {
		field := searchTimeField(*f.TimeFilter.Field)
		if field != "" {
			switch *f.TimeFilter.Op {
			case "before":
				where += " AND " + field + " < ?"
				args = append(args, *f.TimeFilter.Value)
			case "after":
				where += " AND " + field + " > ?"
				args = append(args, *f.TimeFilter.Value)
			case "between":
				if f.TimeFilter.Value2 != nil {
					where += " AND " + field + " BETWEEN ? AND ?"
					args = append(args, *f.TimeFilter.Value, *f.TimeFilter.Value2)
				}
			}
		}
	}
	orderBy := "items.updated_at DESC, items.name ASC"
	if f.Sort != nil {
		if sortField := searchSortField(*f.Sort); sortField != "" {
			orderBy = sortField + " " + strings.ToUpper(f.SortDir) + ", items.name ASC"
		}
	}

	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT items.id, items.name, items.type, items.status,
			items.location_id, items.home_base_location_id, items.current_status_tag, items.updated_at
		FROM items
		WHERE %s
		ORDER BY %s
		LIMIT 50`, where, orderBy), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	results, err := scanSearchResults(rows, locationPaths)
	if err != nil {
		return nil, err
	}
	if err := s.attachLoanHints(ctx, results); err != nil {
		return nil, err
	}
	return results, nil
}

func (s *SearchService) locationPaths(ctx context.Context) (map[string]string, error) {
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

func (s *SearchService) like(ctx context.Context, query string, locationPaths map[string]string) ([]SearchResult, error) {
	like := "%" + query + "%"
	rows, err := s.db.QueryContext(ctx, `
		SELECT items.id, items.name, items.type, items.status,
			items.location_id, items.home_base_location_id, items.current_status_tag, items.updated_at
		FROM items
		WHERE items.status NOT IN (?, ?, ?, ?, ?, ?, ?)
			AND (
				items.name LIKE ?
				OR COALESCE(items.description, '') LIKE ?
				OR COALESCE(items.category, '') LIKE ?
				OR COALESCE(items.serial_number, '') LIKE ?
				OR EXISTS (
					SELECT 1 FROM item_tags
					JOIN tags ON tags.id = item_tags.tag_id
					WHERE item_tags.item_id = items.id AND tags.name LIKE ?
				)
				OR EXISTS (
					SELECT 1 FROM locations
					WHERE locations.id = items.location_id AND locations.name LIKE ?
				)
			)
		ORDER BY items.updated_at DESC, items.name ASC
		LIMIT 50`,
		"sold", "given_away", "lost", "stolen", "unreturned", "damaged", "archived",
		like, like, like, like, like, like,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanSearchResults(rows, locationPaths)
}

func mergeSearchResults(primary, secondary []SearchResult) []SearchResult {
	seen := make(map[string]struct{}, len(primary))
	out := make([]SearchResult, 0, len(primary)+len(secondary))
	for _, result := range primary {
		seen[result.ID] = struct{}{}
		out = append(out, result)
	}
	for _, result := range secondary {
		if _, ok := seen[result.ID]; !ok {
			seen[result.ID] = struct{}{}
			out = append(out, result)
		}
	}
	return out
}

func scanSearchResults(rows *sql.Rows, locationPaths map[string]string) ([]SearchResult, error) {
	out := []SearchResult{}
	for rows.Next() {
		var result SearchResult
		var homeBaseID *string
		var currentStatusTag *string
		if err := rows.Scan(
			&result.ID, &result.Name, &result.Type, &result.Status,
			&result.LocationID, &homeBaseID, &currentStatusTag, &result.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if result.LocationID != nil {
			if path, ok := locationPaths[*result.LocationID]; ok {
				result.LocationPath = &path
			}
		}
		if result.Type == "essentials" && currentStatusTag != nil {
			hint := fmt.Sprintf("当前状态：%s", *currentStatusTag)
			if homeBaseID != nil {
				if path, ok := locationPaths[*homeBaseID]; ok {
					hint += "；如果不在身上，请检查基准归宿：" + path
				}
			}
			days := (time.Now().Unix() - result.UpdatedAt) / 86400
			if days <= 0 {
				hint += "；最后确认：今天"
			} else {
				hint += fmt.Sprintf("；最后确认：%d 天前", days)
			}
			result.EssentialsHint = &hint
		}
		out = append(out, result)
	}
	return out, rows.Err()
}

func searchTimeField(field string) string {
	switch field {
	case "purchase_date":
		return "items.purchase_date"
	case "exit_date":
		return "items.exit_date"
	case "created_at":
		return "items.created_at"
	default:
		return ""
	}
}

func searchSortField(field string) string {
	switch field {
	case "name":
		return "items.name"
	case "purchase_date":
		return "items.purchase_date"
	case "updated_at":
		return "items.updated_at"
	default:
		return ""
	}
}

func nonEmptyStringPtr(p *string) *string {
	if p == nil {
		return nil
	}
	value := strings.TrimSpace(*p)
	if value == "" {
		return nil
	}
	return &value
}
