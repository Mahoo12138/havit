package service

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/mahoo12138/havit/internal/model"
)

func newTestSearchService(t *testing.T) (*SearchService, *ItemService, string) {
	t.Helper()

	db := newTestDB(t)
	itemSvc := NewItemService(db)
	searchSvc := NewSearchService(db)

	locID := createTestLocation(t, context.Background(), db, "储物间")
	item, err := itemSvc.Create(context.Background(), ItemCreateInput{
		Name:       "HDMI Cable 2m",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	return searchSvc, itemSvc, item.ID
}

func TestSearchFilterNormalize(t *testing.T) {
	f := &SearchFilter{}
	f.Normalize()
	if f.SortDir != "desc" {
		t.Fatalf("expected default sort_dir 'desc', got %q", f.SortDir)
	}

	f = &SearchFilter{Keywords: []string{"  hello ", "", "world  "}}
	f.Normalize()
	if len(f.Keywords) != 2 {
		t.Fatalf("expected 2 keywords after normalize, got %d", len(f.Keywords))
	}
	if f.Keywords[0] != "hello" {
		t.Fatalf("expected 'hello', got %q", f.Keywords[0])
	}

	f = &SearchFilter{SortDir: " ASC "}
	f.Normalize()
	if f.SortDir != "asc" {
		t.Fatalf("expected 'asc', got %q", f.SortDir)
	}

	f = &SearchFilter{Sort: strPtr("name")}
	f.Normalize()
	if f.Sort == nil || *f.Sort != "name" {
		t.Fatal("Sort should be preserved")
	}

	f = &SearchFilter{Sort: strPtr("")}
	f.Normalize()
	if f.Sort != nil {
		t.Fatal("empty Sort should become nil")
	}
}

func TestSearchFilterByKeyword(t *testing.T) {
	ctx := context.Background()
	searchSvc, _, _ := newTestSearchService(t)

	results, err := searchSvc.Filter(ctx, SearchFilter{
		Keywords: []string{"HDMI"},
	})
	if err != nil {
		t.Fatalf("Filter: %v", err)
	}
	if len(results) == 0 {
		t.Fatal("expected at least 1 result for keyword 'HDMI'")
	}
	if results[0].Name != "HDMI Cable 2m" {
		t.Fatalf("expected 'HDMI Cable 2m', got %s", results[0].Name)
	}
}

func TestSearchFilterByType(t *testing.T) {
	ctx := context.Background()
	searchSvc, itemSvc, _ := newTestSearchService(t)

	locID := createTestLocation(t, ctx, searchSvc.db, "厨房")
	itemSvc.Create(ctx, ItemCreateInput{
		Name:       "Rice Cooker",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})

	itemType := string(model.ItemTypeDurable)
	results, err := searchSvc.Filter(ctx, SearchFilter{
		Type: &itemType,
	})
	if err != nil {
		t.Fatalf("Filter by type: %v", err)
	}
	if len(results) < 2 {
		t.Fatalf("expected at least 2 durable items, got %d", len(results))
	}
}

func TestSearchFilterByStatus(t *testing.T) {
	ctx := context.Background()
	searchSvc, itemSvc, itemID := newTestSearchService(t)

	status := string(model.StatusInStock)
	results, err := searchSvc.Filter(ctx, SearchFilter{
		Status: &status,
	})
	if err != nil {
		t.Fatalf("Filter by status: %v", err)
	}
	found := false
	for _, r := range results {
		if r.ID == itemID {
			found = true
			break
		}
	}
	if !found {
		t.Fatal("expected to find the created item with in_stock status")
	}

	_ = itemSvc.Archive(ctx, itemID)
	archivedStatus := string(model.StatusArchived)
	archived, err := searchSvc.Filter(ctx, SearchFilter{
		Status: &archivedStatus,
	})
	if err != nil {
		t.Fatalf("Filter archived: %v", err)
	}
	if len(archived) != 1 {
		t.Fatalf("expected exactly 1 archived item, got %d", len(archived))
	}
}

func TestSearchFilterIdleDays(t *testing.T) {
	ctx := context.Background()
	searchSvc, _, _ := newTestSearchService(t)

	idleDays := 90
	results, err := searchSvc.Filter(ctx, SearchFilter{
		IdleDays: &idleDays,
	})
	if err != nil {
		t.Fatalf("Filter idle days: %v", err)
	}
	if len(results) != 0 {
		t.Fatalf("expected 0 items idle >90 days for fresh DB, got %d", len(results))
	}
}

func TestSearchFilterNegativeIdleDays(t *testing.T) {
	ctx := context.Background()
	searchSvc, _, _ := newTestSearchService(t)

	negative := -1
	results, err := searchSvc.Filter(ctx, SearchFilter{
		IdleDays: &negative,
	})
	if err != nil {
		t.Fatalf("Filter with negative idle days: %v", err)
	}
	if len(results) == 0 {
		t.Fatal("expected items when idle_days is negative (no filter applied)")
	}
}

func TestSearchLikeFallback(t *testing.T) {
	ctx := context.Background()
	searchSvc, _, _ := newTestSearchService(t)

	results, err := searchSvc.like(ctx, "Cable", nil)
	if err != nil {
		t.Fatalf("like: %v", err)
	}
	if len(results) == 0 {
		t.Fatal("expected at least 1 result for LIKE 'Cable'")
	}
}

func TestSearchFTSNoResults(t *testing.T) {
	ctx := context.Background()
	searchSvc, _, _ := newTestSearchService(t)

	results, err := searchSvc.FTS(ctx, "NONEXISTENT_TERM_XYZ")
	if err != nil {
		t.Fatalf("FTS: %v", err)
	}
	if len(results) != 0 {
		t.Fatalf("expected 0 results, got %d", len(results))
	}
}

func TestSearchFTSWithEmptyQuery(t *testing.T) {
	ctx := context.Background()
	searchSvc, _, _ := newTestSearchService(t)

	results, err := searchSvc.FTS(ctx, "")
	if err != nil {
		t.Fatalf("FTS empty: %v", err)
	}
	if len(results) != 0 {
		t.Fatalf("expected 0 results for empty query, got %d", len(results))
	}
}

func TestSearchFTSChineseQueriesFindItems(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	searchSvc := NewSearchService(database)

	locID := createTestLocation(t, ctx, database, "书房")
	if _, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "佳能单反相机",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	}); err != nil {
		t.Fatalf("create item: %v", err)
	}

	for _, query := range []string{"单反相机", "相机", "佳能"} {
		results, err := searchSvc.FTS(ctx, query)
		if err != nil {
			t.Fatalf("FTS %q: %v", query, err)
		}
		if len(results) != 1 || results[0].Name != "佳能单反相机" {
			t.Fatalf("expected Chinese query %q to find the item, got %#v", query, results)
		}
	}
}

