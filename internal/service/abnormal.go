package service

import (
	"context"
	"database/sql"
	"time"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"
)

type AbnormalService struct {
	db *sql.DB
}

func NewAbnormalService(db *sql.DB) *AbnormalService {
	return &AbnormalService{db: db}
}

type AbnormalListFilter struct {
	AbnormalType     string
	ProcessingStatus string
	Limit            int
	Offset           int
}

type AbnormalListItem struct {
	// From items
	ItemID            string           `json:"item_id"`
	Name              string           `json:"name"`
	Status            model.ItemStatus `json:"status"`
	SerialNumber      *string          `json:"serial_number,omitempty"`
	Category          *string          `json:"category,omitempty"`
	LocationID        *string          `json:"location_id,omitempty"`
	LocationName      *string          `json:"location_name,omitempty"`
	PurchasePrice     *float64         `json:"purchase_price,omitempty"`
	PurchaseCurrency  *string          `json:"purchase_currency,omitempty"`
	ExitDate          *int64           `json:"exit_date,omitempty"`
	UpdatedAt         int64            `json:"updated_at"`
	PhotoURL          *string          `json:"photo_url,omitempty"`

	// From abnormal_records
	AbnormalID            string   `json:"abnormal_id"`
	AbnormalType          string   `json:"abnormal_type"`
	ProcessingStatus      string   `json:"processing_status"`
	ProcessingNotes       *string  `json:"processing_notes,omitempty"`
	ResponsiblePerson     *string  `json:"responsible_person,omitempty"`
	EstimatedLoss         *float64 `json:"estimated_loss,omitempty"`
	EstimatedLossCurrency *string  `json:"estimated_loss_currency,omitempty"`
	RecoverableAmount     *float64 `json:"recoverable_amount,omitempty"`
	RecoverableCurrency   *string  `json:"recoverable_currency,omitempty"`
}

type AbnormalStats struct {
	Total      int `json:"total"`
	Lost       int `json:"lost"`
	Stolen     int `json:"stolen"`
	Unreturned int `json:"unreturned"`
	Damaged    int `json:"damaged"`
}

type AbnormalTrendPoint struct {
	Month string `json:"month"`
	Count int    `json:"count"`
}

type ProgressStatsItem struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

type LossValuation struct {
	TotalEstimated     float64 `json:"total_estimated"`
	EstimatedCurrency  string  `json:"estimated_currency"`
	RecoverableAmount  float64 `json:"recoverable_amount"`
	RecoverableCurrency string `json:"recoverable_currency"`
}

type UpdateProgressInput struct {
	ProcessingStatus  *string  `json:"processing_status,omitempty"`
	ProcessingNotes   *string  `json:"processing_notes,omitempty"`
	ResponsiblePerson *string  `json:"responsible_person,omitempty"`
	RecoverableAmount *float64 `json:"recoverable_amount,omitempty"`
	RecoverableCurrency *string `json:"recoverable_currency,omitempty"`
}

func (s *AbnormalService) Create(ctx context.Context, itemID, abnormalType, responsiblePerson string, estimatedLoss *float64, currency *string) (*model.AbnormalRecord, error) {
	now := time.Now().Unix()
	id := ulid.Make().String()

	initialStatus := initialProcessingStatus(abnormalType)

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO abnormal_records (
			id, item_id, abnormal_type, processing_status,
			responsible_person, estimated_loss, estimated_loss_currency,
			recoverable_amount, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
		id, itemID, abnormalType, initialStatus,
		nilIfEmpty(responsiblePerson), estimatedLoss, currency,
		now, now,
	)
	if err != nil {
		return nil, err
	}

	return &model.AbnormalRecord{
		ID:                   id,
		ItemID:               itemID,
		AbnormalType:         abnormalType,
		ProcessingStatus:     initialStatus,
		ResponsiblePerson:    nilIfEmpty(responsiblePerson),
		EstimatedLoss:        estimatedLoss,
		EstimatedLossCurrency: currency,
		CreatedAt:            now,
		UpdatedAt:            now,
	}, nil
}

