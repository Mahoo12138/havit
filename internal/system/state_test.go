package system

import (
	"context"
	"database/sql"
	"path/filepath"
	"strings"
	"testing"

	"github.com/mahoo12138/havit/internal/db"
)

func newTestStateDB(t *testing.T) *sql.DB {
	t.Helper()

	database, err := db.Open("file:" + filepath.Join(t.TempDir(), "system-test.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Close()
	})

	if err := db.Migrate(database); err != nil {
		t.Fatalf("migrate db: %v", err)
	}
	return database
}

func TestNewStateNeedsSetupWhenEmpty(t *testing.T) {
	db := newTestStateDB(t)
	s := NewState("release", db)

	if !s.NeedsSetup() {
		t.Fatal("expected NeedsSetup()=true for empty DB")
	}
}

func TestNewStateNotNeedsSetupAfterMarkInitialized(t *testing.T) {
	db := newTestStateDB(t)
	s := NewState("release", db)

	s.MarkInitialized()
	if s.NeedsSetup() {
		t.Fatal("expected NeedsSetup()=false after MarkInitialized")
	}
}

func TestNewStateDemoMode(t *testing.T) {
	db := newTestStateDB(t)
	s := NewState("demo", db)

	if !s.IsDemo() {
		t.Fatal("expected IsDemo()=true for demo mode")
	}
	if s.NeedsSetup() {
		t.Fatal("expected NeedsSetup()=false in demo mode")
	}
	if s.Mode() != "demo" {
		t.Fatalf("expected mode 'demo', got %q", s.Mode())
	}
}

func TestNewStateReleaseMode(t *testing.T) {
	db := newTestStateDB(t)
	s := NewState("release", db)

	if s.IsDemo() {
		t.Fatal("expected IsDemo()=false for release mode")
	}
	if s.Mode() != "release" {
		t.Fatalf("expected mode 'release', got %q", s.Mode())
	}
}

func TestStateVersion(t *testing.T) {
	if Version == "" {
		t.Fatal("expected Version to be non-empty")
	}
	if !strings.HasPrefix(Version, "v") {
		t.Fatalf("expected Version to start with 'v', got %q", Version)
	}
}

func TestStateGoVersion(t *testing.T) {
	db := newTestStateDB(t)
	s := NewState("release", db)

	gv := s.GoVersion()
	if gv == "" {
		t.Fatal("expected GoVersion to be non-empty")
	}
}

func TestStateNotNeedsSetupWhenUsersExist(t *testing.T) {
	db := newTestStateDB(t)

	_, err := db.ExecContext(context.Background(),
		`INSERT INTO users (id, username, password, role, created_at)
		 VALUES ('test-id', 'admin', 'hash', 'owner', 1000)`)
	if err != nil {
		t.Fatalf("insert user: %v", err)
	}

	s := NewState("release", db)
	if s.NeedsSetup() {
		t.Fatal("expected NeedsSetup()=false when users exist")
	}
}

func TestStateRefreshNeedsSetup(t *testing.T) {
	db := newTestStateDB(t)
	s := NewState("release", db)

	if !s.NeedsSetup() {
		t.Fatal("expected NeedsSetup()=true at start")
	}

	s.refreshNeedsSetup(context.Background())
	if !s.NeedsSetup() {
		t.Fatal("expected NeedsSetup()=true after refresh with no users")
	}

	_, err := db.ExecContext(context.Background(),
		`INSERT INTO users (id, username, password, role, created_at)
		 VALUES ('test-id', 'admin', 'hash', 'owner', 1000)`)
	if err != nil {
		t.Fatalf("insert user: %v", err)
	}

	s.refreshNeedsSetup(context.Background())
	if s.NeedsSetup() {
		t.Fatal("expected NeedsSetup()=false after user created")
	}
}

func TestStateDBErrorMeansNeedsSetup(t *testing.T) {
	// Using a closed DB to simulate error
	db := newTestStateDB(t)
	db.Close()

	s := NewState("release", db)
	// The state should not panic; should set needsSetup to true on DB error
	if !s.NeedsSetup() {
		t.Fatal("expected NeedsSetup()=true when DB errors")
	}
}
