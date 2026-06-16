package errors

import (
	"errors"
	"net/http"
	"testing"
)

func TestAppErrorImplementsError(t *testing.T) {
	var err error = ErrNotFound
	if err.Error() != CodeNotFound {
		t.Fatalf("expected %q, got %q", CodeNotFound, err.Error())
	}
}

func TestNewCreatesAppError(t *testing.T) {
	e := New("test_code", "test message", http.StatusTeapot)
	if e.Code != "test_code" {
		t.Fatalf("expected test_code, got %q", e.Code)
	}
	if e.Message != "test message" {
		t.Fatalf("expected 'test message', got %q", e.Message)
	}
	if e.Status != http.StatusTeapot {
		t.Fatalf("expected 418, got %d", e.Status)
	}
}

func TestWrapPreservesOriginalMessage(t *testing.T) {
	original := errors.New("original error")
	e := Wrap(CodeValidationFailed, http.StatusBadRequest, original)
	if e.Code != CodeValidationFailed {
		t.Fatalf("expected %q, got %q", CodeValidationFailed, e.Code)
	}
	if e.Message != "original error" {
		t.Fatalf("expected 'original error', got %q", e.Message)
	}
	if e.Status != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", e.Status)
	}
}

func TestWrapfFormatsMessage(t *testing.T) {
	e := Wrapf(CodeNotFound, http.StatusNotFound, "item %s not found in %s", "abc123", "storage")
	if e.Code != CodeNotFound {
		t.Fatalf("expected %q, got %q", CodeNotFound, e.Code)
	}
	if e.Message != "item abc123 not found in storage" {
		t.Fatalf("expected formatted message, got %q", e.Message)
	}
	if e.Status != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", e.Status)
	}
}

func TestSentinelErrorCodes(t *testing.T) {
	tests := []struct {
		err    *AppError
		code   string
		status int
	}{
		{ErrNotFound, CodeNotFound, http.StatusNotFound},
		{ErrInvalidItemType, CodeInvalidItemType, http.StatusBadRequest},
		{ErrInvalidItemStatus, CodeInvalidItemStatus, http.StatusBadRequest},
		{ErrInvalidLocationType, CodeInvalidLocationType, http.StatusBadRequest},
		{ErrLocationHierarchy, CodeLocationHierarchy, http.StatusBadRequest},
		{ErrSetupClosed, CodeSetupClosed, http.StatusGone},
		{ErrUserExists, CodeUserExists, http.StatusBadRequest},
		{ErrInvalidCredentials, CodeInvalidCredentials, http.StatusUnauthorized},
		{ErrSessionExpired, CodeSessionExpired, http.StatusUnauthorized},
		{ErrAISourceProtected, CodeAISourceProtected, http.StatusForbidden},
		{ErrFileRequired, CodeFileRequired, http.StatusBadRequest},
		{ErrImageRequired, CodeImageRequired, http.StatusBadRequest},
		{ErrUnsupportedFormat, CodeUnsupportedFormat, http.StatusBadRequest},
		{ErrValidationFailed, CodeValidationFailed, http.StatusBadRequest},
		{ErrInternal, CodeInternal, http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.code, func(t *testing.T) {
			if tt.err.Code != tt.code {
				t.Errorf("code: expected %q, got %q", tt.code, tt.err.Code)
			}
			if tt.err.Status != tt.status {
				t.Errorf("status for %q: expected %d, got %d", tt.code, tt.status, tt.err.Status)
			}
			if tt.err.Message == "" {
				t.Errorf("message for %q should not be empty", tt.code)
			}
		})
	}
}

func TestErrorsIsWorksWithAppError(t *testing.T) {
	if !errors.Is(ErrNotFound, ErrNotFound) {
		t.Fatal("errors.Is should match same sentinel")
	}
}

func TestAppErrorSerialization(t *testing.T) {
	e := New(CodeNotFound, "Resource not found", http.StatusNotFound)
	got := e.Error()
	if got != CodeNotFound {
		t.Fatalf("Error() should return the code, got %q", got)
	}
}
