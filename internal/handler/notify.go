package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type NotifyHandler struct {
	svc *service.NotifyService
}

func NewNotifyHandler(svc *service.NotifyService) *NotifyHandler {
	return &NotifyHandler{svc: svc}
}

func (h *NotifyHandler) Mount(r chi.Router) {
	r.Post("/notify/process-due", h.processDue)
}

func (h *NotifyHandler) processDue(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Now int64 `json:"now"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		in.Now = 0
	}
	result, err := h.svc.ProcessDue(r.Context(), in.Now)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
