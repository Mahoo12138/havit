package service

import (
	"context"
	"testing"

	"github.com/oklog/ulid/v2"
)

func TestReminderListMarkSentAndDismiss(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewReminderService(database)

	if _, err := database.ExecContext(ctx,
		`INSERT INTO items (id, name, type, status, is_private, created_at, updated_at)
		 VALUES ('item-1', '滤芯', 'consumable_b', 'in_stock', 0, 1, 1)`); err != nil {
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
