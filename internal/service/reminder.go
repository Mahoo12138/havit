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
	Now     int64
}

func (s *ReminderService) List(ctx context.Context, f ReminderListFilter) ([]*model.Reminder, error) {
	args := []any{}
	where := "1 = 1"
	if f.DueOnly {
		if f.Now == 0 {
			f.Now = time.Now().Unix()
		}
		where += " AND sent_at IS NULL AND is_dismissed = 0 AND trigger_at <= ?"
		args = append(args, f.Now)
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, type, trigger_at, sent_at, is_dismissed
		FROM reminders
		WHERE `+where+`
		ORDER BY trigger_at ASC, id ASC`, args...)
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
	return s.Get(ctx, id)
}

func (s *ReminderService) Dismiss(ctx context.Context, id string) (*model.Reminder, error) {
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
	row := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, type, trigger_at, sent_at, is_dismissed
		FROM reminders WHERE id = ?`, id)
	reminder, err := scanReminder(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return reminder, nil
}

type reminderScanner interface {
	Scan(dest ...any) error
}

func scanReminder(row reminderScanner) (*model.Reminder, error) {
	var reminder model.Reminder
	var dismissed int
	if err := row.Scan(
		&reminder.ID, &reminder.ItemID, &reminder.Type,
		&reminder.TriggerAt, &reminder.SentAt, &dismissed,
	); err != nil {
		return nil, err
	}
	reminder.IsDismissed = dismissed != 0
	return &reminder, nil
}
