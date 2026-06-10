package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"
)

type LoanService struct {
	db *sql.DB
}

func NewLoanService(db *sql.DB) *LoanService {
	return &LoanService{db: db}
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
	return s.Get(ctx, id)
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
