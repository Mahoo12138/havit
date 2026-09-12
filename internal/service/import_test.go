package service

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestSplitPathAcceptsSupportedSeparatorsAndTrimsEmptySegments(t *testing.T) {
	got := splitPath("书房 / 书桌 -> 抽屉 > 左侧 →  ")
	want := []string{"书房", "书桌", "抽屉", "左侧"}

	if len(got) != len(want) {
		t.Fatalf("expected %d path segments, got %d: %#v", len(want), len(got), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("segment %d: expected %q, got %q", i, want[i], got[i])
		}
	}
}

func TestParseDateAcceptsSupportedFormats(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want int64
	}{
		{name: "epoch seconds", in: "1717200000", want: 1717200000},
		{name: "date with dashes", in: "2026-06-08", want: time.Date(2026, 6, 8, 0, 0, 0, 0, time.UTC).Unix()},
		{name: "date with slashes", in: "2026/06/08", want: time.Date(2026, 6, 8, 0, 0, 0, 0, time.UTC).Unix()},
		{name: "rfc3339", in: "2026-06-08T12:34:56Z", want: time.Date(2026, 6, 8, 12, 34, 56, 0, time.UTC).Unix()},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseDate(tt.in)
			if err != nil {
				t.Fatalf("parse date: %v", err)
			}
			if got != tt.want {
				t.Fatalf("expected %d, got %d", tt.want, got)
			}
		})
	}
}

func TestParseDateRejectsUnknownFormat(t *testing.T) {
	_, err := parseDate("06-08-2026")
	if err == nil {
		t.Fatal("expected unknown date format to be rejected")
	}
}

func TestImportCSVCreatesValidRowsAndReportsInvalidRows(t *testing.T) {
	ctx := context.Background()
	svc := NewImportService(newTestDB(t))

	body := strings.NewReader(strings.Join([]string{
		"name,type,category,location,purchase_price,purchase_date,serial_number",
		"机械键盘,durable,外设,书房/书桌,399.50,2026-06-08,SN-001",
		",durable,外设,书房,10,2026-06-08,SN-002",
		"未知物品,mystery,杂物,仓库,20,2026-06-08,SN-003",
	}, "\n"))

	res, err := svc.Import(ctx, body, "", ImportOptions{Format: ImportCSV})
	if err != nil {
		t.Fatalf("import csv: %v", err)
	}

	if res.Total != 3 {
		t.Fatalf("expected total 3, got %d", res.Total)
	}
	if res.Created != 1 {
		t.Fatalf("expected one created row, got %d", res.Created)
	}
	if res.Failed != 2 {
		t.Fatalf("expected two failed rows, got %d", res.Failed)
	}
	if len(res.Errors) != 2 {
		t.Fatalf("expected two import errors, got %d", len(res.Errors))
	}
	if res.Errors[0].Line != 3 || res.Errors[0].Message != "name required" {
		t.Fatalf("unexpected first error: %#v", res.Errors[0])
	}
	if res.Errors[1].Line != 4 || res.Errors[1].Message != "invalid type: mystery" {
		t.Fatalf("unexpected second error: %#v", res.Errors[1])
	}
	if len(res.Errors[0].Row) == 0 {
		t.Fatal("expected failed rows to carry their parsed values")
	}
}

