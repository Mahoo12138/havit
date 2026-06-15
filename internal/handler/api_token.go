package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
)

type APITokenHandler struct {
	svc *service.APITokenService
}

func NewAPITokenHandler(svc *service.APITokenService) *APITokenHandler {
	return &APITokenHandler{svc: svc}
}

func (h *APITokenHandler) Mount(r chi.Router) {
	r.Route("/api-tokens", func(r chi.Router) {
		r.Get("/", h.list)
		r.Post("/", h.create)
		r.Delete("/{id}", h.revoke)
		r.Post("/revoke-all-sessions", h.revokeAllSessions)
	})
}

func (h *APITokenHandler) list(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("unauthorized"))
		return
	}
	tokens, err := h.svc.List(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tokens == nil {
		tokens = []*service.APIToken{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"tokens": tokens})
}

type createTokenRequest struct {
	Name      string `json:"name"`
	ExpiresAt *int64 `json:"expires_at,omitempty"`
}

func (h *APITokenHandler) create(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("unauthorized"))
		return
	}
	var in createTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	created, err := h.svc.Create(r.Context(), claims.UserID, in.Name, in.ExpiresAt)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (h *APITokenHandler) revoke(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("unauthorized"))
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.Revoke(r.Context(), id, claims.UserID); err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *APITokenHandler) revokeAllSessions(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("unauthorized"))
		return
	}
	if err := h.svc.BumpTokenVersion(r.Context(), claims.UserID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
