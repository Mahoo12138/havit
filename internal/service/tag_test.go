package service

import (
	"context"
	"errors"
	"testing"

	apperr "github.com/mahoo12138/havit/internal/errors"
	"github.com/mahoo12138/havit/internal/model"
)

func TestTagCreateTrimsNameAndReusesExistingTag(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewTagService(database)

	first, err := svc.Create(ctx, TagCreateInput{Name: " 摄影 ", Color: "#4a90d9"})
	if err != nil {
		t.Fatalf("create tag: %v", err)
	}
	second, err := svc.Create(ctx, TagCreateInput{Name: "摄影", Color: "#111111"})
	if err != nil {
		t.Fatalf("reuse tag: %v", err)
	}

	if first.ID != second.ID {
		t.Fatalf("expected duplicate name to reuse tag id %s, got %s", first.ID, second.ID)
	}
	if first.Name != "摄影" {
		t.Fatalf("expected trimmed tag name, got %q", first.Name)
	}
	if second.Color == nil || *second.Color != "#4a90d9" {
		t.Fatalf("expected duplicate create to keep existing color, got %#v", second.Color)
	}
}

func TestItemTagsCanBeReplacedAndReturnedWithItem(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	tagSvc := NewTagService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "Sony A7M4",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	photo, err := tagSvc.Create(ctx, TagCreateInput{Name: "摄影"})
	if err != nil {
		t.Fatalf("create photo tag: %v", err)
	}
	digital, err := tagSvc.Create(ctx, TagCreateInput{Name: "数码"})
	if err != nil {
		t.Fatalf("create digital tag: %v", err)
	}

	updated, err := itemSvc.ReplaceTags(ctx, item.ID, []string{digital.ID, photo.ID})
	if err != nil {
		t.Fatalf("replace item tags: %v", err)
	}

	if len(updated.Tags) != 2 {
		t.Fatalf("expected two tags, got %#v", updated.Tags)
	}
	if updated.Tags[0].Name != "摄影" || updated.Tags[1].Name != "数码" {
		t.Fatalf("expected tags sorted by name, got %#v", updated.Tags)
	}

	next, err := itemSvc.ReplaceTags(ctx, item.ID, []string{digital.ID})
	if err != nil {
		t.Fatalf("replace item tags again: %v", err)
	}
	if len(next.Tags) != 1 || next.Tags[0].ID != digital.ID {
		t.Fatalf("expected only digital tag after replacement, got %#v", next.Tags)
	}

	fetched, err := itemSvc.Get(ctx, item.ID)
	if err != nil {
		t.Fatalf("get tagged item: %v", err)
	}
	if len(fetched.Tags) != 1 || fetched.Tags[0].Name != "数码" {
		t.Fatalf("expected fetched item to include tags, got %#v", fetched.Tags)
	}
}

func TestItemListCanFilterByTag(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	tagSvc := NewTagService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	camera, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "相机",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create camera: %v", err)
	}
	cable, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "HDMI 线",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create cable: %v", err)
	}
	tag, err := tagSvc.Create(ctx, TagCreateInput{Name: "摄影"})
	if err != nil {
		t.Fatalf("create tag: %v", err)
	}
	if _, err := itemSvc.ReplaceTags(ctx, camera.ID, []string{tag.ID}); err != nil {
		t.Fatalf("tag camera: %v", err)
	}

	items, err := itemSvc.List(ctx, ItemListFilter{Tag: tag.ID})
	if err != nil {
		t.Fatalf("list by tag: %v", err)
	}

	if len(items) != 1 {
		t.Fatalf("expected one tagged item, got %d", len(items))
	}
	if items[0].ID != camera.ID {
		t.Fatalf("expected camera %s, got %s", camera.ID, items[0].ID)
	}
	if items[0].ID == cable.ID {
		t.Fatal("expected untagged cable to be excluded")
	}
}

