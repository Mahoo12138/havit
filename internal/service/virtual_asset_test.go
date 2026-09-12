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

func TestVirtualAssetUpdateCredential(t *testing.T) {
	ctx := context.Background()
	svc, itemSvc, itemID := newTestVirtualAssetService(t)

	licenseKey := "KEY-0001"
	cred, err := svc.CreateCredential(ctx, itemID, VirtualCredentialInput{
		Platform:   "Adobe",
		LicenseKey: &licenseKey,
	})
	if err != nil {
		t.Fatalf("CreateCredential: %v", err)
	}

	newAccount := "new@example.com"
	updated, err := svc.UpdateCredential(ctx, cred.ID, VirtualCredentialInput{
		Platform:   "Adobe CC",
		Account:    &newAccount,
		LicenseKey: &licenseKey, // same value echoed back: must be re-encrypted, not cleared
	})
	if err != nil {
		t.Fatalf("UpdateCredential: %v", err)
	}
	if updated.Platform != "Adobe CC" {
		t.Fatalf("expected platform 'Adobe CC', got %s", updated.Platform)
	}
	if updated.Account == nil || *updated.Account != newAccount {
		t.Fatalf("expected account %s, got %v", newAccount, updated.Account)
	}
	if updated.LicenseKey == nil || *updated.LicenseKey != licenseKey {
		t.Fatalf("expected license_key preserved, got %v", updated.LicenseKey)
	}

	// A nil license key must leave the stored secret untouched.
	updated, err = svc.UpdateCredential(ctx, cred.ID, VirtualCredentialInput{Platform: "Adobe CC"})
	if err != nil {
		t.Fatalf("UpdateCredential without license key: %v", err)
	}
	if updated.LicenseKey == nil || *updated.LicenseKey != licenseKey {
		t.Fatalf("expected license_key untouched on nil input, got %v", updated.LicenseKey)
	}

	// An empty string must clear the stored secret.
	empty := ""
	updated, err = svc.UpdateCredential(ctx, cred.ID, VirtualCredentialInput{
		Platform:   "Adobe CC",
		LicenseKey: &empty,
	})
	if err != nil {
		t.Fatalf("UpdateCredential clearing license key: %v", err)
	}
	if updated.LicenseKey != nil {
		t.Fatalf("expected license_key cleared, got %v", *updated.LicenseKey)
	}

	// Round-trip persistence: the license key must be encrypted at rest.
	var storedKey *string
	if err := svc.db.QueryRowContext(ctx,
		`SELECT license_key FROM virtual_credentials WHERE id = ?`, cred.ID).Scan(&storedKey); err != nil {
		t.Fatalf("query stored credential: %v", err)
	}
	if storedKey != nil && *storedKey == licenseKey {
		t.Fatal("expected license_key encrypted at rest")
	}

	if _, err := svc.UpdateCredential(ctx, cred.ID, VirtualCredentialInput{Platform: ""}); err == nil {
		t.Fatal("expected error for empty platform")
	}
	if _, err := svc.UpdateCredential(ctx, "missing-cred", VirtualCredentialInput{Platform: "X"}); err == nil {
		t.Fatal("expected error for missing credential")
	}

	// The owning item's updated_at must be touched so detail views refresh.
	item, err := itemSvc.Get(ctx, itemID)
	if err != nil {
		t.Fatalf("get item: %v", err)
	}
	if item.UpdatedAt < item.CreatedAt {
		t.Fatalf("expected updated_at >= created_at, got %d < %d", item.UpdatedAt, item.CreatedAt)
	}
}

func TestVirtualAssetDeleteCredential(t *testing.T) {
	ctx := context.Background()
	svc, _, itemID := newTestVirtualAssetService(t)

	cred, err := svc.CreateCredential(ctx, itemID, VirtualCredentialInput{Platform: "Adobe"})
	if err != nil {
		t.Fatalf("CreateCredential: %v", err)
	}
	if err := svc.DeleteCredential(ctx, cred.ID); err != nil {
		t.Fatalf("DeleteCredential: %v", err)
	}
	if _, err := svc.credentialByID(ctx, cred.ID); err == nil {
		t.Fatal("expected credential gone after delete")
	}
	if err := svc.DeleteCredential(ctx, "missing-cred"); err == nil {
		t.Fatal("expected error for missing credential")
	}
}

