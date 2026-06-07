package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/system"
)

type SystemHandler struct {
	state *system.State
}

func NewSystemHandler(state *system.State) *SystemHandler {
	return &SystemHandler{state: state}
}

func (h *SystemHandler) Mount(r chi.Router) {
	r.Get("/system/status", h.status)
}

func (h *SystemHandler) status(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"mode":        h.state.Mode(),
		"needs_setup": h.state.NeedsSetup(),
		"version":     system.Version,
	})
}
