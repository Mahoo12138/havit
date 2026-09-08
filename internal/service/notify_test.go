package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mahoo12138/havit/internal/config"
	"github.com/oklog/ulid/v2"
)

func TestNotifyProcessDueSendsWebhookAndMarksReminderSent(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	reminderSvc := NewReminderService(database)

	if _, err := database.ExecContext(ctx,
		`INSERT INTO items (id, name, type, status, is_private, created_at, updated_at)
		 VALUES ('item-1', '滤芯', 'tracked_spares', 'in_stock', 0, 1, 1)`); err != nil {
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

	cfgSvc := config.NewConfigService(database)
	if _, err := database.ExecContext(ctx,
		`INSERT INTO system_configs (key, value, updated_at, updated_by) VALUES ('notify.webhook_url', ?, 1, NULL)`,
		server.URL,
	); err != nil {
		t.Fatalf("set notify webhook config: %v", err)
	}
	if err := cfgSvc.RefreshDBCache(); err != nil {
		t.Fatalf("refresh config cache: %v", err)
	}
	notifySvc := NewNotifyService(reminderSvc, NewHTTPNotifyGateway(cfgSvc))
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

func TestNotifyProcessDueRetriesFailedDelivery(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	reminderSvc := NewReminderService(database)

	if _, err := database.ExecContext(ctx,
		`INSERT INTO items (id, name, type, status, is_private, created_at, updated_at)
		 VALUES ('item-1', '滤芯', 'tracked_spares', 'in_stock', 0, 1, 1)`); err != nil {
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

	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		if calls == 1 {
			// First attempt: the endpoint is down / rejects the message.
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	cfgSvc := config.NewConfigService(database)
	if _, err := database.ExecContext(ctx,
		`INSERT INTO system_configs (key, value, updated_at, updated_by) VALUES ('notify.webhook_url', ?, 1, NULL)`,
		server.URL,
	); err != nil {
		t.Fatalf("set notify webhook config: %v", err)
	}
	if err := cfgSvc.RefreshDBCache(); err != nil {
		t.Fatalf("refresh config cache: %v", err)
	}
	notifySvc := NewNotifyService(reminderSvc, NewHTTPNotifyGateway(cfgSvc))

	// Failed delivery must not burn the reminder: it stays pending for retry.
	result, err := notifySvc.ProcessDue(ctx, 200)
	if err != nil {
		t.Fatalf("process due with failing endpoint: %v", err)
	}
	if result.Processed != 1 || result.Sent != 0 || result.Failed != 1 {
		t.Fatalf("unexpected failure result: %#v", result)
	}
	reminder, err := reminderSvc.Get(ctx, reminderID)
	if err != nil {
		t.Fatalf("get reminder: %v", err)
	}
	if reminder.SentAt != nil {
		t.Fatalf("expected sent_at to stay NULL after failure, got %#v", reminder.SentAt)
	}

	// Next cycle (endpoint healthy again) delivers it.
	result, err = notifySvc.ProcessDue(ctx, 200)
	if err != nil {
		t.Fatalf("process due retry: %v", err)
	}
	if result.Processed != 1 || result.Sent != 1 || result.Failed != 0 {
		t.Fatalf("unexpected retry result: %#v", result)
	}
}

func TestNotifyNtfyPathSendsTextWithTitle(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	reminderSvc := NewReminderService(database)

	if _, err := database.ExecContext(ctx,
		`INSERT INTO items (id, name, type, status, is_private, created_at, updated_at)
		 VALUES ('item-1', '滤芯', 'tracked_spares', 'in_stock', 0, 1, 1)`); err != nil {
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

	var contentType, title, body string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		contentType = r.Header.Get("Content-Type")
		title = r.Header.Get("Title")
		raw := make([]byte, 4096)
		n, _ := r.Body.Read(raw)
		body = string(raw[:n])
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	cfgSvc := config.NewConfigService(database)
	if _, err := database.ExecContext(ctx,
		`INSERT INTO system_configs (key, value, updated_at, updated_by) VALUES ('notify.ntfy_url', ?, 1, NULL)`,
		server.URL,
	); err != nil {
		t.Fatalf("set ntfy config: %v", err)
	}
	if err := cfgSvc.RefreshDBCache(); err != nil {
		t.Fatalf("refresh config cache: %v", err)
	}
	notifySvc := NewNotifyService(reminderSvc, NewHTTPNotifyGateway(cfgSvc))
	result, err := notifySvc.ProcessDue(ctx, 200)
	if err != nil {
		t.Fatalf("process due via ntfy: %v", err)
	}
	if result.Processed != 1 || result.Sent != 1 {
		t.Fatalf("unexpected ntfy result: %#v", result)
	}
	if contentType != "text/plain; charset=utf-8" {
		t.Fatalf("expected text/plain content type, got %q", contentType)
	}
	if title != "Havit reminder: filter_life" {
		t.Fatalf("expected ntfy title header, got %q", title)
	}
	if body != "Havit reminder: filter_life\nReminder filter_life for item item-1 is due." {
		t.Fatalf("unexpected ntfy body: %q", body)
	}
}