func TestSearchFTSSpecialCharactersDoNotError(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	searchSvc := NewSearchService(database)

	locID := createTestLocation(t, ctx, database, "书房")
	if _, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "100% 纯棉 T恤(白色)",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	}); err != nil {
		t.Fatalf("create item: %v", err)
	}

	// Substring queries that contain FTS5 syntax characters must still find the item.
	for _, query := range []string{`100% 纯棉`, `"纯棉"`, `T恤(白色)`} {
		results, err := searchSvc.FTS(ctx, query)
		if err != nil {
			t.Fatalf("FTS %q must not error, got: %v", query, err)
		}
		if len(results) != 1 {
			t.Fatalf("expected query %q to find the item via LIKE, got %d results", query, len(results))
		}
	}

	// Pure syntax characters must not error either, even when nothing matches.
	for _, query := range []string{`: : ( ) " *`, "A OR B"} {
		if _, err := searchSvc.FTS(ctx, query); err != nil {
			t.Fatalf("FTS %q must not error, got: %v", query, err)
		}
	}
}

func TestSearchFTSFindsItemsByTag(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	tagSvc := NewTagService(database)
	searchSvc := NewSearchService(database)

	locID := createTestLocation(t, ctx, database, "书房")
	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "镜头 50mm",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	tag, err := tagSvc.Create(ctx, TagCreateInput{Name: "尼康"})
	if err != nil {
		t.Fatalf("create tag: %v", err)
	}
	if _, err := itemSvc.ReplaceTags(ctx, item.ID, []string{tag.ID}); err != nil {
		t.Fatalf("replace tags: %v", err)
	}

	results, err := searchSvc.FTS(ctx, "尼康")
	if err != nil {
		t.Fatalf("FTS: %v", err)
	}
	if len(results) != 1 || results[0].Name != "镜头 50mm" {
		t.Fatalf("expected tag keyword to find the item, got %#v", results)
	}
}

