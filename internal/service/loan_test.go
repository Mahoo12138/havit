package service

import (
	"context"
	"testing"

	"github.com/mahoo12138/havit/internal/model"
)

func TestLoanCreateMarksItemBorrowedAndCreatesDueReminder(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	loanSvc := NewLoanService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "备用相机",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	dueAt := int64(1780000000)
	loan, err := loanSvc.Create(ctx, item.ID, LoanCreateInput{
		BorrowerName: "小王",
		DueAt:        &dueAt,
	})
	if err != nil {
		t.Fatalf("create loan: %v", err)
	}
	if loan.Status != "active" {
		t.Fatalf("expected active loan, got %q", loan.Status)
	}

	borrowed, err := itemSvc.Get(ctx, item.ID)
	if err != nil {
		t.Fatalf("get item: %v", err)
	}
	if borrowed.Status != model.StatusBorrowed {
		t.Fatalf("expected item borrowed, got %s", borrowed.Status)
	}

	var reminderType string
	var triggerAt int64
	if err := database.QueryRowContext(ctx,
		`SELECT type, trigger_at FROM reminders WHERE item_id = ?`, item.ID,
	).Scan(&reminderType, &triggerAt); err != nil {
		t.Fatalf("find reminder: %v", err)
	}
	if reminderType != "loan_due" || triggerAt != dueAt {
		t.Fatalf("expected loan_due reminder at %d, got %q at %d", dueAt, reminderType, triggerAt)
	}
}
