package service

import (
	"context"
	"errors"
	"testing"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"
)

func TestReminderPrivacyIsolatesPrivateItems(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "user-alice", "member")
	itemSvc := NewItemService(db)
	locID := createTestLocation(t, context.Background(), db, "书房")
	alice := "user-alice"
	item, err := itemSvc.Create(ctxAs(alice), ItemCreateInput{
		Name: "私密耳机", Type: model.ItemTypeDurable, LocationID: &locID,
		IsPrivate: boolPtr(true), OwnerID: &alice,
	})
	if err != nil {
		t.Fatalf("create private item: %v", err)
	}
	reminderID := ulid.Make().String()
	if _, err := db.ExecContext(context.Background(),
		`INSERT INTO reminders (id, item_id, type, trigger_at, is_dismissed)
		 VALUES (?, ?, 'warranty_7d', 1, 0)`, reminderID, item.ID); err != nil {
		t.Fatalf("insert reminder: %v", err)
	}

	svc := NewReminderService(db)
	list, err := svc.List(ctxAs("user-bob"), ReminderListFilter{})
	if err != nil {
		t.Fatalf("list as bob: %v", err)
	}
	if len(list) != 0 {
		t.Fatalf("bob should not see private reminders, got %#v", list)
	}
	if _, err := svc.MarkSent(ctxAs("user-bob"), reminderID, 0); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob mark private reminder: expected ErrNotFound, got %v", err)
	}
	if _, err := svc.Dismiss(ctxAs("user-bob"), reminderID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob dismiss private reminder: expected ErrNotFound, got %v", err)
	}

	ownerList, err := svc.List(ctxAs(alice), ReminderListFilter{})
	if err != nil {
		t.Fatalf("list as alice: %v", err)
	}
	if len(ownerList) != 1 || ownerList[0].ID != reminderID {
		t.Fatalf("expected alice to see her reminder, got %#v", ownerList)
	}
}

func TestReminderListMarkSentAndDismiss(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewReminderService(database)

	if _, err := database.ExecContext(ctx,
		`INSERT INTO items (id, name, type, status, is_private, created_at, updated_at)
		 VALUES ('item-1', '滤芯', 'tracked_spares', 'in_stock', 0, 1, 1)`); err != nil {
		t.Fatalf("insert item: %v", err)
	}
	dueID := ulid.Make().String()
	futureID := ulid.Make().String()
	if _, err := database.ExecContext(ctx,
		`INSERT INTO reminders (id, item_id, type, trigger_at, is_dismissed)
		 VALUES (?, 'item-1', 'filter_life', 100, 0),
		        (?, 'item-1', 'warranty_7d', 300, 0)`,
		dueID, futureID,
	); err != nil {
		t.Fatalf("insert reminders: %v", err)
	}

	due, err := svc.List(ctx, ReminderListFilter{DueOnly: true, Now: 200})
	if err != nil {
		t.Fatalf("list due reminders: %v", err)
	}
	if len(due) != 1 || due[0].ID != dueID {
		t.Fatalf("expected only due reminder, got %#v", due)
	}
	if due[0].ItemName == nil || *due[0].ItemName != "滤芯" {
		t.Fatalf("expected item name joined, got %#v", due[0].ItemName)
	}

	if _, err := database.ExecContext(ctx,
		`INSERT INTO items (id, name, type, status, is_private, created_at, updated_at)
		 VALUES ('item-2', '另一件', 'durable', 'in_stock', 0, 1, 1)`); err != nil {
		t.Fatalf("insert second item: %v", err)
	}
	otherID := ulid.Make().String()
	if _, err := database.ExecContext(ctx,
		`INSERT INTO reminders (id, item_id, type, trigger_at, is_dismissed)
		 VALUES (?, 'item-2', 'loan_due', 100, 0)`, otherID); err != nil {
		t.Fatalf("insert other reminder: %v", err)
	}

	byItem, err := svc.List(ctx, ReminderListFilter{ItemID: "item-1"})
	if err != nil {
		t.Fatalf("list by item: %v", err)
	}
	if len(byItem) != 2 {
		t.Fatalf("expected 2 reminders for item-1, got %d", len(byItem))
	}
	for _, r := range byItem {
		if r.ItemID != "item-1" {
			t.Fatalf("unexpected item %q in filtered list", r.ItemID)
		}
	}

	sent, err := svc.MarkSent(ctx, dueID, 210)
	if err != nil {
		t.Fatalf("mark sent: %v", err)
	}
	if sent.SentAt == nil || *sent.SentAt != 210 {
		t.Fatalf("expected sent_at 210, got %#v", sent.SentAt)
	}

	dismissed, err := svc.Dismiss(ctx, futureID)
	if err != nil {
		t.Fatalf("dismiss reminder: %v", err)
	}
	if !dismissed.IsDismissed {
		t.Fatalf("expected reminder dismissed, got %#v", dismissed)
	}
}
