package service

import (
	"context"
	"errors"
	"testing"

	"github.com/mahoo12138/havit/internal/model"
)

func TestLocationTreeBuildsNestedLocations(t *testing.T) {
	ctx := context.Background()
	svc := NewLocationService(newTestDB(t))

	root, err := svc.Create(ctx, LocationCreateInput{Name: "书房"})
	if err != nil {
		t.Fatalf("create root location: %v", err)
	}
	child, err := svc.Create(ctx, LocationCreateInput{Name: "书桌", ParentID: &root.ID})
	if err != nil {
		t.Fatalf("create child location: %v", err)
	}
	_, err = svc.Create(ctx, LocationCreateInput{Name: "抽屉", ParentID: &child.ID})
	if err != nil {
		t.Fatalf("create grandchild location: %v", err)
	}

	tree, err := svc.Tree(ctx)
	if err != nil {
		t.Fatalf("load location tree: %v", err)
	}

	if len(tree) != 1 {
		t.Fatalf("expected one root location, got %d", len(tree))
	}
	if tree[0].ID != root.ID {
		t.Fatalf("expected root %s, got %s", root.ID, tree[0].ID)
	}
	if len(tree[0].Children) != 1 {
		t.Fatalf("expected one child location, got %d", len(tree[0].Children))
	}
	if tree[0].Children[0].ID != child.ID {
		t.Fatalf("expected child %s, got %s", child.ID, tree[0].Children[0].ID)
	}
	if len(tree[0].Children[0].Children) != 1 {
		t.Fatalf("expected one grandchild location, got %d", len(tree[0].Children[0].Children))
	}
}

func TestLocationDeleteRejectsNonEmptyLocation(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	locations := NewLocationService(database)
	items := NewItemService(database)

	loc, err := locations.Create(ctx, LocationCreateInput{Name: "客厅"})
	if err != nil {
		t.Fatalf("create location: %v", err)
	}
	if _, err := items.Create(ctx, ItemCreateInput{
		Name:       "投影仪",
		Type:       model.ItemTypeDurable,
		LocationID: &loc.ID,
	}); err != nil {
		t.Fatalf("create item in location: %v", err)
	}

	err = locations.Delete(ctx, loc.ID)
	if err == nil {
		t.Fatal("expected non-empty location delete to fail")
	}
	if errors.Is(err, ErrNotFound) {
		t.Fatalf("expected location not empty error, got %v", err)
	}
}

func TestLocationDeleteRemovesEmptyLocation(t *testing.T) {
	ctx := context.Background()
	svc := NewLocationService(newTestDB(t))

	loc, err := svc.Create(ctx, LocationCreateInput{Name: "临时箱"})
	if err != nil {
		t.Fatalf("create location: %v", err)
	}

	if err := svc.Delete(ctx, loc.ID); err != nil {
		t.Fatalf("delete empty location: %v", err)
	}

	if _, err := svc.Get(ctx, loc.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected deleted location to be missing, got %v", err)
	}
}