func (s *AbnormalService) List(ctx context.Context, f AbnormalListFilter) ([]*AbnormalListItem, int, error) {
	where := "1=1"
	args := []any{}
	if f.AbnormalType != "" {
		where += " AND ar.abnormal_type = ?"
		args = append(args, f.AbnormalType)
	}
	if f.ProcessingStatus != "" {
		where += " AND ar.processing_status = ?"
		args = append(args, f.ProcessingStatus)
	}

	// Count total
	var total int
	countQ := "SELECT COUNT(*) FROM abnormal_records ar JOIN items i ON i.id = ar.item_id WHERE " + where
	if err := s.db.QueryRowContext(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := f.Limit
	if limit <= 0 {
		limit = 50
	}
	offset := f.Offset

	rows, err := s.db.QueryContext(ctx, `
		SELECT
			i.id, i.name, i.status, i.serial_number, i.category,
			i.location_id, i.purchase_price, i.purchase_currency,
			i.exit_date, i.updated_at,
			ar.id, ar.abnormal_type, ar.processing_status,
			ar.processing_notes, ar.responsible_person,
			ar.estimated_loss, ar.estimated_loss_currency,
			ar.recoverable_amount, ar.recoverable_currency
		FROM abnormal_records ar
		JOIN items i ON i.id = ar.item_id
		WHERE `+where+`
		ORDER BY COALESCE(i.exit_date, i.updated_at) DESC, i.name ASC
		LIMIT ? OFFSET ?`, append(args, limit, offset)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := []*AbnormalListItem{}
	for rows.Next() {
		var item AbnormalListItem
		if err := rows.Scan(
			&item.ItemID, &item.Name, &item.Status, &item.SerialNumber, &item.Category,
			&item.LocationID, &item.PurchasePrice, &item.PurchaseCurrency,
			&item.ExitDate, &item.UpdatedAt,
			&item.AbnormalID, &item.AbnormalType, &item.ProcessingStatus,
			&item.ProcessingNotes, &item.ResponsiblePerson,
			&item.EstimatedLoss, &item.EstimatedLossCurrency,
			&item.RecoverableAmount, &item.RecoverableCurrency,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, &item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	// Enrich with location names
	if err := s.enrichLocations(ctx, out); err != nil {
		return nil, 0, err
	}
	// Enrich with first photo URL
	if err := s.enrichPhotos(ctx, out); err != nil {
		return nil, 0, err
	}

	return out, total, nil
}

func (s *AbnormalService) Stats(ctx context.Context) (*AbnormalStats, error) {
	stats := &AbnormalStats{}

	rows, err := s.db.QueryContext(ctx, `
		SELECT ar.abnormal_type, COUNT(*)
		FROM abnormal_records ar
		GROUP BY ar.abnormal_type`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var t string
		var c int
		if err := rows.Scan(&t, &c); err != nil {
			return nil, err
		}
		switch t {
		case "lost":
			stats.Lost = c
		case "stolen":
			stats.Stolen = c
		case "unreturned":
			stats.Unreturned = c
		case "damaged":
			stats.Damaged = c
		}
		stats.Total += c
	}
	return stats, rows.Err()
}

func (s *AbnormalService) Trend(ctx context.Context) ([]AbnormalTrendPoint, error) {
	now := time.Now()
	points := make([]AbnormalTrendPoint, 6)
	for i := 5; i >= 0; i-- {
		t := now.AddDate(0, -i, 0)
		year := t.Year()
		month := int(t.Month())
		points[5-i] = AbnormalTrendPoint{
			Month: formatMonth(year, month),
		}

		// First day of month (inclusive)
		from := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, t.Location()).Unix()
		// First day of next month (exclusive)
		to := time.Date(year, time.Month(month+1), 1, 0, 0, 0, 0, t.Location()).Unix()

		var count int
		err := s.db.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM abnormal_records
			WHERE created_at >= ? AND created_at < ?`,
			from, to).Scan(&count)
		if err != nil {
			return nil, err
		}
		points[5-i].Count = count
	}
	return points, nil
}

func (s *AbnormalService) ProgressStats(ctx context.Context) ([]ProgressStatsItem, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT processing_status, COUNT(*)
		FROM abnormal_records
		GROUP BY processing_status
		ORDER BY COUNT(*) DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []ProgressStatsItem{}
	for rows.Next() {
		var item ProgressStatsItem
		if err := rows.Scan(&item.Status, &item.Count); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (s *AbnormalService) LossValuation(ctx context.Context) (*LossValuation, error) {
	val := &LossValuation{
		EstimatedCurrency:   "CNY",
		RecoverableCurrency: "CNY",
	}

	// Total estimated loss (use purchase_price from items as fallback)
	err := s.db.QueryRowContext(ctx, `
		SELECT
			COALESCE(SUM(COALESCE(ar.estimated_loss, i.purchase_price, 0)), 0),
			COALESCE(SUM(COALESCE(ar.recoverable_amount, 0)), 0)
		FROM abnormal_records ar
		JOIN items i ON i.id = ar.item_id`).Scan(&val.TotalEstimated, &val.RecoverableAmount)
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (s *AbnormalService) UpdateProgress(ctx context.Context, id string, in UpdateProgressInput) (*model.AbnormalRecord, error) {
	now := time.Now().Unix()
	sets := []string{}
	args := []any{}

	if in.ProcessingStatus != nil {
		sets = append(sets, "processing_status = ?")
		args = append(args, *in.ProcessingStatus)
	}
	if in.ProcessingNotes != nil {
		sets = append(sets, "processing_notes = ?")
		args = append(args, *in.ProcessingNotes)
	}
	if in.ResponsiblePerson != nil {
		sets = append(sets, "responsible_person = ?")
		args = append(args, *in.ResponsiblePerson)
	}
	if in.RecoverableAmount != nil {
		sets = append(sets, "recoverable_amount = ?")
		args = append(args, *in.RecoverableAmount)
	}
	if in.RecoverableCurrency != nil {
		sets = append(sets, "recoverable_currency = ?")
		args = append(args, *in.RecoverableCurrency)
	}

	if len(sets) == 0 {
		return s.GetByID(ctx, id)
	}

	sets = append(sets, "updated_at = ?")
	args = append(args, now, id)

	q := "UPDATE abnormal_records SET " + joinSets(sets) + " WHERE id = ?"
	res, err := s.db.ExecContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return nil, ErrNotFound
	}
	return s.GetByID(ctx, id)
}

func (s *AbnormalService) GetByID(ctx context.Context, id string) (*model.AbnormalRecord, error) {
	var r model.AbnormalRecord
	err := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, abnormal_type, processing_status,
			processing_notes, responsible_person,
			estimated_loss, estimated_loss_currency,
			recoverable_amount, recoverable_currency,
			created_at, updated_at
		FROM abnormal_records WHERE id = ?`, id).Scan(
		&r.ID, &r.ItemID, &r.AbnormalType, &r.ProcessingStatus,
		&r.ProcessingNotes, &r.ResponsiblePerson,
		&r.EstimatedLoss, &r.EstimatedLossCurrency,
		&r.RecoverableAmount, &r.RecoverableCurrency,
		&r.CreatedAt, &r.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return &r, err
}

func (s *AbnormalService) GetByItemID(ctx context.Context, itemID string) (*model.AbnormalRecord, error) {
	var r model.AbnormalRecord
	err := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, abnormal_type, processing_status,
			processing_notes, responsible_person,
			estimated_loss, estimated_loss_currency,
			recoverable_amount, recoverable_currency,
			created_at, updated_at
		FROM abnormal_records WHERE item_id = ?`, itemID).Scan(
		&r.ID, &r.ItemID, &r.AbnormalType, &r.ProcessingStatus,
		&r.ProcessingNotes, &r.ResponsiblePerson,
		&r.EstimatedLoss, &r.EstimatedLossCurrency,
		&r.RecoverableAmount, &r.RecoverableCurrency,
		&r.CreatedAt, &r.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	return &r, err
}

func (s *AbnormalService) ActiveBorrowerName(ctx context.Context, itemID string) string {
	var name string
	err := s.db.QueryRowContext(ctx, `
		SELECT borrower_name FROM loans
		WHERE item_id = ? AND status IN ('active', 'unreturned')
		ORDER BY loaned_at DESC LIMIT 1`, itemID).Scan(&name)
	if err != nil {
		return ""
	}
	return name
}

func (s *AbnormalService) enrichLocations(ctx context.Context, items []*AbnormalListItem) error {
	for _, item := range items {
		if item.LocationID == nil || *item.LocationID == "" {
			continue
		}
		var name string
		err := s.db.QueryRowContext(ctx, `SELECT name FROM locations WHERE id = ?`, *item.LocationID).Scan(&name)
		if err == nil {
			item.LocationName = &name
		}
	}
	return nil
}

func (s *AbnormalService) enrichPhotos(ctx context.Context, items []*AbnormalListItem) error {
	for _, item := range items {
		var url string
		err := s.db.QueryRowContext(ctx, `
			SELECT url FROM attachments
			WHERE item_id = ? AND type = 'photo'
			ORDER BY created_at ASC LIMIT 1`, item.ItemID).Scan(&url)
		if err == nil {
			item.PhotoURL = &url
		}
	}
	return nil
}

func initialProcessingStatus(abnormalType string) string {
	switch abnormalType {
	case "stolen":
		return "reporting"
	case "lost":
		return "searching"
	case "unreturned":
		return "pending_compensation"
	case "damaged":
		return "scrapped"
	default:
		return "pending"
	}
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func joinSets(sets []string) string {
	result := ""
	for i, s := range sets {
		if i > 0 {
			result += ", "
		}
		result += s
	}
	return result
}

func formatMonth(year, month int) string {
	months := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
	if month < 1 || month > 12 {
		return ""
	}
	return months[month-1]
}
