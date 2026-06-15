package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type AbnormalHandler struct {
	svc *service.AbnormalService
}

func NewAbnormalHandler(svc *service.AbnormalService) *AbnormalHandler {
	return &AbnormalHandler{svc: svc}
}

func (h *AbnormalHandler) Mount(r chi.Router) {
	r.Route("/abnormal", func(r chi.Router) {
		r.Get("/", h.list)
		r.Get("/stats", h.stats)
		r.Get("/trend", h.trend)
		r.Get("/progress", h.progressStats)
		r.Get("/valuation", h.lossValuation)
		r.Get("/{id}", h.getByID)
		r.Patch("/{id}", h.updateProgress)
	})
}

func (h *AbnormalHandler) list(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	items, total, err := h.svc.List(r.Context(), service.AbnormalListFilter{
		AbnormalType:     q.Get("type"),
		ProcessingStatus: q.Get("status"),
		Limit:            limit,
		Offset:           offset,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"items": items,
		"total": total,
	})
}

func (h *AbnormalHandler) stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.Stats(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *AbnormalHandler) trend(w http.ResponseWriter, r *http.Request) {
	points, err := h.svc.Trend(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"trend": points})
}

func (h *AbnormalHandler) progressStats(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.ProgressStats(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"progress": items})
}

func (h *AbnormalHandler) lossValuation(w http.ResponseWriter, r *http.Request) {
	val, err := h.svc.LossValuation(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, val)
}

func (h *AbnormalHandler) getByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	record, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, record)
}

func (h *AbnormalHandler) updateProgress(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in service.UpdateProgressInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	record, err := h.svc.UpdateProgress(r.Context(), id, in)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, record)
}
