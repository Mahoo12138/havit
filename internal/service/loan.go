package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"time"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"
)

type LoanService struct {
	db       *sql.DB
	abnormal *AbnormalService
}

func NewLoanService(db *sql.DB, abnormal *AbnormalService) *LoanService {
	return &LoanService{db: db, abnormal: abnormal}
}

type LoanCreateInput struct {
	BorrowerName    string  `json:"borrower_name"`
	BorrowerContact *string `json:"borrower_contact,omitempty"`
	LoanedAt        int64   `json:"loaned_at,omitempty"`
	DueAt           *int64  `json:"due_at,omitempty"`
	Notes           *string `json:"notes,omitempty"`
}

type LoanReturnInput struct {
	ReturnedAt int64 `json:"returned_at,omitempty"`
}

type LoanUnreturnedInput struct {
	Compensation         *float64 `json:"compensation,omitempty"`
	CompensationCurrency *string  `json:"compensation_currency,omitempty"`
	Notes                *string  `json:"notes,omitempty"`
}

func (s *LoanService) Create(ctx context.Context, itemID string, in LoanCreateInput) (*model.Loan, error) {
	if in.BorrowerName == "" {
		return nil, errors.New("borrower_name required")
	}

	now := time.Now().Unix()
	if in.LoanedAt == 0 {
		in.LoanedAt = now
	}
	id := ulid.Make().String()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	res, err := tx.ExecContext(ctx, `
		UPDATE items SET status = ?, updated_at = ?
		WHERE id = ?`,
		model.StatusBorrowed, now, itemID,
	)
	if err != nil {
		return nil, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return nil, ErrNotFound
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO loans (
			id, item_id, borrower_name, borrower_contact,
			loaned_at, due_at, status, notes
		) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
		id, itemID, in.BorrowerName, in.BorrowerContact,
		in.LoanedAt, in.DueAt, in.Notes,
	); err != nil {
		return nil, err
	}

	if in.DueAt != nil {
		reminderID := ulid.Make().String()
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO reminders (id, item_id, type, trigger_at, is_dismissed)
			VALUES (?, ?, 'loan_due', ?, 0)`,
			reminderID, itemID, *in.DueAt,
		); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	s.logLoanEvent(ctx, itemID, "loan_started", jsonPayload(map[string]any{
		"loan_id":       id,
		"borrower_name": in.BorrowerName,
		"due_at":        in.DueAt,
	}))
	return s.Get(ctx, id)
}

func (s *LoanService) ListForItem(ctx context.Context, itemID string) ([]*model.Loan, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, borrower_name, borrower_contact,
			loaned_at, due_at, returned_at, status,
			compensation, compensation_currency, notes
		FROM loans
		WHERE item_id = ?
		ORDER BY loaned_at DESC, id DESC`, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Loan{}
	for rows.Next() {
		loan, err := scanLoan(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, loan)
	}
	return out, rows.Err()
}

func (s *LoanService) Get(ctx context.Context, id string) (*model.Loan, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, borrower_name, borrower_contact,
			loaned_at, due_at, returned_at, status,
			compensation, compensation_currency, notes
		FROM loans
		WHERE id = ?`, id)
	loan, err := scanLoan(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return loan, nil
}

func (s *LoanService) Return(ctx context.Context, id string, in LoanReturnInput) (*model.Loan, error) {
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	now := time.Now().Unix()
	if in.ReturnedAt == 0 {
		in.ReturnedAt = now
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `
		UPDATE loans SET returned_at = ?, status = 'returned'
		WHERE id = ?`,
		in.ReturnedAt, id,
	); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, `
		UPDATE items SET status = ?, updated_at = ?
		WHERE id = ?`,
		model.StatusInStock, now, cur.ItemID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	s.logLoanEvent(ctx, cur.ItemID, "loan_returned", jsonPayload(map[string]any{
		"loan_id":     id,
		"returned_at": in.ReturnedAt,
	}))
	return s.Get(ctx, id)
}

func (s *LoanService) MarkUnreturned(ctx context.Context, id string, in LoanUnreturnedInput) (*model.Loan, error) {
	cur, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	now := time.Now().Unix()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `
		UPDATE loans SET
			status = 'unreturned',
			compensation = ?,
			compensation_currency = ?,
			notes = ?
		WHERE id = ?`,
		in.Compensation, in.CompensationCurrency, in.Notes, id,
	); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, `
		UPDATE items SET status = ?, updated_at = ?
		WHERE id = ?`,
		model.StatusUnreturned, now, cur.ItemID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Liability settlement must land in the abnormal module and stay on the
	// item's permanent lifecycle log (product design 3.7).
	if s.abnormal != nil {
		if _, err := s.abnormal.UpsertFromLoan(ctx, cur.ItemID, "unreturned", cur.BorrowerName, in.Compensation, in.CompensationCurrency); err != nil {
			return nil, err
		}
	}
	s.logLoanEvent(ctx, cur.ItemID, "loan_unreturned", jsonPayload(map[string]any{
		"loan_id":               id,
		"borrower_name":         cur.BorrowerName,
		"compensation":          in.Compensation,
		"compensation_currency": in.CompensationCurrency,
		"notes":                 in.Notes,
	}))
	return s.Get(ctx, id)
}

// logLoanEvent writes a permanent entry on the item's lifecycle log. Failures
// are logged but do not fail the loan operation itself.
func (s *LoanService) logLoanEvent(ctx context.Context, itemID, eventType string, payload *string) {
	eventID := ulid.Make().String()
	if _, err := s.db.ExecContext(ctx,
		`INSERT INTO item_events (id, item_id, event_type, payload, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
		eventID, itemID, eventType, payload, time.Now().Unix(),
	); err != nil {
		slog.Error("log loan event", "item", itemID, "type", eventType, "err", err)
	}
}

func jsonPayload(v any) *string {
	raw, err := json.Marshal(v)
	if err != nil {
		return nil
	}
	s := string(raw)
	return &s
}

type loanScanner interface {
	Scan(dest ...any) error
}

func scanLoan(row loanScanner) (*model.Loan, error) {
	var loan model.Loan
	if err := row.Scan(
		&loan.ID, &loan.ItemID, &loan.BorrowerName, &loan.BorrowerContact,
		&loan.LoanedAt, &loan.DueAt, &loan.ReturnedAt, &loan.Status,
		&loan.Compensation, &loan.CompensationCurrency, &loan.Notes,
	); err != nil {
		return nil, err
	}
	return &loan, nil
}
