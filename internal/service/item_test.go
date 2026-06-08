package service

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

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
		 VALUES (?, ?, 'physical', 0, 0, 1, 1)`,
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