func TestImportFullFieldsCSV(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewImportService(database)

	body := strings.NewReader(strings.Join([]string{
		"name,type,status,category,description,location,home_base_location,current_status_tag," +
			"purchase_price,purchase_currency,purchase_date,purchase_platform," +
			"warranty_expires_at,serial_number,warranty_contact," +
			"current_stock,min_stock_threshold,lifespan_days,in_use_since,is_private,tags",
		"空气净化器,durable,idle,家电,滤芯可用,客厅,客厅,," +
			"1299.00,CNY,2025-01-01,京东," +
			"2028-01-01,SN-AIR-1,官方售后," +
			"2,1,365,2025-01-01,false,家电|净化",
	}, "\n"))

	res, err := svc.Import(ctx, body, "", ImportOptions{Format: ImportCSV})
	if err != nil {
		t.Fatalf("import csv: %v", err)
	}
	if res.Created != 1 || res.Failed != 0 {
		t.Fatalf("unexpected result: %+v", res)
	}

	var (
		itemType, status, category, desc string
		locName, homeBaseName            string
		currentStatusTag                 string
		price                            float64
		currency                         string
		stock, threshold, lifespan       int
		inUseSince                       int64
		isPrivate                        int
	)
	err = database.QueryRowContext(ctx, `
		SELECT i.type, i.status, i.category, i.description,
			l.name, hb.name, COALESCE(i.current_status_tag, ''),
			i.purchase_price, i.purchase_currency,
			i.current_stock, i.min_stock_threshold, i.lifespan_days, i.in_use_since,
			i.is_private
		FROM items i
		LEFT JOIN locations l ON l.id = i.location_id
		LEFT JOIN locations hb ON hb.id = i.home_base_location_id
		WHERE i.name = '空气净化器'`).
		Scan(&itemType, &status, &category, &desc,
			&locName, &homeBaseName, &currentStatusTag,
			&price, &currency,
			&stock, &threshold, &lifespan, &inUseSince,
			&isPrivate)
	if err != nil {
		t.Fatalf("query imported item: %v", err)
	}

	if itemType != "durable" || status != "idle" || category != "家电" || desc != "滤芯可用" {
		t.Fatalf("basic fields wrong: type=%s status=%s category=%s desc=%s", itemType, status, category, desc)
	}
	if locName != "客厅" || homeBaseName != "客厅" || currentStatusTag != "" {
		t.Fatalf("location fields wrong: loc=%s home=%s tag=%s", locName, homeBaseName, currentStatusTag)
	}
	if price != 1299.0 || currency != "CNY" {
		t.Fatalf("purchase fields wrong: price=%v currency=%s", price, currency)
	}
	if stock != 2 || threshold != 1 || lifespan != 365 || inUseSince != time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC).Unix() {
		t.Fatalf("consumable fields wrong: stock=%d threshold=%d lifespan=%d in_use=%d", stock, threshold, lifespan, inUseSince)
	}
	if isPrivate != 0 {
		t.Fatalf("expected shared item, is_private=%d", isPrivate)
	}

	var tagCount int
	if err := database.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM item_tags it JOIN tags tg ON tg.id = it.tag_id
		JOIN items i ON i.id = it.item_id WHERE i.name = '空气净化器'`).Scan(&tagCount); err != nil {
		t.Fatalf("count tags: %v", err)
	}
	if tagCount != 2 {
		t.Fatalf("expected 2 tags, got %d", tagCount)
	}

	var warranty int64
	if err := database.QueryRowContext(ctx, `SELECT warranty_expires_at FROM items WHERE name = '空气净化器'`).Scan(&warranty); err != nil {
		t.Fatalf("query warranty: %v", err)
	}
	if warranty != time.Date(2028, 1, 1, 0, 0, 0, 0, time.UTC).Unix() {
		t.Fatalf("expected warranty expiry, got %d", warranty)
	}
}

func TestImportJSONAcceptsTypedValuesAndExportEnvelope(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewImportService(database)

	// Mirrors the export envelope: typed numbers, bools and tag objects.
	body := strings.NewReader(`{
		"exported_at": 1717200000,
		"items": [
			{
				"name": "机械键盘",
				"type": "durable",
				"status": "in_stock",
				"category": "外设",
				"location_path": "书房/书桌",
				"purchase_price": 399.5,
				"purchase_currency": "CNY",
				"purchase_date": 1717200000,
				"current_stock": 1,
				"is_private": false,
				"tags": [{"id": "t1", "name": "外设", "color": "#fff"}]
			}
		]
	}`)

	res, err := svc.Import(ctx, body, "", ImportOptions{Format: ImportJSON})
	if err != nil {
		t.Fatalf("import json: %v", err)
	}
	if res.Created != 1 || res.Failed != 0 {
		t.Fatalf("unexpected result: %+v", res)
	}

	var price float64
	var locName string
	if err := database.QueryRowContext(ctx, `
		SELECT i.purchase_price, l.name FROM items i
		LEFT JOIN locations l ON l.id = i.location_id
		WHERE i.name = '机械键盘'`).Scan(&price, &locName); err != nil {
		t.Fatalf("query item: %v", err)
	}
	if price != 399.5 {
		t.Fatalf("expected numeric price round-trip, got %v", price)
	}
	if locName != "书桌" {
		t.Fatalf("expected location from location_path, got %q", locName)
	}

	var tagName string
	if err := database.QueryRowContext(ctx, `
		SELECT tg.name FROM item_tags it JOIN tags tg ON tg.id = it.tag_id
		JOIN items i ON i.id = it.item_id WHERE i.name = '机械键盘'`).Scan(&tagName); err != nil {
		t.Fatalf("query tag: %v", err)
	}
	if tagName != "外设" {
		t.Fatalf("expected tag from object array, got %q", tagName)
	}
}

func TestImportCSVAutoDetectsChineseHeaders(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewImportService(database)

	body := strings.NewReader(strings.Join([]string{
		"名称,类型,分类,位置,价格,购买日期,序列号,标签",
		"保温杯,essentials,日用,书房/抽屉,59.9,2026-03-01,SN-CUP-1,日常|随身",
	}, "\n"))

	res, err := svc.Import(ctx, body, "", ImportOptions{Format: ImportCSV})
	if err != nil {
		t.Fatalf("import csv: %v", err)
	}
	if res.Created != 1 {
		t.Fatalf("expected one created row, got %+v", res)
	}

	var itemType string
	if err := database.QueryRowContext(ctx, `SELECT type FROM items WHERE name = '保温杯'`).Scan(&itemType); err != nil {
		t.Fatalf("query type: %v", err)
	}
	if itemType != "essentials" {
		t.Fatalf("expected auto-detected type, got %q", itemType)
	}
}

func TestImportExplicitMapping(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewImportService(database)

	// A foreign tool's columns with an explicit mapping (by header name).
	body := strings.NewReader(strings.Join([]string{
		"Title,Where,Cost",
		"露营灯,阳台/收纳架,88",
	}, "\n"))
	mapping := map[string]string{
		"name":           "Title",
		"location":       "Where",
		"purchase_price": "Cost",
	}
	res, err := svc.Import(ctx, body, "", ImportOptions{Format: ImportCSV, Mapping: mapping})
	if err != nil {
		t.Fatalf("import csv: %v", err)
	}
	if res.Created != 1 {
		t.Fatalf("expected one created row, got %+v", res)
	}

	var price float64
	var locName string
	if err := database.QueryRowContext(ctx, `
		SELECT i.purchase_price, l.name FROM items i
		LEFT JOIN locations l ON l.id = i.location_id
		WHERE i.name = '露营灯'`).Scan(&price, &locName); err != nil {
		t.Fatalf("query item: %v", err)
	}
	if price != 88 || locName != "收纳架" {
		t.Fatalf("explicit mapping not applied: price=%v loc=%s", price, locName)
	}
}

func TestImportExplicitMappingRequiresName(t *testing.T) {
	ctx := context.Background()
	svc := NewImportService(newTestDB(t))

	body := strings.NewReader("A,B\n1,2\n")
	_, err := svc.Import(ctx, body, "", ImportOptions{
		Format:  ImportCSV,
		Mapping: map[string]string{"type": "B"},
	})
	if err == nil || !strings.Contains(err.Error(), "name") {
		t.Fatalf("expected error about missing name mapping, got %v", err)
	}
}

func TestImportDuplicatePolicies(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewImportService(database)

	first := strings.NewReader(strings.Join([]string{
		"name,location,description,status,tags",
		"路由器,书房,原描述,idle,网络",
	}, "\n"))
	res, err := svc.Import(ctx, first, "", ImportOptions{Format: ImportCSV})
	if err != nil || res.Created != 1 {
		t.Fatalf("seed import failed: %v %+v", err, res)
	}

	// Same row again with default skip → nothing changes.
	again := strings.NewReader(strings.Join([]string{
		"name,location,description,status,tags",
		"路由器,书房,新描述,idle,网络",
	}, "\n"))
	res, err = svc.Import(ctx, again, "", ImportOptions{Format: ImportCSV})
	if err != nil {
		t.Fatalf("skip import: %v", err)
	}
	if res.Skipped != 1 || res.Created != 0 {
		t.Fatalf("expected skip, got %+v", res)
	}
	var desc string
	if err := database.QueryRowContext(ctx, `SELECT description FROM items WHERE name = '路由器'`).Scan(&desc); err != nil {
		t.Fatalf("query: %v", err)
	}
	if desc != "原描述" {
		t.Fatalf("skip mode must not change the item, got %q", desc)
	}

	// Update mode: non-empty fields overwritten, empty fields kept, tags replaced.
	update := strings.NewReader(strings.Join([]string{
		"name,location,description,status,tags,current_stock",
		"路由器,书房,新描述,,网络|办公,3",
	}, "\n"))
	res, err = svc.Import(ctx, update, "", ImportOptions{Format: ImportCSV, OnDuplicate: OnDuplicateUpdate})
	if err != nil {
		t.Fatalf("update import: %v", err)
	}
	if res.Updated != 1 || res.Created != 0 {
		t.Fatalf("expected one update, got %+v", res)
	}
	err = database.QueryRowContext(ctx, `
		SELECT i.description || '|' || i.status || '|' || COALESCE(i.current_stock, -1)
		FROM items i WHERE i.name = '路由器'`).Scan(&desc)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if desc != "新描述|idle|3" {
		t.Fatalf("update semantics wrong: %q", desc)
	}
	var tagCount int
	if err := database.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM item_tags it JOIN tags tg ON tg.id = it.tag_id
		JOIN items i ON i.id = it.item_id WHERE i.name = '路由器'`).Scan(&tagCount); err != nil {
		t.Fatalf("count tags: %v", err)
	}
	if tagCount != 2 {
		t.Fatalf("expected tags replaced with 2, got %d", tagCount)
	}

	// Append mode: duplicates are force-created.
	appendBody := strings.NewReader(strings.Join([]string{
		"name,location",
		"路由器,书房",
	}, "\n"))
	res, err = svc.Import(ctx, appendBody, "", ImportOptions{Format: ImportCSV, OnDuplicate: OnDuplicateAppend})
	if err != nil {
		t.Fatalf("append import: %v", err)
	}
	if res.Created != 1 {
		t.Fatalf("expected append to create a row, got %+v", res)
	}
	var count int
	if err := database.QueryRowContext(ctx, `SELECT COUNT(*) FROM items WHERE name = '路由器'`).Scan(&count); err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != 2 {
		t.Fatalf("expected two router items after append, got %d", count)
	}
}

