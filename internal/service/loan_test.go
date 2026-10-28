package service

import (
	"context"
	"strings"
	"testing"

	"github.com/mahoo12138/havit/internal/model"
)

func TestLoanCreateMarksItemBorrowedAndCreatesDueReminder(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	loanSvc := NewLoanService(database, NewAbnormalService(database))
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

func TestLoanReturnClearsDueReminderAndRejectsRepeat(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	loanSvc := NewLoanService(database, NewAbnormalService(database))
	locID := createTestLocation(t, ctx, database, "书房")

	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "移动硬盘",
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
	if _, err := loanSvc.Create(ctx, item.ID, LoanCreateInput{BorrowerName: "小李"}); err == nil {
		t.Fatal("expected second loan on borrowed item to be rejected")
	}
	if _, err := loanSvc.Return(ctx, loan.ID, LoanReturnInput{}); err != nil {
		t.Fatalf("return loan: %v", err)
	}

	var dueReminders int
	if err := database.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM reminders WHERE item_id = ? AND type = 'loan_due'`, item.ID,
	).Scan(&dueReminders); err != nil {
		t.Fatalf("count due reminders: %v", err)
	}
	if dueReminders != 0 {
		t.Fatalf("expected loan_due reminder removed on return, got %d", dueReminders)
	}
	if _, err := loanSvc.Return(ctx, loan.ID, LoanReturnInput{}); err == nil {
		t.Fatal("expected repeated return to be rejected")
	}

	// A returned item can be lent again without leaking the old reminder.
	if _, err := loanSvc.Create(ctx, item.ID, LoanCreateInput{BorrowerName: "小李"}); err != nil {
		t.Fatalf("lend returned item again: %v", err)
	}
}

func TestLoanCreateRejectsExitedItem(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	loanSvc := NewLoanService(database, NewAbnormalService(database))
	locID := createTestLocation(t, ctx, database, "书房")

	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "旧手机",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	if _, err := itemSvc.Exit(ctx, item.ID, ItemExitInput{ExitType: "sold"}); err != nil {
		t.Fatalf("exit item: %v", err)
	}
	if _, err := loanSvc.Create(ctx, item.ID, LoanCreateInput{BorrowerName: "小王"}); err == nil {
		t.Fatal("expected exited item to be rejected for loan")
	}
}

func TestLoanLifecycleLogsEvents(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	loanSvc := NewLoanService(database, NewAbnormalService(database))
	locID := createTestLocation(t, ctx, database, "书房")

	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "望远镜",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	loan, err := loanSvc.Create(ctx, item.ID, LoanCreateInput{BorrowerName: "小王"})
	if err != nil {
		t.Fatalf("create loan: %v", err)
	}

	var eventType string
	if err := database.QueryRowContext(ctx,
		`SELECT event_type FROM item_events WHERE item_id = ? AND event_type = 'loan_started'`,
		item.ID,
	).Scan(&eventType); err != nil {
		t.Fatalf("find loan_started event: %v", err)
	}

	if _, err := loanSvc.Return(ctx, loan.ID, LoanReturnInput{}); err != nil {
		t.Fatalf("return loan: %v", err)
	}
	if err := database.QueryRowContext(ctx,
		`SELECT event_type FROM item_events WHERE item_id = ? AND event_type = 'loan_returned'`,
		item.ID,
	).Scan(&eventType); err != nil {
		t.Fatalf("find loan_returned event: %v", err)
	}
}

func TestMarkUnreturnedCreatesAbnormalRecordAndLogsEvent(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	itemSvc := NewItemService(database)
	loanSvc := NewLoanService(database, NewAbnormalService(database))
	locID := createTestLocation(t, ctx, database, "书房")

	item, err := itemSvc.Create(ctx, ItemCreateInput{
		Name:       "投影仪",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	loan, err := loanSvc.Create(ctx, item.ID, LoanCreateInput{BorrowerName: "小王"})
	if err != nil {
		t.Fatalf("create loan: %v", err)
	}

	compensation := 500.0
	currency := "CNY"
	notes := "对方弄丢"
	unreturned, err := loanSvc.MarkUnreturned(ctx, loan.ID, LoanUnreturnedInput{
		Compensation:         &compensation,
		CompensationCurrency: &currency,
		Notes:                &notes,
	})
	if err != nil {
		t.Fatalf("mark unreturned: %v", err)
	}
	if unreturned.Status != "unreturned" {
		t.Fatalf("expected loan status unreturned, got %q", unreturned.Status)
	}
	if unreturned.Compensation == nil || *unreturned.Compensation != compensation {
		t.Fatalf("expected compensation %v, got %#v", compensation, unreturned.Compensation)
	}

	itemAfter, err := itemSvc.Get(ctx, item.ID)
	if err != nil {
		t.Fatalf("get item: %v", err)
	}
	if itemAfter.Status != model.StatusUnreturned {
		t.Fatalf("expected item status %s, got %s", model.StatusUnreturned, itemAfter.Status)
	}

	// The liability settlement lands in the abnormal module.
	var abnormalType, responsiblePerson string
	var estimatedLoss float64
	if err := database.QueryRowContext(ctx, `
		SELECT abnormal_type, responsible_person, estimated_loss
		FROM abnormal_records WHERE item_id = ?`,
		item.ID,
	).Scan(&abnormalType, &responsiblePerson, &estimatedLoss); err != nil {
		t.Fatalf("find abnormal record: %v", err)
	}
	if abnormalType != "unreturned" || responsiblePerson != "小王" || estimatedLoss != compensation {
		t.Fatalf("unexpected abnormal record: type=%q person=%q loss=%v",
			abnormalType, responsiblePerson, estimatedLoss)
	}

	// And it stays on the item's permanent lifecycle log with the settlement details.
	var payload string
	if err := database.QueryRowContext(ctx,
		`SELECT COALESCE(payload, '') FROM item_events WHERE item_id = ? AND event_type = 'loan_unreturned'`,
		item.ID,
	).Scan(&payload); err != nil {
		t.Fatalf("find loan_unreturned event: %v", err)
	}
	if !strings.Contains(payload, "小王") || !strings.Contains(payload, "500") || !strings.Contains(payload, "CNY") {
		t.Fatalf("expected settlement details in event payload, got %q", payload)
	}
}
