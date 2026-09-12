package service

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/mahoo12138/havit/internal/model"
)

func createTestEssentialsItem(t *testing.T, ctx context.Context, svc *ItemService, name, homeID string) *model.Item {
	t.Helper()

	item, err := svc.Create(ctx, ItemCreateInput{
		Name:               name,
		Type:               model.ItemTypeEssentials,
		LocationID:         &homeID,
		HomeBaseLocationID: &homeID,
	})
	if err != nil {
		t.Fatalf("create essentials item %s: %v", name, err)
	}
	return item
}

func decodeEssentialsPayload(t *testing.T, payload *string) essentialsEventPayload {
	t.Helper()

	if payload == nil {
		t.Fatalf("expected event payload, got nil")
	}
	var decoded essentialsEventPayload
	if err := json.Unmarshal([]byte(*payload), &decoded); err != nil {
		t.Fatalf("decode event payload: %v", err)
	}
	return decoded
}

// Event ordering is only guaranteed within a second via id DESC, which is not
// stable across freshly generated ULIDs, so assertions aggregate over the set.
func TestListEssentialsEventsReturnsLedgerWithPayload(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	homeID := createTestLocation(t, ctx, database, "玄关")
	bagID := createTestLocation(t, ctx, database, "通勤包")

	keys := createTestEssentialsItem(t, ctx, svc, "钥匙", homeID)
	wallet := createTestEssentialsItem(t, ctx, svc, "钱包", homeID)

	if _, err := svc.SetEssentialsStatus(ctx, keys.ID, EssentialsStatusInput{
		CurrentStatusTag: "carry",
		LocationID:       &bagID,
	}); err != nil {
		t.Fatalf("set keys status: %v", err)
	}
	if _, err := svc.SetEssentialsStatus(ctx, wallet.ID, EssentialsStatusInput{
		CurrentStatusTag: "travel_bag",
		LocationID:       &homeID,
	}); err != nil {
		t.Fatalf("set wallet status: %v", err)
	}
	if _, err := svc.ReturnEssentialsHome(ctx, keys.ID); err != nil {
		t.Fatalf("return keys home: %v", err)
	}
	moved, err := svc.PackEssentialsAll(ctx, bagID)
	if err != nil {
		t.Fatalf("pack all: %v", err)
	}
	if moved != 2 {
		t.Fatalf("expected 2 packed, got %d", moved)
	}
	moved, err = svc.ReturnEssentialsAll(ctx)
	if err != nil {
		t.Fatalf("return all: %v", err)
	}
	if moved != 2 {
		t.Fatalf("expected 2 returned, got %d", moved)
	}

	// A carried item sits at no location at all; going home must return it too.
	if _, err := svc.SetEssentialsStatus(ctx, keys.ID, EssentialsStatusInput{
		CurrentStatusTag: "carry",
	}); err != nil {
		t.Fatalf("mark keys carried: %v", err)
	}
	moved, err = svc.ReturnEssentialsAll(ctx)
	if err != nil {
		t.Fatalf("return all after carry: %v", err)
	}
	if moved != 1 {
		t.Fatalf("expected carried item to be returned, got %d", moved)
	}

	events, total, err := svc.ListEssentialsEvents(ctx, EssentialsEventFilter{})
	if err != nil {
		t.Fatalf("list essentials events: %v", err)
	}
	// 3 status changes + 1 return-home + 2 pack + 3 return-all.
	if total != 9 || len(events) != 9 {
		t.Fatalf("expected 9 events (total=%d, len=%d)", total, len(events))
	}
	counts := map[string]int{}
	for _, ev := range events {
		if ev.ItemName != "钥匙" && ev.ItemName != "钱包" {
			t.Fatalf("expected joined item name on event %s, got %q", ev.ID, ev.ItemName)
		}
		counts[ev.EventType]++
	}
	if counts["essentials_status_changed"] != 5 || counts["essentials_returned_home"] != 4 {
		t.Fatalf("unexpected event mix: %#v", counts)
	}

	returns := 0
	toTags := map[string]int{}
	for _, ev := range events {
		payload := decodeEssentialsPayload(t, ev.Payload)
		if ev.EventType == "essentials_returned_home" {
			returns++
			if payload.To.Tag != nil {
				t.Fatalf("expected cleared to tag on return event, got %q", *payload.To.Tag)
			}
			if payload.To.LocationID == nil || *payload.To.LocationID != homeID {
				t.Fatalf("expected to location home, got %#v", payload.To.LocationID)
			}
		}
		if ev.EventType == "essentials_status_changed" {
			if payload.To.Tag == nil {
				t.Fatalf("expected to tag set on status-change event")
			}
			toTags[*payload.To.Tag]++
		}
	}
	if returns != 4 {
		t.Fatalf("expected 4 return events, got %d", returns)
	}
	if toTags["carry"] != 2 || toTags["travel_bag"] != 1 || toTags["away"] != 2 {
		t.Fatalf("unexpected to-tag mix: %#v", toTags)
	}

	filtered, total, err := svc.ListEssentialsEvents(ctx, EssentialsEventFilter{
		EventTypes: []string{"essentials_status_changed"},
	})
	if err != nil {
		t.Fatalf("list filtered events: %v", err)
	}
	if total != 5 || len(filtered) != 5 {
		t.Fatalf("expected 5 status-change events, got total=%d len=%d", total, len(filtered))
	}

	paged, total, err := svc.ListEssentialsEvents(ctx, EssentialsEventFilter{Limit: 2, Offset: 1})
	if err != nil {
		t.Fatalf("list paged events: %v", err)
	}
	if total != 9 || len(paged) != 2 {
		t.Fatalf("expected page of 2 with total 9, got total=%d len=%d", total, len(paged))
	}
}