func TestImportPreviewMatchesCommitAndWritesNothing(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewImportService(database)

	// Pre-create an item so the preview sees a duplicate.
	if _, err := svc.Import(ctx, strings.NewReader("name,location\n吹风机,浴室\n"), "", ImportOptions{Format: ImportCSV}); err != nil {
		t.Fatalf("seed: %v", err)
	}

	body := strings.NewReader(strings.Join([]string{
		"name,type,location",
		"吹风机,durable,浴室",
		"新耳机,durable,书房",
		"坏行,badtype,书房",
	}, "\n"))

	preview, err := svc.Preview(ctx, body, "", ImportOptions{Format: ImportCSV})
	if err != nil {
		t.Fatalf("preview: %v", err)
	}

	if preview.Total != 3 {
		t.Fatalf("expected total 3, got %d", preview.Total)
	}
	if preview.Stats.Ok != 1 || preview.Stats.Duplicate != 1 || preview.Stats.Error != 1 {
		t.Fatalf("unexpected stats: %+v", preview.Stats)
	}
	statuses := map[string]int{}
	for _, r := range preview.Rows {
		statuses[r.Status]++
	}
	if statuses["ok"] != 1 || statuses["duplicate"] != 1 || statuses["error"] != 1 {
		t.Fatalf("unexpected row statuses: %#v", statuses)
	}
	if preview.Mapping["name"] != "name" {
		t.Fatalf("expected auto-detected mapping, got %#v", preview.Mapping)
	}

	// Preview must not create items.
	var count int
	if err := database.QueryRowContext(ctx, `SELECT COUNT(*) FROM items WHERE name IN ('吹风机','新耳机','坏行')`).Scan(&count); err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != 1 {
		t.Fatalf("preview must not write, found %d items", count)
	}

	// Commit matches the preview counts.
	body = strings.NewReader(strings.Join([]string{
		"name,type,location",
		"吹风机,durable,浴室",
		"新耳机,durable,书房",
		"坏行,badtype,书房",
	}, "\n"))
	res, err := svc.Import(ctx, body, "", ImportOptions{Format: ImportCSV})
	if err != nil {
		t.Fatalf("commit: %v", err)
	}
	if res.Created != 1 || res.Skipped != 1 || res.Failed != 1 {
		t.Fatalf("commit must match preview: %+v", res)
	}
}

