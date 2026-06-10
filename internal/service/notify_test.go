package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/oklog/ulid/v2"
)

func TestNotifyProcessDueSendsWebhookAndMarksReminderSent(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	reminderSvc := NewReminderService(database)

	if _, err := database.ExecContext(ctx,
		`INSERT INTO items (id, name, type, status, is_private, created_at, updated_at)
		 VALUES ('item-1', '滤芯', 'consumable_b', 'in_stock', 0, 1, 1)`); err != nil {
		t.Fatalf("insert item: %v", err)
	}
	reminderID := ulid.Make().String()
	if _, err := database.ExecContext(ctx,
		`INSERT INTO reminders (id, item_id, type, trigger_at, is_dismissed)
		 VALUES (?, 'item-1', 'filter_life', 100, 0)`,
		reminderID,
	); err != nil {
		t.Fatalf("insert reminder: %v", err)
	}

	received := NotifyMessage{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST, got %s", r.Method)
		}
		if err := json.NewDecoder(r.Body).Decode(&received); err != nil {
			t.Fatalf("decode webhook: %v", err)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	notifySvc := NewNotifyService(reminderSvc, NewHTTPNotifyGateway(HTTPNotifyGatewayConfig{WebhookURL: server.URL}))
	result, err := notifySvc.ProcessDue(ctx, 200)
	if err != nil {
		t.Fatalf("process due reminders: %v", err)
	}
	if result.Processed != 1 || result.Sent != 1 || result.Failed != 0 {
		t.Fatalf("unexpected process result: %#v", result)
	}
	if received.ReminderID != reminderID || received.Type != "filter_life" || received.ItemID != "item-1" {
		t.Fatalf("unexpected webhook message: %#v", received)
	}

	reminder, err := reminderSvc.Get(ctx, reminderID)
	if err != nil {
		t.Fatalf("get reminder: %v", err)
	}
	if reminder.SentAt == nil || *reminder.SentAt != 200 {
		t.Fatalf("expected sent_at 200, got %#v", reminder.SentAt)
	}
}