func TestSetEssentialsStatusBulkUpdatesAndLogs(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	homeID := createTestLocation(t, ctx, database, "玄关")

	keys := createTestEssentialsItem(t, ctx, svc, "钥匙", homeID)
	wallet := createTestEssentialsItem(t, ctx, svc, "钱包", homeID)

	updated, err := svc.SetEssentialsStatusBulk(ctx, EssentialsBulkStatusInput{
		IDs:              []string{keys.ID, wallet.ID, "missing-item"},
		CurrentStatusTag: "carry",
	})
	if err != nil {
		t.Fatalf("bulk set essentials status: %v", err)
	}
	if updated != 2 {
		t.Fatalf("expected 2 updated, got %d", updated)
	}

	for _, id := range []string{keys.ID, wallet.ID} {
		item, err := svc.Get(ctx, id)
		if err != nil {
			t.Fatalf("get item: %v", err)
		}
		if item.CurrentStatusTag == nil || *item.CurrentStatusTag != "carry" {
			t.Fatalf("expected carry tag on %s, got %#v", id, item.CurrentStatusTag)
		}
		// Mirror the single-item endpoint: marking a dynamic status releases the
		// physical location, otherwise a location == home-base check would
		// override the tag.
		if item.LocationID != nil {
			t.Fatalf("expected location cleared on %s, got %s", id, *item.LocationID)
		}
	}

	events, total, err := svc.ListEssentialsEvents(ctx, EssentialsEventFilter{
		EventTypes: []string{"essentials_status_changed"},
	})
	if err != nil {
		t.Fatalf("list events: %v", err)
	}
	if total != 2 || len(events) != 2 {
		t.Fatalf("expected 2 logged events, got total=%d len=%d", total, len(events))
	}
	payload := decodeEssentialsPayload(t, events[0].Payload)
	if payload.To.Tag == nil || *payload.To.Tag != "carry" {
		t.Fatalf("expected to tag carry, got %#v", payload.To.Tag)
	}
	if payload.From.Tag != nil {
		t.Fatalf("expected from tag nil, got %#v", payload.From.Tag)
	}

	if _, err := svc.SetEssentialsStatusBulk(ctx, EssentialsBulkStatusInput{IDs: []string{keys.ID}}); err == nil {
		t.Fatalf("expected error for empty tag")
	}
	if _, err := svc.SetEssentialsStatusBulk(ctx, EssentialsBulkStatusInput{CurrentStatusTag: "carry"}); err == nil {
		t.Fatalf("expected error for empty ids")
	}
}

func TestEssentialsBulkActionsRespectPrivacy(t *testing.T) {
	database := newTestDB(t)
	svc := NewItemService(database)
	homeID := createTestLocation(t, context.Background(), database, "玄关")
	seedUser(t, database, "user-a", "member")
	seedUser(t, database, "user-b", "member")

	ownerA := ctxAs("user-a")
	ownerB := ctxAs("user-b")

	ownerBID := "user-b"
	private, err := svc.Create(ownerB, ItemCreateInput{
		Name:               "别人的钥匙",
		Type:               model.ItemTypeEssentials,
		LocationID:         &homeID,
		HomeBaseLocationID: &homeID,
		IsPrivate:          true,
		OwnerID:            &ownerBID,
	})
	if err != nil {
		t.Fatalf("create private item: %v", err)
	}

	mine := createTestEssentialsItem(t, ownerA, svc, "我的钥匙", homeID)

	updated, err := svc.SetEssentialsStatusBulk(ownerA, EssentialsBulkStatusInput{
		IDs:              []string{mine.ID, private.ID},
		CurrentStatusTag: "carry",
	})
	if err != nil {
		t.Fatalf("bulk set essentials status: %v", err)
	}
	if updated != 1 {
		t.Fatalf("expected only own item updated, got %d", updated)
	}

	privateItem, err := svc.Get(ownerB, private.ID)
	if err != nil {
		t.Fatalf("owner get private item: %v", err)
	}
	if privateItem.CurrentStatusTag != nil {
		t.Fatalf("expected private item untouched, got %#v", privateItem.CurrentStatusTag)
	}
}
