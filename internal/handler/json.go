package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	apperr "github.com/mahoo12138/havit/internal/errors"
)

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		slog.Error("write json", "err", err)
	}
}

func writeError(w http.ResponseWriter, status int, err error) {
	var ae *apperr.AppError
	if errors.As(err, &ae) {
		writeJSON(w, ae.Status, ae)
		return
	}
	writeJSON(w, status, &apperr.AppError{
		Code:    apperr.CodeInternal,
		Message: err.Error(),
		Status:  status,
	})
}
