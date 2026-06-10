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

	root, err := svc.Create(ctx, LocationCreateInput{Name: "书房", Type: "room"})
	if err != nil {
		t.Fatalf("create root location: %v", err)
	}
	child, err := svc.Create(ctx, LocationCreateInput{Name: "书桌", Type: "furniture", ParentID: &root.ID})
	if err != nil {
		t.Fatalf("create child location: %v", err)
	}
	_, err = svc.Create(ctx, LocationCreateInput{Name: "抽屉", Type: "container", ParentID: &child.ID})
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

func TestLocationQRCodeCanBeGeneratedAndScannedForContainedItems(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	locations := NewLocationService(database)
	items := NewItemService(database)

	root, err := locations.Create(ctx, LocationCreateInput{Name: "储藏室", Type: "room"})
	if err != nil {
		t.Fatalf("create root location: %v", err)
	}
	box, err := locations.Create(ctx, LocationCreateInput{Name: "收纳盒 3", Type: "container", ParentID: &root.ID})
	if err != nil {
		t.Fatalf("create child location: %v", err)
	}
	if _, err := items.Create(ctx, ItemCreateInput{
		Name:       "备用 HDMI 线",
		Type:       model.ItemTypeDurable,
		LocationID: &box.ID,
	}); err != nil {
		t.Fatalf("create contained item: %v", err)
	}

	withCode, err := locations.GenerateQRCode(ctx, root.ID)
	if err != nil {
		t.Fatalf("generate qr code: %v", err)
	}
	if withCode.QRCode == nil || *withCode.QRCode == "" {
		t.Fatalf("expected qr code on location, got %#v", withCode.QRCode)
	}

	again, err := locations.GenerateQRCode(ctx, root.ID)
	if err != nil {
		t.Fatalf("generate qr code again: %v", err)
	}
	if again.QRCode == nil || *again.QRCode != *withCode.QRCode {
		t.Fatalf("expected qr code generation to be idempotent, got %#v then %#v", withCode.QRCode, again.QRCode)
	}

	scanned, err := locations.ScanQRCode(ctx, *withCode.QRCode)
	if err != nil {
		t.Fatalf("scan qr code: %v", err)
	}
	if scanned.Location.ID != root.ID {
		t.Fatalf("expected scanned root location %s, got %s", root.ID, scanned.Location.ID)
	}
	if len(scanned.Items) != 1 || scanned.Items[0].Name != "备用 HDMI 线" {
		t.Fatalf("expected contained item in scan result, got %#v", scanned.Items)
	}
}
