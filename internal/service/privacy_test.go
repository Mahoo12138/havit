package service

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	havitcrypto "github.com/mahoo12138/havit/internal/crypto"
	"github.com/mahoo12138/havit/internal/model"
)

func ctxAs(userID string) context.Context {
	return WithCaller(context.Background(), &Caller{UserID: userID, Role: "member"})
}

func ownerRoleCtx(userID string) context.Context {
	return WithCaller(context.Background(), &Caller{UserID: userID, Role: "owner"})
}

// seedUser creates a users row so items/locations referencing it as owner_id
// satisfy the foreign key.
func seedUser(t *testing.T, db *sql.DB, id, role string) {
	t.Helper()
	if _, err := db.ExecContext(context.Background(),
		`INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, 'x', ?, 1)`,
		id, id, role); err != nil {
		t.Fatalf("seed user %s: %v", id, err)
	}
}

// privacyFixture builds a two-user world:
//   - sharedLoc: public location
//   - aliceLoc (private, alice) with public child aliceChildLoc — inheritance case
//   - aliceShared: public item by alice at sharedLoc
//   - alicePrivate: private item by alice at sharedLoc
//   - childItem: public item by alice inside aliceLoc (hidden via inheritance)
func privacyFixture(t *testing.T) (*ItemService, *LocationService, *SearchService, map[string]string) {
	t.Helper()
	db := newTestDB(t)
	seedUser(t, db, "user-alice", "member")
	itemSvc := NewItemService(db)
	locSvc := NewLocationService(db)
	searchSvc := NewSearchService(db)
	alice := "user-alice"

	loc, err := locSvc.Create(ctxAs(alice), LocationCreateInput{Name: "公共柜", Type: "furniture"})
	if err != nil {
		t.Fatalf("create shared location: %v", err)
	}
	sharedLoc := loc.ID

	aliceLoc, err := locSvc.Create(ctxAs(alice), LocationCreateInput{
		Name: "Alice 私人房间", Type: "room", IsPrivate: true, OwnerID: &alice,
	})
	if err != nil {
		t.Fatalf("create private location: %v", err)
	}
	aliceChild, err := locSvc.Create(ctxAs(alice), LocationCreateInput{
		Name: "抽屉", Type: "furniture", ParentID: &aliceLoc.ID,
	})
	if err != nil {
		t.Fatalf("create child location: %v", err)
	}

	mkItem := func(name string, locID string, private bool) string {
		t.Helper()
		item, err := itemSvc.Create(ctxAs(alice), ItemCreateInput{
			Name: name, Type: model.ItemTypeDurable, LocationID: &locID,
			IsPrivate: private, OwnerID: &alice,
		})
		if err != nil {
			t.Fatalf("create item %s: %v", name, err)
		}
		return item.ID
	}

	return itemSvc, locSvc, searchSvc, map[string]string{
		"sharedLoc":    sharedLoc,
		"aliceLoc":     aliceLoc.ID,
		"aliceChild":   aliceChild.ID,
		"aliceShared":  mkItem("Alice 共享相机", sharedLoc, false),
		"alicePrivate": mkItem("Alice 私密日记", sharedLoc, true),
		"childItem":    mkItem("Alice 柜中物品", aliceLoc.ID, false),
	}
}

func hasItem(items []*model.Item, id string) bool {
	for _, it := range items {
		if it.ID == id {
			return true
		}
	}
	return false
}

func TestPrivacyItemListAndGet(t *testing.T) {
	itemSvc, _, _, ids := privacyFixture(t)

	// Bob never sees Alice's private item, in the list or by id.
	items, err := itemSvc.List(ctxAs("user-bob"), ItemListFilter{})
	if err != nil {
		t.Fatalf("list as bob: %v", err)
	}
	if hasItem(items, ids["alicePrivate"]) {
		t.Fatal("bob saw alice's private item in the list")
	}
	if !hasItem(items, ids["aliceShared"]) {
		t.Fatal("bob should see alice's shared item")
	}
	if _, err := itemSvc.Get(ctxAs("user-bob"), ids["alicePrivate"]); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob Get on alice's private item: expected ErrNotFound, got %v", err)
	}

	// Alice still sees her own private item.
	items, err = itemSvc.List(ctxAs("user-alice"), ItemListFilter{})
	if err != nil {
		t.Fatalf("list as alice: %v", err)
	}
	if !hasItem(items, ids["alicePrivate"]) {
		t.Fatal("alice lost her own private item in the list")
	}
	if _, err := itemSvc.Get(ctxAs("user-alice"), ids["alicePrivate"]); err != nil {
		t.Fatalf("alice Get on her private item: %v", err)
	}
}

func TestPrivacyHiddenFromOwnerRole(t *testing.T) {
	itemSvc, _, _, ids := privacyFixture(t)

	// The product design hides private items from other members INCLUDING the
	// owner role (surprise-gift scenario).
	items, err := itemSvc.List(ownerRoleCtx("user-admin"), ItemListFilter{})
	if err != nil {
		t.Fatalf("list as owner-role admin: %v", err)
	}
	if hasItem(items, ids["alicePrivate"]) {
		t.Fatal("owner-role admin saw alice's private item")
	}
	if _, err := itemSvc.Get(ownerRoleCtx("user-admin"), ids["alicePrivate"]); !errors.Is(err, ErrNotFound) {
		t.Fatalf("owner-role admin Get on alice's private item: expected ErrNotFound, got %v", err)
	}
}