func TestSearchFTSFindsItemsByLocationName(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	searchSvc := NewSearchService(database)

	locID := createTestLocation(t, ctx, database, "防潮箱")
	if _, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "备用镜头",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	}); err != nil {
		t.Fatalf("create item: %v", err)
	}

	results, err := searchSvc.FTS(ctx, "防潮箱")
	if err != nil {
		t.Fatalf("FTS: %v", err)
	}
	if len(results) != 1 || results[0].Name != "备用镜头" {
		t.Fatalf("expected location keyword to find the item, got %#v", results)
	}
	if results[0].LocationPath == nil || *results[0].LocationPath != "防潮箱" {
		t.Fatalf("expected location path in result, got %#v", results[0].LocationPath)
	}
}

func TestSearchMatchExpressionQuotesTerms(t *testing.T) {
	got := matchExpression(`相机 (1) "新款"`)
	want := `"相机" AND "(1)" AND """新款"""`
	if got != want {
		t.Fatalf("unexpected match expression: got %q, want %q", got, want)
	}
}

func TestSearchEssentialsHintIncludesLastConfirmed(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	searchSvc := NewSearchService(database)

	locID := createTestLocation(t, ctx, database, "玄关")
	if _, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:               "门禁卡",
		Type:               model.ItemTypeEssentials,
		LocationID:         &locID,
		HomeBaseLocationID: &locID,
		CurrentStatusTag:   strPtr("@home"),
	}); err != nil {
		t.Fatalf("create essentials item: %v", err)
	}

	results, err := searchSvc.FTS(ctx, "门禁卡")
	if err != nil {
		t.Fatalf("FTS: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %#v", results)
	}
	hint := results[0].EssentialsHint
	if hint == nil ||
		!strings.Contains(*hint, "当前状态：@home") ||
		!strings.Contains(*hint, "基准归宿：玄关") ||
		!strings.Contains(*hint, "最后确认") {
		t.Fatalf("expected a full essentials hint, got %#v", hint)
	}
}

