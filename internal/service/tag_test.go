package service

import (
	"context"
	"testing"

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