func TestImportTrackedSparesDefaultThreshold(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewImportService(database)

	body := strings.NewReader("name,type,current_stock\n滤芯,tracked_spares,2\n")
	if _, err := svc.Import(ctx, body, "", ImportOptions{Format: ImportCSV}); err != nil {
		t.Fatalf("import: %v", err)
	}
	var threshold int
	if err := database.QueryRowContext(ctx, `SELECT min_stock_threshold FROM items WHERE name = '滤芯'`).Scan(&threshold); err != nil {
		t.Fatalf("query: %v", err)
	}
	if threshold != 1 {
		t.Fatalf("expected default threshold 1, got %d", threshold)
	}
}

func TestImportPrivacySkipsHiddenPrivateItems(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewImportService(database)

	for _, u := range []string{"alice", "bob"} {
		if _, err := database.ExecContext(ctx,
			`INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, 'x', 'owner', 0)`,
			u, u); err != nil {
			t.Fatalf("create user %s: %v", u, err)
		}
	}

	// Alice owns a private item; Bob imports the same name+location → must not
	// update Alice's item, and must create his own instead.
	if _, err := svc.Import(ctx, strings.NewReader("name,location,is_private\n私藏,抽屉,true\n"), "alice", ImportOptions{Format: ImportCSV}); err != nil {
		t.Fatalf("alice import: %v", err)
	}
	res, err := svc.Import(ctx, strings.NewReader("name,location,description\n私藏,抽屉,bob版本\n"), "bob", ImportOptions{
		Format:      ImportCSV,
		OnDuplicate: OnDuplicateUpdate,
	})
	if err != nil {
		t.Fatalf("bob import: %v", err)
	}
	if res.Created != 1 || res.Updated != 0 {
		t.Fatalf("expected bob to create his own item, got %+v", res)
	}

	var desc string
	if err := database.QueryRowContext(ctx, `SELECT description FROM items WHERE name = '私藏' AND owner_id = 'bob'`).Scan(&desc); err != nil {
		t.Fatalf("bob item: %v", err)
	}
	if desc != "bob版本" {
		t.Fatalf("expected bob's description, got %q", desc)
	}
}