func TestSearchAttachesLoanHintForBorrowedItems(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	loanSvc := NewLoanService(database)
	searchSvc := NewSearchService(database)

	locID := createTestLocation(t, ctx, database, "书房")
	borrowed, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "投影仪",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create borrowed item: %v", err)
	}
	due := time.Now().Add(7 * 24 * time.Hour).Unix()
	if _, err := loanSvc.Create(ctx, borrowed.ID, LoanCreateInput{
		BorrowerName: "小王",
		DueAt:        &due,
	}); err != nil {
		t.Fatalf("create loan: %v", err)
	}

	overdue, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "游戏机",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create overdue item: %v", err)
	}
	pastDue := time.Now().Add(-48 * time.Hour).Unix()
	if _, err := loanSvc.Create(ctx, overdue.ID, LoanCreateInput{
		BorrowerName: "小李",
		DueAt:        &pastDue,
	}); err != nil {
		t.Fatalf("create overdue loan: %v", err)
	}

	results, err := searchSvc.FTS(ctx, "仪")
	if err != nil {
		t.Fatalf("FTS: %v", err)
	}
	if len(results) != 1 || results[0].Name != "投影仪" {
		t.Fatalf("expected only the projector to match, got %#v", results)
	}
	if results[0].LoanHint == nil ||
		!strings.Contains(*results[0].LoanHint, "小王") ||
		!strings.Contains(*results[0].LoanHint, "应还") ||
		strings.Contains(*results[0].LoanHint, "已逾期") {
		t.Fatalf("expected an active loan hint for 小王, got %#v", results[0].LoanHint)
	}

	filtered, err := searchSvc.Filter(ctx, SearchFilter{Keywords: []string{"游戏机"}})
	if err != nil {
		t.Fatalf("Filter: %v", err)
	}
	if len(filtered) != 1 || filtered[0].LoanHint == nil ||
		!strings.Contains(*filtered[0].LoanHint, "小李") ||
		!strings.Contains(*filtered[0].LoanHint, "已逾期") {
		t.Fatalf("expected an overdue loan hint for 小李, got %#v", filtered)
	}
}

func TestSearchFilterTimeField(t *testing.T) {
	tests := []struct {
		field string
		want  string
	}{
		{"purchase_date", "items.purchase_date"},
		{"exit_date", "items.exit_date"},
		{"created_at", "items.created_at"},
		{"unknown", ""},
	}
	for _, tt := range tests {
		if got := searchTimeField(tt.field); got != tt.want {
			t.Errorf("searchTimeField(%q): expected %q, got %q", tt.field, tt.want, got)
		}
	}
}

func TestSearchFilterSortField(t *testing.T) {
	tests := []struct {
		field string
		want  string
	}{
		{"name", "items.name"},
		{"purchase_date", "items.purchase_date"},
		{"updated_at", "items.updated_at"},
		{"unknown", ""},
	}
	for _, tt := range tests {
		if got := searchSortField(tt.field); got != tt.want {
			t.Errorf("searchSortField(%q): expected %q, got %q", tt.field, tt.want, got)
		}
	}
}