func TestTagListReportsUsageCountAndCreatedAt(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	tagSvc := NewTagService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	used, err := tagSvc.Create(ctx, TagCreateInput{Name: "摄影"})
	if err != nil {
		t.Fatalf("create used tag: %v", err)
	}
	if _, err := tagSvc.Create(ctx, TagCreateInput{Name: "闲置"}); err != nil {
		t.Fatalf("create unused tag: %v", err)
	}

	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "Sony A7M4",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	if _, err := itemSvc.ReplaceTags(ctx, item.ID, []string{used.ID}); err != nil {
		t.Fatalf("tag item: %v", err)
	}

	list, err := tagSvc.List(ctx)
	if err != nil {
		t.Fatalf("list tags: %v", err)
	}
	if len(list) != 2 {
		t.Fatalf("expected 2 tags, got %d", len(list))
	}
	byName := map[string]*model.Tag{}
	for _, tg := range list {
		byName[tg.Name] = tg
		if tg.CreatedAt <= 0 {
			t.Fatalf("expected tag %s created_at populated, got %d", tg.Name, tg.CreatedAt)
		}
	}
	if byName["摄影"].UsageCount != 1 {
		t.Fatalf("expected 摄影 usage 1, got %d", byName["摄影"].UsageCount)
	}
	if byName["闲置"].UsageCount != 0 {
		t.Fatalf("expected 闲置 usage 0, got %d", byName["闲置"].UsageCount)
	}
}

func TestTagUpdateRenamesAndRecolors(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewTagService(database)

	tag, err := svc.Create(ctx, TagCreateInput{Name: "摄影", Color: "#4a90d9"})
	if err != nil {
		t.Fatalf("create tag: %v", err)
	}
	updated, err := svc.Update(ctx, tag.ID, TagUpdateInput{Name: " 摄影器材 ", Color: "#ff8800"})
	if err != nil {
		t.Fatalf("update tag: %v", err)
	}
	if updated.Name != "摄影器材" {
		t.Fatalf("expected trimmed renamed tag, got %q", updated.Name)
	}
	if updated.Color == nil || *updated.Color != "#ff8800" {
		t.Fatalf("expected updated color, got %#v", updated.Color)
	}

	cleared, err := svc.Update(ctx, tag.ID, TagUpdateInput{Name: "摄影器材", Color: ""})
	if err != nil {
		t.Fatalf("clear color: %v", err)
	}
	if cleared.Color != nil {
		t.Fatalf("expected color cleared, got %#v", cleared.Color)
	}
}

func TestTagUpdateRejectsNameConflict(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewTagService(database)

	a, err := svc.Create(ctx, TagCreateInput{Name: "摄影"})
	if err != nil {
		t.Fatalf("create a: %v", err)
	}
	if _, err := svc.Create(ctx, TagCreateInput{Name: "数码"}); err != nil {
		t.Fatalf("create b: %v", err)
	}

	_, err = svc.Update(ctx, a.ID, TagUpdateInput{Name: "数码"})
	if err == nil {
		t.Fatal("expected conflict error renaming to existing name")
	}
	var ae *apperr.AppError
	if !errors.As(err, &ae) || ae.Code != apperr.CodeTagNameConflict {
		t.Fatalf("expected CodeTagNameConflict, got %v", err)
	}
}

func TestTagDeleteRefusesWhenInUseAndAllowsWhenUnused(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	tagSvc := NewTagService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	tag, err := tagSvc.Create(ctx, TagCreateInput{Name: "摄影"})
	if err != nil {
		t.Fatalf("create tag: %v", err)
	}

	if err := tagSvc.Delete(ctx, tag.ID); err != nil {
		t.Fatalf("expected to delete unused tag, got %v", err)
	}
	if _, err := tagSvc.Get(ctx, tag.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected ErrNotFound after delete, got %v", err)
	}

	tag2, err := tagSvc.Create(ctx, TagCreateInput{Name: "数码"})
	if err != nil {
		t.Fatalf("recreate tag: %v", err)
	}
	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "相机",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	if _, err := itemSvc.ReplaceTags(ctx, item.ID, []string{tag2.ID}); err != nil {
		t.Fatalf("attach tag: %v", err)
	}

	err = tagSvc.Delete(ctx, tag2.ID)
	if err == nil {
		t.Fatal("expected refusal deleting in-use tag")
	}
	var ae *apperr.AppError
	if !errors.As(err, &ae) || ae.Code != apperr.CodeTagInUse {
		t.Fatalf("expected CodeTagInUse, got %v", err)
	}
}
