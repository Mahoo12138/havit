package service

import (
	"context"
	"database/sql"
	"time"
)

// UserPreferences holds all per-user settings.
type UserPreferences struct {
	UserID                string `json:"user_id"`
	Theme                 string `json:"theme"`
	DefaultCurrency       string `json:"default_currency"`
	DateFormat            string `json:"date_format"`
	HomeView              string `json:"home_view"`
	ScanBehavior          string `json:"scan_behavior"`
	DefaultVisibility     string `json:"default_visibility"`
	PersonalBarkKey       string `json:"personal_bark_key,omitempty"`
	PersonalNtfyTopic     string `json:"personal_ntfy_topic,omitempty"`
	ShowArchivedInSearch  bool   `json:"show_archived_in_search"`
}

// PreferencesService manages user_preferences rows.
type PreferencesService struct {
	db *sql.DB
}

func NewPreferencesService(db *sql.DB) *PreferencesService {
	return &PreferencesService{db: db}
}

// Get returns the preferences for userID, creating a default row if none exists.
func (s *PreferencesService) Get(ctx context.Context, userID string) (*UserPreferences, error) {
	p := &UserPreferences{UserID: userID}
	err := s.db.QueryRowContext(ctx, `
		SELECT theme, default_currency, date_format, home_view, scan_behavior,
		       default_visibility, COALESCE(personal_bark_key,''), COALESCE(personal_ntfy_topic,''),
		       show_archived_in_search
		FROM user_preferences WHERE user_id = ?`, userID).
		Scan(&p.Theme, &p.DefaultCurrency, &p.DateFormat, &p.HomeView, &p.ScanBehavior,
			&p.DefaultVisibility, &p.PersonalBarkKey, &p.PersonalNtfyTopic, &p.ShowArchivedInSearch)
	if err == sql.ErrNoRows {
		return s.createDefaults(ctx, userID)
	}
	return p, err
}

// Update applies a partial update to user's preferences and returns the updated record.
func (s *PreferencesService) Update(ctx context.Context, userID string, in *UserPreferences) (*UserPreferences, error) {
	now := time.Now().Unix()
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO user_preferences
		  (user_id, theme, default_currency, date_format, home_view, scan_behavior,
		   default_visibility, personal_bark_key, personal_ntfy_topic,
		   show_archived_in_search, updated_at)
		VALUES (?,?,?,?,?,?,?,?,?,?,?)
		ON CONFLICT(user_id) DO UPDATE SET
		  theme                   = excluded.theme,
		  default_currency        = excluded.default_currency,
		  date_format             = excluded.date_format,
		  home_view               = excluded.home_view,
		  scan_behavior           = excluded.scan_behavior,
		  default_visibility      = excluded.default_visibility,
		  personal_bark_key       = excluded.personal_bark_key,
		  personal_ntfy_topic     = excluded.personal_ntfy_topic,
		  show_archived_in_search = excluded.show_archived_in_search,
		  updated_at              = excluded.updated_at`,
		userID, in.Theme, in.DefaultCurrency, in.DateFormat, in.HomeView, in.ScanBehavior,
		in.DefaultVisibility, in.PersonalBarkKey, in.PersonalNtfyTopic,
		boolToInt(in.ShowArchivedInSearch), now,
	)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, userID)
}

func (s *PreferencesService) createDefaults(ctx context.Context, userID string) (*UserPreferences, error) {
	p := &UserPreferences{
		UserID:            userID,
		Theme:             "system",
		DefaultCurrency:   "CNY",
		DateFormat:        "relative",
		HomeView:          "spaces",
		ScanBehavior:      "confirm",
		DefaultVisibility: "shared",
	}
	_, err := s.db.ExecContext(ctx, `
		INSERT OR IGNORE INTO user_preferences
		  (user_id, theme, default_currency, date_format, home_view, scan_behavior,
		   default_visibility, show_archived_in_search, updated_at)
		VALUES (?,?,?,?,?,?,?,0,?)`,
		userID, p.Theme, p.DefaultCurrency, p.DateFormat, p.HomeView,
		p.ScanBehavior, p.DefaultVisibility, time.Now().Unix(),
	)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
