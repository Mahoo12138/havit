package system

import (
	"context"
	"database/sql"
	"runtime"
	"sync/atomic"
)

const Version = "v0.1.0"

type State struct {
	mode       string
	db         *sql.DB
	needsSetup atomic.Bool
}

func NewState(mode string, db *sql.DB) *State {
	s := &State{mode: mode, db: db}
	s.refreshNeedsSetup(context.Background())
	return s
}

func (s *State) Mode() string         { return s.mode }
func (s *State) IsDemo() bool         { return s.mode == "demo" }
func (s *State) NeedsSetup() bool     { return s.needsSetup.Load() }
func (s *State) MarkInitialized()     { s.needsSetup.Store(false) }
func (s *State) GoVersion() string    { return runtime.Version() }

func (s *State) refreshNeedsSetup(ctx context.Context) {
	if s.IsDemo() {
		s.needsSetup.Store(false)
		return
	}
	var n int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&n); err != nil {
		s.needsSetup.Store(true)
		return
	}
	s.needsSetup.Store(n == 0)
}