func TestPrivacySearch(t *testing.T) {
	_, _, searchSvc, ids := privacyFixture(t)

	bobResults, err := searchSvc.FTS(ctxAs("user-bob"), "私密日记", false)
	if err != nil {
		t.Fatalf("search as bob: %v", err)
	}
	for _, r := range bobResults {
		if r.ID == ids["alicePrivate"] {
			t.Fatal("bob's search returned alice's private item")
		}
	}

	aliceResults, err := searchSvc.FTS(ctxAs("user-alice"), "私密日记", false)
	if err != nil {
		t.Fatalf("search as alice: %v", err)
	}
	found := false
	for _, r := range aliceResults {
		if r.ID == ids["alicePrivate"] {
			found = true
		}
	}
	if !found {
		t.Fatal("alice's own search should return her private item")
	}
}

func TestPrivacyLocationTreeInheritanceAndItems(t *testing.T) {
	itemSvc, locSvc, searchSvc, ids := privacyFixture(t)

	// Bob's location tree omits alice's private node and its child.
	tree, err := locSvc.Tree(ctxAs("user-bob"))
	if err != nil {
		t.Fatalf("tree as bob: %v", err)
	}
	var walk func(loc *model.Location) bool
	walk = func(loc *model.Location) bool {
		if loc.ID == ids["aliceLoc"] || loc.ID == ids["aliceChild"] {
			return true
		}
		for _, child := range loc.Children {
			if walk(child) {
				return true
			}
		}
		return false
	}
	for _, root := range tree {
		if walk(root) {
			t.Fatal("bob's location tree leaked alice's private location subtree")
		}
	}

	// Bob cannot fetch the private location or its public child by id.
	if _, err := locSvc.Get(ctxAs("user-bob"), ids["aliceLoc"]); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob Get private location: expected ErrNotFound, got %v", err)
	}
	if _, err := locSvc.Get(ctxAs("user-bob"), ids["aliceChild"]); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob Get child of private location: expected ErrNotFound, got %v", err)
	}

	// A public item inside a private location inherits the hiding.
	items, err := itemSvc.List(ctxAs("user-bob"), ItemListFilter{})
	if err != nil {
		t.Fatalf("list as bob: %v", err)
	}
	if hasItem(items, ids["childItem"]) {
		t.Fatal("bob saw an item inside alice's private location")
	}
	results, err := searchSvc.FTS(ctxAs("user-bob"), "柜中物品", false)
	if err != nil {
		t.Fatalf("search as bob: %v", err)
	}
	for _, r := range results {
		if r.ID == ids["childItem"] {
			t.Fatal("bob's search returned an item inside alice's private location")
		}
	}

	// Alice sees her own private location subtree and the item inside it.
	tree, err = locSvc.Tree(ctxAs("user-alice"))
	if err != nil {
		t.Fatalf("tree as alice: %v", err)
	}
	foundLoc := false
	walk = func(loc *model.Location) bool {
		if loc.ID == ids["aliceLoc"] {
			foundLoc = true
		}
		for _, child := range loc.Children {
			walk(child)
		}
		return false
	}
	for _, root := range tree {
		walk(root)
	}
	if !foundLoc {
		t.Fatal("alice should see her own private location in the tree")
	}
	if _, err := itemSvc.Get(ctxAs("user-alice"), ids["childItem"]); err != nil {
		t.Fatalf("alice Get item in her private location: %v", err)
	}
}

func TestPrivacyExport(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "user-alice", "member")
	crypto, err := havitcrypto.New("test-secret")
	if err != nil {
		t.Fatalf("new crypto: %v", err)
	}
	exportSvc := NewExportService(db, crypto)
	itemSvc := NewItemService(db)
	locSvc := NewLocationService(db)

	alice := "user-alice"
	loc, err := locSvc.Create(ctxAs(alice), LocationCreateInput{Name: "公共柜", Type: "furniture"})
	if err != nil {
		t.Fatalf("create location: %v", err)
	}
	if _, err := itemSvc.Create(ctxAs(alice), ItemCreateInput{
		Name: "共享物品", Type: model.ItemTypeDurable, LocationID: &loc.ID,
		IsPrivate: false, OwnerID: &alice,
	}); err != nil {
		t.Fatalf("create shared item: %v", err)
	}
	priv, err := itemSvc.Create(ctxAs(alice), ItemCreateInput{
		Name: "私密物品", Type: model.ItemTypeDurable, LocationID: &loc.ID,
		IsPrivate: true, OwnerID: &alice,
	})
	if err != nil {
		t.Fatalf("create private item: %v", err)
	}

	export, err := exportSvc.Items(ctxAs("user-bob"))
	if err != nil {
		t.Fatalf("export as bob: %v", err)
	}
	for _, item := range export.Items {
		if item.ID == priv.ID {
			t.Fatal("bob's export contained alice's private item")
		}
	}
}