func TestExportCSVIncludesEssentialsRoundTripColumns(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewImportService(database)
	esvc := NewExportService(database, nil)

	if _, err := svc.Import(ctx, strings.NewReader(strings.Join([]string{
		"name,type,location,home_base_location,current_status_tag",
		"钥匙,essentials,书房,书房,@随身",
	}, "\n")), "", ImportOptions{Format: ImportCSV}); err != nil {
		t.Fatalf("import: %v", err)
	}

	data, err := esvc.Items(ctx)
	if err != nil {
		t.Fatalf("export: %v", err)
	}
	if len(data.Items) != 1 {
		t.Fatalf("expected one exported item, got %d", len(data.Items))
	}
	item := data.Items[0]
	if item.HomeBaseLocationPath == nil || *item.HomeBaseLocationPath != "书房" {
		t.Fatalf("expected home base path exported, got %#v", item.HomeBaseLocationPath)
	}
	if item.CurrentStatusTag == nil || *item.CurrentStatusTag != "@随身" {
		t.Fatalf("expected current status tag exported, got %#v", item.CurrentStatusTag)
	}

	// Round-trip: re-importing the export JSON recreates an equivalent item
	// (append because the original is still in the same location).
	var buf strings.Builder
	if err := json.NewEncoder(&buf).Encode(data); err != nil {
		t.Fatalf("encode export: %v", err)
	}
	res, err := svc.Import(ctx, strings.NewReader(buf.String()), "", ImportOptions{
		Format:      ImportJSON,
		OnDuplicate: OnDuplicateAppend,
	})
	if err != nil {
		t.Fatalf("re-import: %v", err)
	}
	if res.Created != 1 {
		t.Fatalf("expected re-import to create one item, got %+v", res)
	}
	var homeBase, statusTag string
	if err := database.QueryRowContext(ctx, `
		SELECT l.name, i.current_status_tag FROM items i
		JOIN locations l ON l.id = i.home_base_location_id
		WHERE i.name = '钥匙' AND i.id != (
			SELECT id FROM items WHERE name = '钥匙' ORDER BY created_at ASC LIMIT 1
		)`).Scan(&homeBase, &statusTag); err != nil {
		t.Fatalf("query re-imported item: %v", err)
	}
	if homeBase != "书房" || statusTag != "@随身" {
		t.Fatalf("round-trip lost fields: home=%q tag=%q", homeBase, statusTag)
	}
}
