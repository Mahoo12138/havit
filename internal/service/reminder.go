package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/mahoo12138/havit/internal/model"
)

type ReminderService struct {
	db *sql.DB
}

func NewReminderService(db *sql.DB) *ReminderService {
	return &ReminderService{db: db}
}

type ReminderListFilter struct {
	DueOnly bool
	ItemID  string
	Now     int64
}

func (s *ReminderService) List(ctx context.Context, f ReminderListFilter) ([]*model.Reminder, error) {
	return s.list(ctx, f, true)
}

// ListDueForDelivery is used by the notification scheduler, which has no
// caller identity and must deliver reminders across all users.
func (s *ReminderService) ListDueForDelivery(ctx context.Context, now int64) ([]*model.Reminder, error) {
	return s.list(ctx, ReminderListFilter{DueOnly: true, Now: now}, false)
}

func (s *ReminderService) list(ctx context.Context, f ReminderListFilter, enforcePrivacy bool) ([]*model.Reminder, error) {
	args := []any{}
	where := "1 = 1"
	if f.DueOnly {
		if f.Now == 0 {
			f.Now = time.Now().Unix()
		}
		where += " AND r.sent_at IS NULL AND r.is_dismissed = 0 AND r.trigger_at <= ?"
		args = append(args, f.Now)
	}
	if f.ItemID != "" {
		where += " AND r.item_id = ?"
		args = append(args, f.ItemID)
	}

	if enforcePrivacy {
		var err error
		where, args, err = applyItemPrivacy(ctx, s.db, "i", where, args)
		if err != nil {
			return nil, err
		}
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT r.id, r.item_id, r.type, r.trigger_at, r.sent_at, r.is_dismissed, i.name
		FROM reminders r
		JOIN items i ON i.id = r.item_id
		WHERE `+where+`
		ORDER BY r.trigger_at ASC, r.id ASC`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Reminder{}
	for rows.Next() {
		reminder, err := scanReminder(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, reminder)
	}
	return out, rows.Err()
}

func (s *ReminderService) MarkSent(ctx context.Context, id string, sentAt int64) (*model.Reminder, error) {
	return s.markSent(ctx, id, sentAt, true)
}

// MarkSentForDelivery is the scheduler's counterpart to MarkSent: it marks a
// reminder delivered without applying caller privacy rules.
func (s *ReminderService) MarkSentForDelivery(ctx context.Context, id string, sentAt int64) (*model.Reminder, error) {
	return s.markSent(ctx, id, sentAt, false)
}

func (s *ReminderService) markSent(ctx context.Context, id string, sentAt int64, enforcePrivacy bool) (*model.Reminder, error) {
	if enforcePrivacy {
		if err := s.ensureVisible(ctx, id); err != nil {
			return nil, err
		}
	}
	if sentAt == 0 {
		sentAt = time.Now().Unix()
	}
	res, err := s.db.ExecContext(ctx, `UPDATE reminders SET sent_at = ? WHERE id = ?`, sentAt, id)
	if err != nil {
		return nil, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return nil, ErrNotFound
	}
	return s.get(ctx, id, enforcePrivacy)
}

func (s *ReminderService) Dismiss(ctx context.Context, id string) (*model.Reminder, error) {
	if err := s.ensureVisible(ctx, id); err != nil {
		return nil, err
	}
	res, err := s.db.ExecContext(ctx, `UPDATE reminders SET is_dismissed = 1 WHERE id = ?`, id)
	if err != nil {
		return nil, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return nil, ErrNotFound
	}
	return s.Get(ctx, id)
}

func (s *ReminderService) Get(ctx context.Context, id string) (*model.Reminder, error) {
	return s.get(ctx, id, true)
}

func (s *ReminderService) get(ctx context.Context, id string, enforcePrivacy bool) (*model.Reminder, error) {
	where := "r.id = ?"
	args := []any{id}
	var err error
	if enforcePrivacy {
		where, args, err = applyItemPrivacy(ctx, s.db, "i", where, args)
		if err != nil {
			return nil, err
		}
	}
	row := s.db.QueryRowContext(ctx, `
		SELECT r.id, r.item_id, r.type, r.trigger_at, r.sent_at, r.is_dismissed, i.name
		FROM reminders r
		JOIN items i ON i.id = r.item_id
		WHERE `+where, args...)
	reminder, err := scanReminder(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return reminder, nil
}

// ensureVisible maps a reminder whose item is hidden from the caller to
// ErrNotFound, so reminder ids do not become an existence oracle.
func (s *ReminderService) ensureVisible(ctx context.Context, id string) error {
	var itemID string
	if err := s.db.QueryRowContext(ctx,
		`SELECT item_id FROM reminders WHERE id = ?`, id).Scan(&itemID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}
	visible, err := itemVisibleForCaller(ctx, s.db, itemID)
	if err != nil {
		return err
	}
	if !visible {
		return ErrNotFound
	}
	return nil
}

type reminderScanner interface {
	Scan(dest ...any) error
}

func scanReminder(row reminderScanner) (*model.Reminder, error) {
	var reminder model.Reminder
	var dismissed int
	var itemName sql.NullString
	if err := row.Scan(
		&reminder.ID, &reminder.ItemID, &reminder.Type,
		&reminder.TriggerAt, &reminder.SentAt, &dismissed, &itemName,
	); err != nil {
		return nil, err
	}
	reminder.IsDismissed = dismissed != 0
	if itemName.Valid {
		reminder.ItemName = &itemName.String
	}
	return &reminder, nil
}
