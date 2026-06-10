package service

import (
	"context"
	"database/sql"
	"errors"
	"path/filepath"
	"testing"
	"time"

	"github.com/mahoo12138/havit/internal/db"
	"github.com/mahoo12138/havit/internal/model"
)

func newTestDB(t *testing.T) *sql.DB {
	t.Helper()

	database, err := db.Open("file:" + filepath.Join(t.TempDir(), "havit.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Close()
	})

	if err := db.Migrate(database); err != nil {
		t.Fatalf("migrate db: %v", err)
	}

	return database
}

func newTestItemService(t *testing.T) *ItemService {
	t.Helper()

	database := newTestDB(t)
	return NewItemService(database)
}

func createTestLocation(t *testing.T, ctx context.Context, database *sql.DB, name string) string {
	t.Helper()

	id := "loc-" + name
	if _, err := database.ExecContext(ctx,
		`INSERT INTO locations (id, name, type, sort_order, is_private, created_at, updated_at)
		 VALUES (?, ?, 'room', 0, 0, 1, 1)`,
		id, name,
	); err != nil {
		t.Fatalf("create test location: %v", err)
	}
	return id
}

func TestItemListHidesArchivedByDefault(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	active, err := svc.Create(ctx, ItemCreateInput{
		Name:       "备用 HDMI 线",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create active item: %v", err)
	}
	archived, err := svc.Create(ctx, ItemCreateInput{
		Name:       "旧路由器",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create archived item: %v", err)
	}
	if err := svc.Archive(ctx, archived.ID); err != nil {
		t.Fatalf("archive item: %v", err)
	}

	items, err := svc.List(ctx, ItemListFilter{})
	if err != nil {
		t.Fatalf("list items: %v", err)
	}

	if len(items) != 1 {
		t.Fatalf("expected only active item, got %d", len(items))
	}
	if items[0].ID != active.ID {
		t.Fatalf("expected active item %s, got %s", active.ID, items[0].ID)
	}
}

func TestItemListCanExplicitlyShowArchived(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "客厅")

	archived, err := svc.Create(ctx, ItemCreateInput{
		Name:       "退役显示器",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	if err := svc.Archive(ctx, archived.ID); err != nil {
		t.Fatalf("archive item: %v", err)
	}

	items, err := svc.List(ctx, ItemListFilter{Status: string(model.StatusArchived)})
	if err != nil {
		t.Fatalf("list archived items: %v", err)
	}

	if len(items) != 1 {
		t.Fatalf("expected one archived item, got %d", len(items))
	}
	if items[0].ID != archived.ID {
		t.Fatalf("expected archived item %s, got %s", archived.ID, items[0].ID)
	}
	if items[0].Status != model.StatusArchived {
		t.Fatalf("expected archived status, got %s", items[0].Status)
	}
}

func TestItemListSearchesCreatedItemsByKeyword(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "抽屉")

	created, err := svc.Create(ctx, ItemCreateInput{
		Name:       "备用 HDMI 线",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create searchable item: %v", err)
	}

	items, err := svc.List(ctx, ItemListFilter{Query: "HDMI"})
	if err != nil {
		t.Fatalf("search items: %v", err)
	}

	if len(items) != 1 {
		t.Fatalf("expected one search result, got %d", len(items))
	}
	if items[0].ID != created.ID {
		t.Fatalf("expected item %s, got %s", created.ID, items[0].ID)
	}
}

func TestItemCreateRejectsInvalidType(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "仓库")

	_, err := svc.Create(ctx, ItemCreateInput{
		Name:       "未知物品",
		Type:       model.ItemType("mystery"),
		LocationID: &locID,
	})

	if err == nil {
		t.Fatal("expected invalid item type to be rejected")
	}
}

func TestItemCreateRequiresLocation(t *testing.T) {
	ctx := context.Background()
	svc := newTestItemService(t)

	_, err := svc.Create(ctx, ItemCreateInput{
		Name: "未定位物品",
		Type: model.ItemTypeDurable,
	})

	if err == nil {
		t.Fatal("expected missing location_id to be rejected")
	}
}

func TestItemUpdateCanChangeStatus(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书桌")

	item, err := svc.Create(ctx, ItemCreateInput{
		Name:       "备用读卡器",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	lost := model.StatusLost
	updated, err := svc.Update(ctx, item.ID, ItemUpdateInput{Status: &lost})
	if err != nil {
		t.Fatalf("update item status: %v", err)
	}
	if updated.Status != model.StatusLost {
		t.Fatalf("expected lost status, got %s", updated.Status)
	}

	items, err := svc.List(ctx, ItemListFilter{Status: string(model.StatusLost)})
	if err != nil {
		t.Fatalf("list lost items: %v", err)
	}
	if len(items) != 1 || items[0].ID != item.ID {
		t.Fatalf("expected updated item in lost list, got %#v", items)
	}
}

func TestItemUpdateRejectsInvalidStatus(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "玄关")

	item, err := svc.Create(ctx, ItemCreateInput{
		Name:       "备用网线",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	invalid := model.ItemStatus("vanished")
	_, err = svc.Update(ctx, item.ID, ItemUpdateInput{Status: &invalid})

	if err == nil {
		t.Fatal("expected invalid item status to be rejected")
	}
}

func TestConsumableBUseOneDecrementsStockAndCreatesLifeReminder(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "厨房")

	stock := 1
	threshold := 1
	lifespanDays := 180
	item, err := svc.Create(ctx, ItemCreateInput{
		Name:              "净水器滤芯",
		Type:              model.ItemTypeConsumableB,
		LocationID:        &locID,
		CurrentStock:      &stock,
		MinStockThreshold: &threshold,
		LifespanDays:      &lifespanDays,
	})
	if err != nil {
		t.Fatalf("create consumable b item: %v", err)
	}

	used, err := svc.UseOne(ctx, item.ID)
	if err != nil {
		t.Fatalf("use one: %v", err)
	}

	if used.CurrentStock == nil || *used.CurrentStock != 0 {
		t.Fatalf("expected stock to decrement to 0, got %#v", used.CurrentStock)
	}
	if !used.NeedsRestock {
		t.Fatal("expected item to need restock when stock is below threshold")
	}
	if used.InUseSince == nil || used.LifeExpiresAt == nil {
		t.Fatalf("expected life countdown fields, got in_use_since=%#v life_expires_at=%#v", used.InUseSince, used.LifeExpiresAt)
	}

	var reminderType string
	var triggerAt int64
	if err := database.QueryRowContext(ctx,
		`SELECT type, trigger_at FROM reminders WHERE item_id = ?`, item.ID,
	).Scan(&reminderType, &triggerAt); err != nil {
		t.Fatalf("find reminder: %v", err)
	}
	if reminderType != "filter_life" {
		t.Fatalf("expected filter_life reminder, got %q", reminderType)
	}
	if triggerAt != *used.LifeExpiresAt {
		t.Fatalf("expected reminder trigger %d, got %d", *used.LifeExpiresAt, triggerAt)
	}

	again, err := svc.UseOne(ctx, item.ID)
	if err != nil {
		t.Fatalf("use one at zero: %v", err)
	}
	if again.CurrentStock == nil || *again.CurrentStock != 0 {
		t.Fatalf("expected stock to stay at 0, got %#v", again.CurrentStock)
	}
}

func TestUseOneRejectsNonConsumableBItems(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	item, err := svc.Create(ctx, ItemCreateInput{
		Name:       "机械键盘",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	_, err = svc.UseOne(ctx, item.ID)
	if !errors.Is(err, ErrInvalidItemType) {
		t.Fatalf("expected invalid type error, got %v", err)
	}
}

func TestConsumableAPurchaseEventsAndCalibrationSignals(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "厨房")

	item, err := svc.Create(ctx, ItemCreateInput{
		Name:       "咖啡豆",
		Type:       model.ItemTypeConsumableA,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create consumable a item: %v", err)
	}

	price := 88.5
	currency := "CNY"
	firstAt := int64(1780000000)
	secondAt := firstAt + 14*24*60*60
	first, err := svc.CreatePurchaseEvent(ctx, item.ID, PurchaseEventInput{
		Quantity:    2,
		Price:       &price,
		Currency:    &currency,
		PurchasedAt: firstAt,
	})
	if err != nil {
		t.Fatalf("create first purchase event: %v", err)
	}
	if first.Quantity != 2 || first.Price == nil || *first.Price != price {
		t.Fatalf("unexpected first purchase event: %#v", first)
	}
	if _, err := svc.CreatePurchaseEvent(ctx, item.ID, PurchaseEventInput{
		Quantity:    1,
		PurchasedAt: secondAt,
	}); err != nil {
		t.Fatalf("create second purchase event: %v", err)
	}

	events, nextPurchaseAt, err := svc.ListPurchaseEvents(ctx, item.ID)
	if err != nil {
		t.Fatalf("list purchase events: %v", err)
	}
	if len(events) != 2 {
		t.Fatalf("expected two purchase events, got %d", len(events))
	}
	wantNext := secondAt + 14*24*60*60
	if nextPurchaseAt == nil || *nextPurchaseAt != wantNext {
		t.Fatalf("expected next purchase at %d, got %#v", wantNext, nextPurchaseAt)
	}

	calibration, err := svc.CreateCalibrationEvent(ctx, item.ID, "almost_empty")
	if err != nil {
		t.Fatalf("create calibration event: %v", err)
	}
	if calibration.Signal != "almost_empty" {
		t.Fatalf("expected almost_empty signal, got %q", calibration.Signal)
	}
	if _, err := svc.CreateCalibrationEvent(ctx, item.ID, "guess"); err == nil {
		t.Fatal("expected invalid calibration signal to be rejected")
	}
}

func TestEDCStatusCanSwitchToDynamicNodeAndReturnHome(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	homeID := createTestLocation(t, ctx, database, "玄关")
	awayID := createTestLocation(t, ctx, database, "@随身")

	item, err := svc.Create(ctx, ItemCreateInput{
		Name:               "钥匙",
		Type:               model.ItemTypeEDC,
		LocationID:         &homeID,
		HomeBaseLocationID: &homeID,
	})
	if err != nil {
		t.Fatalf("create edc item: %v", err)
	}
	if item.HomeBaseLocationID == nil || *item.HomeBaseLocationID != homeID {
		t.Fatalf("expected home base %s, got %#v", homeID, item.HomeBaseLocationID)
	}

	withStatus, err := svc.SetEDCStatus(ctx, item.ID, EDCStatusInput{
		CurrentStatusTag: "@随身",
		LocationID:       &awayID,
	})
	if err != nil {
		t.Fatalf("set edc status: %v", err)
	}
	if withStatus.CurrentStatusTag == nil || *withStatus.CurrentStatusTag != "@随身" {
		t.Fatalf("expected @随身 status, got %#v", withStatus.CurrentStatusTag)
	}
	if withStatus.LocationID == nil || *withStatus.LocationID != awayID {
		t.Fatalf("expected current location %s, got %#v", awayID, withStatus.LocationID)
	}

	returned, err := svc.ReturnEDCHome(ctx, item.ID)
	if err != nil {
		t.Fatalf("return edc home: %v", err)
	}
	if returned.CurrentStatusTag != nil {
		t.Fatalf("expected current status cleared, got %#v", returned.CurrentStatusTag)
	}
	if returned.LocationID == nil || *returned.LocationID != homeID {
		t.Fatalf("expected returned location %s, got %#v", homeID, returned.LocationID)
	}
}

func TestWarrantyItemsCreateReminderScheduleAndAggregateView(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	expiresAt := time.Now().Add(20 * 24 * time.Hour).Unix()
	contact := "400-123-456"
	item, err := svc.Create(ctx, ItemCreateInput{
		Name:              "显示器",
		Type:              model.ItemTypeDurable,
		LocationID:        &locID,
		WarrantyExpiresAt: &expiresAt,
		WarrantyContact:   &contact,
	})
	if err != nil {
		t.Fatalf("create warranty item: %v", err)
	}
	if item.WarrantyContact == nil || *item.WarrantyContact != contact {
		t.Fatalf("expected warranty contact, got %#v", item.WarrantyContact)
	}

	rows, err := database.QueryContext(ctx,
		`SELECT type, trigger_at FROM reminders WHERE item_id = ? ORDER BY type`, item.ID)
	if err != nil {
		t.Fatalf("query reminders: %v", err)
	}
	defer rows.Close()

	reminders := map[string]int64{}
	for rows.Next() {
		var reminderType string
		var triggerAt int64
		if err := rows.Scan(&reminderType, &triggerAt); err != nil {
			t.Fatalf("scan reminder: %v", err)
		}
		reminders[reminderType] = triggerAt
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("read reminders: %v", err)
	}
	if reminders["warranty_30d"] != expiresAt-30*24*60*60 {
		t.Fatalf("expected warranty_30d reminder, got %#v", reminders)
	}
	if reminders["warranty_7d"] != expiresAt-7*24*60*60 {
		t.Fatalf("expected warranty_7d reminder, got %#v", reminders)
	}

	warrantyItems, err := svc.WarrantyItems(ctx, WarrantyListFilter{ExpiringDays: 30})
	if err != nil {
		t.Fatalf("list warranty items: %v", err)
	}
	if len(warrantyItems) != 1 || warrantyItems[0].ID != item.ID {
		t.Fatalf("expected warranty item in aggregate view, got %#v", warrantyItems)
	}
}

func TestItemExitMovesItemToGraveyardWithLedgerFields(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	item, err := svc.Create(ctx, ItemCreateInput{
		Name:       "旧显示器",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	price := 500.0
	currency := "CNY"
	notes := "闲鱼售出"
	exitDate := int64(1780000000)
	exited, err := svc.Exit(ctx, item.ID, ItemExitInput{
		ExitType:     "sold",
		ExitDate:     exitDate,
		ExitPrice:    &price,
		ExitCurrency: &currency,
		ExitNotes:    &notes,
	})
	if err != nil {
		t.Fatalf("exit item: %v", err)
	}
	if exited.Status != model.StatusSold {
		t.Fatalf("expected sold status, got %s", exited.Status)
	}
	if exited.ExitType == nil || *exited.ExitType != "sold" ||
		exited.ExitPrice == nil || *exited.ExitPrice != price ||
		exited.ExitNotes == nil || *exited.ExitNotes != notes {
		t.Fatalf("expected exit ledger fields, got %#v", exited)
	}

	items, err := svc.List(ctx, ItemListFilter{})
	if err != nil {
		t.Fatalf("list items: %v", err)
	}
	if len(items) != 0 {
		t.Fatalf("expected exited item hidden from default list, got %#v", items)
	}

	graveyard, err := svc.Graveyard(ctx)
	if err != nil {
		t.Fatalf("load graveyard: %v", err)
	}
	if len(graveyard) != 1 || graveyard[0].ID != item.ID {
		t.Fatalf("expected exited item in graveyard, got %#v", graveyard)
	}
}

func TestLossRecordsListsAbnormalLossesWithinRange(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	price := 3999.0
	currency := "CNY"
	lost, err := svc.Create(ctx, ItemCreateInput{
		Name:             "丢失相机",
		Type:             model.ItemTypeDurable,
		LocationID:       &locID,
		PurchasePrice:    &price,
		PurchaseCurrency: &currency,
	})
	if err != nil {
		t.Fatalf("create lost item: %v", err)
	}
	notes := "旅行途中遗失"
	if _, err := svc.Exit(ctx, lost.ID, ItemExitInput{
		ExitType:  "lost",
		ExitDate:  200,
		ExitNotes: &notes,
	}); err != nil {
		t.Fatalf("exit lost item: %v", err)
	}

	sold, err := svc.Create(ctx, ItemCreateInput{
		Name:       "已售镜头",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create sold item: %v", err)
	}
	if _, err := svc.Exit(ctx, sold.ID, ItemExitInput{ExitType: "sold", ExitDate: 220}); err != nil {
		t.Fatalf("exit sold item: %v", err)
	}

	from := int64(100)
	to := int64(250)
	records, err := svc.LossRecords(ctx, LossRecordFilter{From: &from, To: &to})
	if err != nil {
		t.Fatalf("list loss records: %v", err)
	}
	if len(records) != 1 {
		t.Fatalf("expected one loss record, got %#v", records)
	}
	if records[0].ItemID != lost.ID || records[0].Status != model.StatusLost {
		t.Fatalf("expected lost item record, got %#v", records[0])
	}
	if records[0].LossDate != 200 ||
		records[0].PurchasePrice == nil || *records[0].PurchasePrice != price ||
		records[0].PurchaseCurrency == nil || *records[0].PurchaseCurrency != currency ||
		records[0].ExitNotes == nil || *records[0].ExitNotes != notes {
		t.Fatalf("expected loss ledger fields, got %#v", records[0])
	}

	afterLoss := int64(201)
	records, err = svc.LossRecords(ctx, LossRecordFilter{From: &afterLoss})
	if err != nil {
		t.Fatalf("list loss records after loss: %v", err)
	}
	if len(records) != 0 {
		t.Fatalf("expected range to exclude loss, got %#v", records)
	}
}