func TestPrivacyAbnormalList(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	seedUser(t, db, "user-alice", "member")
	itemSvc := NewItemService(db)
	abnormalSvc := NewAbnormalService(db)
	locSvc := NewLocationService(db)
	alice := "user-alice"

	loc, err := locSvc.Create(ctxAs(alice), LocationCreateInput{Name: "公共柜", Type: "furniture"})
	if err != nil {
		t.Fatalf("create location: %v", err)
	}
	sharedItem, err := itemSvc.Create(ctxAs(alice), ItemCreateInput{
		Name: "共享损坏物", Type: model.ItemTypeDurable, LocationID: &loc.ID,
		IsPrivate: false, OwnerID: &alice,
	})
	if err != nil {
		t.Fatalf("create shared item: %v", err)
	}
	privateItem, err := itemSvc.Create(ctxAs(alice), ItemCreateInput{
		Name: "私密丢失物", Type: model.ItemTypeDurable, LocationID: &loc.ID,
		IsPrivate: true, OwnerID: &alice,
	})
	if err != nil {
		t.Fatalf("create private item: %v", err)
	}
	for _, id := range []string{sharedItem.ID, privateItem.ID} {
		if _, err := abnormalSvc.Create(ctx, id, "lost", "某人", nil, nil); err != nil {
			t.Fatalf("create abnormal record: %v", err)
		}
	}

	items, _, err := abnormalSvc.List(ctxAs("user-bob"), AbnormalListFilter{})
	if err != nil {
		t.Fatalf("abnormal list as bob: %v", err)
	}
	for _, item := range items {
		if item.ItemID == privateItem.ID {
			t.Fatal("bob's abnormal list contained alice's private item")
		}
	}
}

func TestPrivacyLoanGuardsPrivateItems(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "user-alice", "member")
	itemSvc := NewItemService(db)
	locSvc := NewLocationService(db)
	loanSvc := NewLoanService(db, NewAbnormalService(db))
	alice := "user-alice"

	loc, err := locSvc.Create(ctxAs(alice), LocationCreateInput{Name: "公共柜", Type: "furniture"})
	if err != nil {
		t.Fatalf("create location: %v", err)
	}
	priv, err := itemSvc.Create(ctxAs(alice), ItemCreateInput{
		Name: "私密物品", Type: model.ItemTypeDurable, LocationID: &loc.ID,
		IsPrivate: true, OwnerID: &alice,
	})
	if err != nil {
		t.Fatalf("create private item: %v", err)
	}

	// Bob cannot loan out Alice's private item nor read its loan history.
	if _, err := loanSvc.Create(ctxAs("user-bob"), priv.ID, LoanCreateInput{BorrowerName: "Bob"}); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob loan on alice's private item: expected ErrNotFound, got %v", err)
	}
	if _, err := loanSvc.ListForItem(ctxAs("user-bob"), priv.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob list loans of alice's private item: expected ErrNotFound, got %v", err)
	}
}

func TestPrivacyCategoryUsageCountsExcludePrivateItems(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "user-alice", "member")
	itemSvc := NewItemService(db)
	locSvc := NewLocationService(db)
	catSvc := NewCategoryService(db)
	alice := "user-alice"

	cat, err := catSvc.Create(ctxAs(alice), CategoryCreateInput{Name: "摄影器材", Icon: "camera", RootType: "physical"})
	if err != nil {
		t.Fatalf("create category: %v", err)
	}
	loc, err := locSvc.Create(ctxAs(alice), LocationCreateInput{Name: "公共柜", Type: "furniture"})
	if err != nil {
		t.Fatalf("create location: %v", err)
	}
	mkItem := func(name string, private bool) {
		t.Helper()
		category := "摄影器材"
		if _, err := itemSvc.Create(ctxAs(alice), ItemCreateInput{
			Name: name, Type: model.ItemTypeDurable, LocationID: &loc.ID,
			Category: &category, IsPrivate: private, OwnerID: &alice,
		}); err != nil {
			t.Fatalf("create item %s: %v", name, err)
		}
	}
	mkItem("共享镜头", false)
	mkItem("私密镜头", true)

	// Bob sees only the shared item's contribution to the usage count.
	got, err := catSvc.List(ctxAs("user-bob"))
	if err != nil {
		t.Fatalf("category list as bob: %v", err)
	}
	for _, c := range got {
		if c.ID == cat.ID && c.UsageCount != 1 {
			t.Fatalf("bob sees usage count %d for a category with 1 visible item, want 1", c.UsageCount)
		}
	}
	// Alice sees both.
	got, err = catSvc.List(ctxAs(alice))
	if err != nil {
		t.Fatalf("category list as alice: %v", err)
	}
	for _, c := range got {
		if c.ID == cat.ID && c.UsageCount != 2 {
			t.Fatalf("alice sees usage count %d for 2 items, want 2", c.UsageCount)
		}
	}
}
