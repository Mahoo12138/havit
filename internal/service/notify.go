package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/mahoo12138/havit/internal/config"
	"github.com/mahoo12138/havit/internal/model"
)

type NotifyGateway interface {
	Send(ctx context.Context, msg NotifyMessage) error
}

type NotifyMessage struct {
	Title      string `json:"title"`
	Body       string `json:"body"`
	ReminderID string `json:"reminder_id"`
	ItemID     string `json:"item_id"`
	Type       string `json:"type"`
}

type NotifyService struct {
	reminders *ReminderService
	gateway   NotifyGateway
}

func NewNotifyService(reminders *ReminderService, gateway NotifyGateway) *NotifyService {
	return &NotifyService{reminders: reminders, gateway: gateway}
}

type NotifyProcessResult struct {
	Processed int `json:"processed"`
	Sent      int `json:"sent"`
	Failed    int `json:"failed"`
}

func (s *NotifyService) ProcessDue(ctx context.Context, now int64) (*NotifyProcessResult, error) {
	if s.gateway == nil {
		return nil, errors.New("notify gateway not configured")
	}
	due, err := s.reminders.List(ctx, ReminderListFilter{DueOnly: true, Now: now})
	if err != nil {
		return nil, err
	}
	result := &NotifyProcessResult{Processed: len(due)}
	for _, reminder := range due {
		if err := s.gateway.Send(ctx, messageForReminder(reminder)); err != nil {
			result.Failed++
			continue
		}
		if _, err := s.reminders.MarkSent(ctx, reminder.ID, now); err != nil {
			return nil, err
		}
		result.Sent++
	}
	return result, nil
}

func (s *NotifyService) StartScheduler(ctx context.Context, interval time.Duration) {
	if interval <= 0 {
		interval = 15 * time.Minute
	}
	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				_, _ = s.ProcessDue(ctx, time.Now().Unix())
			case <-ctx.Done():
				return
			}
		}
	}()
}

func messageForReminder(reminder *model.Reminder) NotifyMessage {
	return NotifyMessage{
		Title:      "Havit reminder: " + reminder.Type,
		Body:       fmt.Sprintf("Reminder %s for item %s is due.", reminder.Type, reminder.ItemID),
		ReminderID: reminder.ID,
		ItemID:     reminder.ItemID,
		Type:       reminder.Type,
	}
}

type HTTPNotifyGateway struct {
	client *http.Client
	cfgSvc *config.ConfigService
}

func NewHTTPNotifyGateway(cfgSvc *config.ConfigService) *HTTPNotifyGateway {
	return &HTTPNotifyGateway{
		client: &http.Client{Timeout: 8 * time.Second},
		cfgSvc: cfgSvc,
	}
}

func (g *HTTPNotifyGateway) Send(ctx context.Context, msg NotifyMessage) error {
	webhookURL := g.cfgSvc.GetString("notify.webhook_url")
	ntfyURL := g.cfgSvc.GetString("notify.ntfy_url")
	appriseURL := g.cfgSvc.GetString("notify.apprise_url")

	sent := false
	for _, endpoint := range []struct {
		url  string
		kind string
	}{
		{webhookURL, "webhook"},
		{ntfyURL, "ntfy"},
		{appriseURL, "apprise"},
	} {
		if endpoint.url == "" {
			continue
		}
		sent = true
		if err := g.post(ctx, endpoint.url, endpoint.kind, msg); err != nil {
			return err
		}
	}
	if !sent {
		return errors.New("notify gateway not configured")
	}
	return nil
}

func (g *HTTPNotifyGateway) post(ctx context.Context, endpoint, kind string, msg NotifyMessage) error {
	var body []byte
	var contentType string
	if kind == "ntfy" {
		body = []byte(msg.Title + "\n" + msg.Body)
		contentType = "text/plain; charset=utf-8"
	} else {
		raw, err := json.Marshal(msg)
		if err != nil {
			return err
		}
		body = raw
		contentType = "application/json"
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", contentType)
	if kind == "ntfy" {
		req.Header.Set("Title", msg.Title)
	}
	res, err := g.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("notify %s returned %d", kind, res.StatusCode)
	}
	return nil
}
