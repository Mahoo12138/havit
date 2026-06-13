package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	apperr "github.com/mahoo12138/havit/internal/errors"
	"github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
)

type UserHandler struct {
	svc *service.AuthService
}

func NewUserHandler(svc *service.AuthService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) Mount(r chi.Router) {
	r.Route("/users", func(r chi.Router) {
		r.Get("/", h.list)
		r.Post("/", h.create)
		r.Delete("/{id}", h.delete)
		r.Patch("/{id}/role", h.updateRole)
	})
}

func (h *UserHandler) list(w http.ResponseWriter, r *http.Request) {
	users, err := h.svc.ListUsers(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if users == nil {
		users = []*service.User{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": users})
}

func (h *UserHandler) create(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	u, err := h.svc.CreateMember(r.Context(), body.Username, body.Password)
	if err != nil {
		if errors.Is(err, service.ErrUserExists) {
			writeError(w, 0, apperr.ErrUserExists)
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusCreated, u)
}

func (h *UserHandler) delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims, _ := middleware.ClaimsFrom(r.Context())
	if err := h.svc.DeleteUser(r.Context(), id, claims.UserID); err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, 0, apperr.ErrNotFound)
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *UserHandler) updateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	claims, _ := middleware.ClaimsFrom(r.Context())
	u, err := h.svc.UpdateRole(r.Context(), id, body.Role, claims.UserID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, 0, apperr.ErrNotFound)
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}
