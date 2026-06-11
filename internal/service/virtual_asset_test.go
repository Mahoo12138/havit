package service

import (
	"context"
	"testing"

	"github.com/mahoo12138/havit/internal/model"

	havitcrypto "github.com/mahoo12138/havit/internal/crypto"
)

func newTestVirtualAssetService(t *testing.T) (*VirtualAssetService, *ItemService, string) {
	t.Helper()

	db := newTestDB(t)
	crypto, err := havitcrypto.New("test-secret")
	if err != nil {
		t.Fatalf("new crypto: %v", err)
	}

	itemSvc := NewItemService(db)
	vaSvc := NewVirtualAssetService(db, crypto)

	locID := createTestLocation(t, context.Background(), db, "云端")
	item, err := itemSvc.Create(context.Background(), ItemCreateInput{
		Name:       "Software License",
		Type:       model.ItemTypeVirtual,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create virtual item: %v", err)
	}

	return vaSvc, itemSvc, item.ID
}

func TestVirtualAssetCreateCredential(t *testing.T) {
	ctx := context.Background()
	svc, _, itemID := newTestVirtualAssetService(t)

	platform := "Adobe"
	account := "user@example.com"
	licenseKey := "ABC-123-DEF-456"
	cred, err := svc.CreateCredential(ctx, itemID, VirtualCredentialInput{
		Platform:   platform,
		Account:    &account,
		LicenseKey: &licenseKey,
	})
	if err != nil {
		t.Fatalf("CreateCredential: %v", err)
	}
	if cred.Platform != platform {
		t.Fatalf("expected platform %s, got %s", platform, cred.Platform)
	}
	if cred.Account == nil || *cred.Account != account {
		t.Fatalf("expected account %s, got %v", account, cred.Account)
	}
	if cred.LicenseKey == nil || *cred.LicenseKey != licenseKey {
		t.Fatalf("expected license_key %s, got %v", licenseKey, cred.LicenseKey)
	}
	if cred.ItemID != itemID {
		t.Fatalf("expected item_id %s, got %s", itemID, cred.ItemID)
	}
}

func TestVirtualAssetCreateCredentialMissingPlatform(t *testing.T) {
	ctx := context.Background()
	svc, _, itemID := newTestVirtualAssetService(t)

	_, err := svc.CreateCredential(ctx, itemID, VirtualCredentialInput{
		Platform: "",
	})
	if err == nil {
		t.Fatal("expected error for empty platform")
	}
}

func TestVirtualAssetListCredentials(t *testing.T) {
	ctx := context.Background()
	svc, _, itemID := newTestVirtualAssetService(t)

	platform := "JetBrains"
	account := "dev@example.com"
	svc.CreateCredential(ctx, itemID, VirtualCredentialInput{
		Platform: platform,
		Account:  &account,
	})

	list, err := svc.ListCredentials(ctx, itemID)
	if err != nil {
		t.Fatalf("ListCredentials: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 credential, got %d", len(list))
	}
	if list[0].Platform != platform {
		t.Fatalf("expected platform %s, got %s", platform, list[0].Platform)
	}

	emptyList, err := svc.ListCredentials(ctx, "nonexistent-item")
	if err == nil {
		t.Fatal("expected error for nonexistent item")
	}
	_ = emptyList
}

func TestVirtualAssetCreateAddon(t *testing.T) {
	ctx := context.Background()
	svc, _, itemID := newTestVirtualAssetService(t)

	price := 29.99
	addon, err := svc.CreateAddon(ctx, itemID, VirtualAddonInput{
		Name:  "Extra Storage",
		Price: &price,
	})
	if err != nil {
		t.Fatalf("CreateAddon: %v", err)
	}
	if addon.Name != "Extra Storage" {
		t.Fatalf("expected name 'Extra Storage', got %s", addon.Name)
	}
	if addon.Price == nil || *addon.Price != price {
		t.Fatalf("expected price %g, got %v", price, addon.Price)
	}
	if addon.ItemID != itemID {
		t.Fatalf("expected item_id %s, got %s", itemID, addon.ItemID)
	}
}

func TestVirtualAssetCreateAddonMissingName(t *testing.T) {
	ctx := context.Background()
	svc, _, itemID := newTestVirtualAssetService(t)

	_, err := svc.CreateAddon(ctx, itemID, VirtualAddonInput{
		Name: "",
	})
	if err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestVirtualAssetListAddons(t *testing.T) {
	ctx := context.Background()
	svc, _, itemID := newTestVirtualAssetService(t)

	svc.CreateAddon(ctx, itemID, VirtualAddonInput{Name: "DLC Pack 1"})
	svc.CreateAddon(ctx, itemID, VirtualAddonInput{Name: "DLC Pack 2"})

	list, err := svc.ListAddons(ctx, itemID)
	if err != nil {
		t.Fatalf("ListAddons: %v", err)
	}
	if len(list) != 2 {
		t.Fatalf("expected 2 addons, got %d", len(list))
	}
}

func TestVirtualAssetRejectsNonVirtualItem(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	crypto, err := havitcrypto.New("test-secret")
	if err != nil {
		t.Fatalf("new crypto: %v", err)
	}

	itemSvc := NewItemService(db)
	vaSvc := NewVirtualAssetService(db, crypto)

	locID := createTestLocation(t, ctx, db, "机房")
	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "Physical Server",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create durable item: %v", err)
	}

	_, err = vaSvc.CreateCredential(ctx, item.ID, VirtualCredentialInput{
		Platform: "Test",
	})
	if err == nil {
		t.Fatal("expected error for non-virtual item")
	}
}
