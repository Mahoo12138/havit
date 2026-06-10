package handler

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type ReminderHandler struct {
	svc *service.ReminderService
}

func NewReminderHandler(svc *service.ReminderService) *ReminderHandler {
	return &ReminderHandler{svc: svc}
}

func (h *ReminderHandler) Mount(r chi.Router) {
	r.Get("/reminders", h.list)
	r.Post("/reminders/{id}/sent", h.markSent)
	r.Post("/reminders/{id}/dismiss", h.dismiss)
}

func (h *ReminderHandler) list(w http.ResponseWriter, r *http.Request) {
	dueOnly := r.URL.Query().Get("due_only") == "true"
	reminders, err := h.svc.List(r.Context(), service.ReminderListFilter{DueOnly: dueOnly})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"reminders": reminders})
}

func (h *ReminderHandler) markSent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in struct {
		SentAt int64 `json:"sent_at"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil && !errors.Is(err, io.EOF) {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	reminder, err := h.svc.MarkSent(r.Context(), id, in.SentAt)
	if err != nil {
		h.writeReminderError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, reminder)
}

func (h *ReminderHandler) dismiss(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	reminder, err := h.svc.Dismiss(r.Context(), id)
	if err != nil {
		h.writeReminderError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, reminder)
}

func (h *ReminderHandler) writeReminderError(w http.ResponseWriter, err error) {
	if errors.Is(err, service.ErrNotFound) {
		writeError(w, http.StatusNotFound, err)
		return
	}
	writeError(w, http.StatusBadRequest, err)
}