func TestVirtualAssetListAllCredentialsJoinsItem(t *testing.T) {
	ctx := context.Background()
	svc, itemSvc, itemID := newTestVirtualAssetService(t)

	purchased := int64(1700000000)
	licenseKey := "KEY-LIST-0001"
	if _, err := svc.CreateCredential(ctx, itemID, VirtualCredentialInput{
		Platform:    "Adobe",
		PurchasedAt: &purchased,
		LicenseKey:  &licenseKey,
	}); err != nil {
		t.Fatalf("CreateCredential: %v", err)
	}

	item, err := itemSvc.Get(ctx, itemID)
	if err != nil {
		t.Fatalf("get item: %v", err)
	}
	list, err := svc.ListAllCredentials(ctx)
	if err != nil {
		t.Fatalf("ListAllCredentials: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 credential, got %d", len(list))
	}
	if list[0].ItemID != itemID || list[0].ItemName != item.Name {
		t.Fatalf("expected joined item %s/%s, got %s/%s", itemID, item.Name, list[0].ItemID, list[0].ItemName)
	}
	if list[0].LicenseKey == nil {
		t.Fatal("expected decrypted license key in aggregate list")
	}
}

func TestVirtualAssetCredentialsRespectPrivacy(t *testing.T) {
	db := newTestDB(t)
	crypto, err := havitcrypto.New("test-secret")
	if err != nil {
		t.Fatalf("new crypto: %v", err)
	}
	itemSvc := NewItemService(db)
	vaSvc := NewVirtualAssetService(db, crypto)

	seedUser(t, db, "user-a", "member")
	seedUser(t, db, "user-b", "member")
	ownerA := ctxAs("user-a")
	ownerB := ctxAs("user-b")

	locID := createTestLocation(t, context.Background(), db, "云端")
	ownerBID := "user-b"
	private, err := itemSvc.Create(ownerB, ItemCreateInput{
		Name:       "Private License",
		Type:       model.ItemTypeVirtual,
		LocationID: &locID,
		IsPrivate:  true,
		OwnerID:    &ownerBID,
	})
	if err != nil {
		t.Fatalf("create private item: %v", err)
	}

	if _, err := vaSvc.CreateCredential(ownerB, private.ID, VirtualCredentialInput{Platform: "Secret"}); err != nil {
		t.Fatalf("owner create credential: %v", err)
	}

	// A stranger must not read, create, update or delete credentials on a
	// private item, and the aggregate list must not leak them.
	if _, err := vaSvc.ListCredentials(ownerA, private.ID); err == nil {
		t.Fatal("expected list credentials on private item to fail for stranger")
	}
	if _, err := vaSvc.CreateCredential(ownerA, private.ID, VirtualCredentialInput{Platform: "Injected"}); err == nil {
		t.Fatal("expected create credential on private item to fail for stranger")
	}
	cred, err := vaSvc.credentialByID(context.Background(), func() string {
		list, _ := vaSvc.ListCredentials(ownerB, private.ID)
		if len(list) != 1 {
			t.Fatalf("owner should see 1 credential, got %d", len(list))
		}
		return list[0].ID
	}())
	if err != nil {
		t.Fatalf("credentialByID: %v", err)
	}
	if _, err := vaSvc.UpdateCredential(ownerA, cred.ID, VirtualCredentialInput{Platform: "Hijacked"}); err == nil {
		t.Fatal("expected update on private credential to fail for stranger")
	}
	if err := vaSvc.DeleteCredential(ownerA, cred.ID); err == nil {
		t.Fatal("expected delete on private credential to fail for stranger")
	}

	all, err := vaSvc.ListAllCredentials(ownerA)
	if err != nil {
		t.Fatalf("ListAllCredentials: %v", err)
	}
	if len(all) != 0 {
		t.Fatalf("expected stranger's aggregate list to be empty, got %d", len(all))
	}
	ownerList, err := vaSvc.ListAllCredentials(ownerB)
	if err != nil {
		t.Fatalf("ListAllCredentials for owner: %v", err)
	}
	if len(ownerList) != 1 {
		t.Fatalf("expected owner to see 1 credential, got %d", len(ownerList))
	}
}
