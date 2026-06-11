package errors

import (
	"fmt"
	"net/http"
)

// AppError is a structured error with a machine-readable code.
type AppError struct {
	Code    string `json:"error"`
	Message string `json:"message"`
	Status  int    `json:"-"`
}

func (e *AppError) Error() string { return e.Code }

// New creates a new AppError with the given code, message, and HTTP status.
func New(code, message string, status int) *AppError {
	return &AppError{Code: code, Message: message, Status: status}
}

// Error code constants. These are stable identifiers returned to the client.
const (
	CodeNotFound            = "not_found"
	CodeInvalidItemType     = "invalid_item_type"
	CodeInvalidItemStatus   = "invalid_item_status"
	CodeInvalidLocationType = "invalid_location_type"
	CodeLocationHierarchy   = "location_hierarchy"
	CodeSetupClosed         = "setup_closed"
	CodeUserExists          = "user_exists"
	CodeInvalidCredentials  = "invalid_credentials"
	CodeAISourceProtected   = "ai_source_protected"
	CodeValidationFailed    = "validation_failed"
	CodeFileRequired        = "file_required"
	CodeImageRequired       = "image_required"
	CodeUnsupportedFormat   = "unsupported_format"
	CodeInternal            = "internal_error"
)

// Sentinel errors for common cases.
var (
	ErrNotFound = New(CodeNotFound, "Resource not found", http.StatusNotFound)

	ErrInvalidItemType = New(CodeInvalidItemType, "Invalid item type", http.StatusBadRequest)

	ErrInvalidItemStatus = New(CodeInvalidItemStatus, "Invalid item status", http.StatusBadRequest)

	ErrInvalidLocationType = New(CodeInvalidLocationType, "Invalid location type", http.StatusBadRequest)

	ErrLocationHierarchy = New(CodeLocationHierarchy, "Location hierarchy violation", http.StatusBadRequest)

	ErrSetupClosed = New(CodeSetupClosed, "Setup already completed", http.StatusGone)

	ErrUserExists = New(CodeUserExists, "User already exists", http.StatusBadRequest)

	ErrInvalidCredentials = New(CodeInvalidCredentials, "Invalid username or password", http.StatusUnauthorized)

	ErrAISourceProtected = New(CodeAISourceProtected, "AI source attachment cannot be deleted", http.StatusForbidden)

	ErrFileRequired = New(CodeFileRequired, "File is required", http.StatusBadRequest)

	ErrImageRequired = New(CodeImageRequired, "Photo must be an image", http.StatusBadRequest)

	ErrUnsupportedFormat = New(CodeUnsupportedFormat, "Unsupported format", http.StatusBadRequest)

	ErrValidationFailed = New(CodeValidationFailed, "Validation failed", http.StatusBadRequest)

	ErrInternal = New(CodeInternal, "Internal server error", http.StatusInternalServerError)
)

// Wrap creates a new AppError wrapping an existing error with an additional code.
// The original error message is preserved in the returned AppError.
func Wrap(code string, status int, err error) *AppError {
	return &AppError{Code: code, Message: err.Error(), Status: status}
}

// Wrapf creates a new AppError with a formatted message.
func Wrapf(code string, status int, format string, args ...any) *AppError {
	return &AppError{Code: code, Message: fmt.Sprintf(format, args...), Status: status}
}