func TestSearchFilterSortWithSortDir(t *testing.T) {
	ctx := context.Background()
	searchSvc, itemSvc, _ := newTestSearchService(t)

	locID := createTestLocation(t, ctx, searchSvc.db, "车库")
	itemSvc.Create(ctx, ItemCreateInput{
		Name:       "AAA Batteries",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	itemSvc.Create(ctx, ItemCreateInput{
		Name:       "AAA Batteries",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})

	sortField := "name"
	results, err := searchSvc.Filter(ctx, SearchFilter{
		Keywords: []string{"Batteries"},
		Sort:     &sortField,
		SortDir:  "asc",
	})
	if err != nil {
		t.Fatalf("Filter with sort: %v", err)
	}
	if len(results) == 0 {
		t.Fatal("expected results for keyword 'Batteries'")
	}
}

func TestSearchNonEmptyStringPtr(t *testing.T) {
	str := "hello"
	p := nonEmptyStringPtr(&str)
	if p == nil || *p != "hello" {
		t.Fatal("nonEmptyStringPtr should keep hello")
	}

	empty := ""
	p = nonEmptyStringPtr(&empty)
	if p != nil {
		t.Fatal("nonEmptyStringPtr should return nil for empty string")
	}

	p = nonEmptyStringPtr(nil)
	if p != nil {
		t.Fatal("nonEmptyStringPtr should return nil for nil input")
	}
}

func TestSearchFilterTags(t *testing.T) {
	f := &SearchFilter{
		Tags: []string{"#electronics ", "  tools  ", " # "},
	}
	f.Normalize()
	if len(f.Tags) != 2 {
		t.Fatalf("expected 2 tags after normalize, got %d: %v", len(f.Tags), f.Tags)
	}
	if f.Tags[0] != "electronics" {
		t.Fatalf("expected 'electronics', got %q", f.Tags[0])
	}
	if f.Tags[1] != "tools" {
		t.Fatalf("expected 'tools', got %q", f.Tags[1])
	}
}

func TestSearchFilterTimeFilterBefore(t *testing.T) {
	ctx := context.Background()
	searchSvc, _, _ := newTestSearchService(t)

	field := "created_at"
	op := "before"
	val := time.Now().Add(24 * time.Hour).Unix()
	results, err := searchSvc.Filter(ctx, SearchFilter{
		TimeFilter: &SearchTimeFilter{
			Field: &field,
			Op:    &op,
			Value: &val,
		},
	})
	if err != nil {
		t.Fatalf("Filter with time before: %v", err)
	}
	if len(results) == 0 {
		t.Fatal("expected results with time before tomorrow")
	}
}

func TestSearchFilterTimeFilterAfter(t *testing.T) {
	ctx := context.Background()
	searchSvc, _, _ := newTestSearchService(t)

	field := "created_at"
	op := "after"
	val := time.Now().Add(-24 * time.Hour).Unix()
	results, err := searchSvc.Filter(ctx, SearchFilter{
		TimeFilter: &SearchTimeFilter{
			Field: &field,
			Op:    &op,
			Value: &val,
		},
	})
	if err != nil {
		t.Fatalf("Filter with time after: %v", err)
	}
	if len(results) == 0 {
		t.Fatal("expected results with time after yesterday")
	}
}

func TestSearchFilterTimeFilterBetween(t *testing.T) {
	ctx := context.Background()
	searchSvc, _, _ := newTestSearchService(t)

	field := "created_at"
	op := "between"
	val := time.Now().Add(-24 * time.Hour).Unix()
	val2 := time.Now().Add(24 * time.Hour).Unix()
	results, err := searchSvc.Filter(ctx, SearchFilter{
		TimeFilter: &SearchTimeFilter{
			Field:  &field,
			Op:     &op,
			Value:  &val,
			Value2: &val2,
		},
	})
	if err != nil {
		t.Fatalf("Filter with time between: %v", err)
	}
	if len(results) == 0 {
		t.Fatal("expected results with time between yesterday and tomorrow")
	}
}

func TestSearchFilterStockLow(t *testing.T) {
	ctx := context.Background()
	searchSvc, itemSvc, _ := newTestSearchService(t)

	locID := createTestLocation(t, ctx, searchSvc.db, "仓库")
	stockLow := 5
	stock := 3
	itemSvc.Create(ctx, ItemCreateInput{
		Name:              "Paper Clips",
		Type:              model.ItemTypeTrackedSpares,
		LocationID:        &locID,
		CurrentStock:      &stock,
		MinStockThreshold: &stockLow,
	})

	low := true
	results, err := searchSvc.Filter(ctx, SearchFilter{
		StockLow: &low,
	})
	if err != nil {
		t.Fatalf("Filter stock low: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 item with low stock, got %d", len(results))
	}
}

func TestSearchFilterWarrantyExpiring(t *testing.T) {
	ctx := context.Background()
	searchSvc, itemSvc, _ := newTestSearchService(t)

	locID := createTestLocation(t, ctx, searchSvc.db, "商店")
	expiry := time.Now().Add(7 * 24 * time.Hour).Unix()
	itemSvc.Create(ctx, ItemCreateInput{
		Name:              "Expensive Gadget",
		Type:              model.ItemTypeDurable,
		LocationID:        &locID,
		WarrantyExpiresAt: &expiry,
	})

	days := 30
	results, err := searchSvc.Filter(ctx, SearchFilter{
		WarrantyExpiringDays: &days,
	})
	if err != nil {
		t.Fatalf("Filter warranty: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 item with expiring warranty, got %d", len(results))
	}
}

func strPtr(s string) *string { return &s }
