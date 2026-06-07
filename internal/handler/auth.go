package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
	"github.com/mahoo12138/havit/internal/system"
)

type AuthHandler struct {
	svc   *service.AuthService
	state *system.State
}

func NewAuthHandler(svc *service.AuthService, state *system.State) *AuthHandler {
	return &AuthHandler{svc: svc, state: state}
}

func (h *AuthHandler) MountPublic(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		r.Post("/setup", h.setup)
		r.Post("/login", h.login)
		r.Post("/logout", h.logout)
	})
}

func (h *AuthHandler) MountProtected(r chi.Router) {
	r.Get("/auth/me", h.me)
}

type credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AuthHandler) setup(w http.ResponseWriter, r *http.Request) {
	if !h.state.NeedsSetup() {
		writeJSON(w, http.StatusGone, map[string]string{"error": "setup already completed"})
		return
	}
	var in credentials
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	u, token, err := h.svc.Setup(r.Context(), in.Username, in.Password)
	if err != nil {
		if errors.Is(err, service.ErrSetupClosed) {
			writeJSON(w, http.StatusGone, map[string]string{"error": err.Error()})
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	setSessionCookie(w, token, h.svc)
	writeJSON(w, http.StatusCreated, map[string]any{"user": u, "token": token})
}

func (h *AuthHandler) login(w http.ResponseWriter, r *http.Request) {
	var in credentials
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	u, token, err := h.svc.Login(r.Context(), in.Username, in.Password)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}
	setSessionCookie(w, token, h.svc)
	writeJSON(w, http.StatusOK, map[string]any{"user": u, "token": token})
}

func (h *AuthHandler) logout(w http.ResponseWriter, _ *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "havit_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) me(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	u, err := h.svc.GetUser(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func setSessionCookie(w http.ResponseWriter, token string, _ *service.AuthService) {
	http.SetCookie(w, &http.Cookie{
		Name:     "havit_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}
