package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
)

type PreferencesHandler struct {
	svc *service.PreferencesService
}

func NewPreferencesHandler(svc *service.PreferencesService) *PreferencesHandler {
	return &PreferencesHandler{svc: svc}
}

func (h *PreferencesHandler) Mount(r chi.Router) {
	r.Route("/preferences", func(r chi.Router) {
		r.Get("/", h.get)
		r.Patch("/", h.update)
	})
}

func (h *PreferencesHandler) get(w http.ResponseWriter, r *http.Request) {
	claims, _ := middleware.ClaimsFrom(r.Context())
	prefs, err := h.svc.Get(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, prefs)
}

func (h *PreferencesHandler) update(w http.ResponseWriter, r *http.Request) {
	claims, _ := middleware.ClaimsFrom(r.Context())

	// Decode into current prefs first so unset fields keep existing values.
	current, err := h.svc.Get(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(current); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	current.UserID = claims.UserID

	updated, err := h.svc.Update(r.Context(), claims.UserID, current)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}
