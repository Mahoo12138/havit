package handler

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"

	apperr "github.com/mahoo12138/havit/internal/errors"
	"github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
	"github.com/mahoo12138/havit/internal/system"
)

type AuthHandler struct {
	svc          *service.AuthService
	state        *system.State
	loginLimiter *loginLimiter
}

func NewAuthHandler(svc *service.AuthService, state *system.State) *AuthHandler {
	return &AuthHandler{svc: svc, state: state, loginLimiter: newLoginLimiter(10, 15*time.Minute)}
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
	r.Patch("/auth/me", h.updateProfile)
	r.Post("/auth/me/password", h.changePassword)
}

type credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type updateProfileInput struct {
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Bio      string `json:"bio"`
	Avatar   string `json:"avatar"`
}

type changePasswordInput struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h *AuthHandler) setup(w http.ResponseWriter, r *http.Request) {
	if !h.state.NeedsSetup() {
		writeError(w, 0, apperr.ErrSetupClosed)
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
			writeError(w, 0, err)
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	setSessionCookie(w, r, token, h.svc)
	writeJSON(w, http.StatusCreated, map[string]any{"user": u, "token": token})
}

func (h *AuthHandler) login(w http.ResponseWriter, r *http.Request) {
	var in credentials
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	limiterKey := loginLimiterKey(r, in.Username)
	if !h.loginLimiter.Allow(limiterKey) {
		w.Header().Set("Retry-After", "900")
		writeError(w, http.StatusTooManyRequests, apperr.ErrRateLimited)
		return
	}
	u, token, err := h.svc.Login(r.Context(), in.Username, in.Password)
	if err != nil {
		h.loginLimiter.Fail(limiterKey)
		writeError(w, 0, apperr.ErrInvalidCredentials)
		return
	}
	h.loginLimiter.Reset(limiterKey)
	setSessionCookie(w, r, token, h.svc)
	writeJSON(w, http.StatusOK, map[string]any{"user": u, "token": token})
}

func (h *AuthHandler) logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "havit_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   isSecureRequest(r),
		SameSite: http.SameSiteLaxMode,
	})
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) me(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(w, r)
	if !ok {
		return
	}
	u, err := h.svc.GetUser(r.Context(), userID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, 0, apperr.New(apperr.CodeInternal, "unauthorized", http.StatusUnauthorized))
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func (h *AuthHandler) updateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(w, r)
	if !ok {
		return
	}
	var in updateProfileInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	u, err := h.svc.UpdateProfile(r.Context(), userID, service.ProfileInput{
		Nickname: in.Nickname,
		Email:    in.Email,
		Bio:      in.Bio,
		Avatar:   in.Avatar,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func (h *AuthHandler) changePassword(w http.ResponseWriter, r *http.Request) {
	userID, ok := currentUserID(w, r)
	if !ok {
		return
	}
	var in changePasswordInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	token, err := h.svc.ChangePassword(r.Context(), userID, in.CurrentPassword, in.NewPassword)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	setSessionCookie(w, r, token, h.svc)
	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func currentUserID(w http.ResponseWriter, r *http.Request) (string, bool) {
	claims, ok := middleware.ClaimsFrom(r.Context())
	if !ok {
		writeError(w, 0, apperr.New(apperr.CodeInternal, "unauthorized", http.StatusUnauthorized))
		return "", false
	}
	return claims.UserID, true
}

func setSessionCookie(w http.ResponseWriter, r *http.Request, token string, _ *service.AuthService) {
	http.SetCookie(w, &http.Cookie{
		Name:     "havit_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		HttpOnly: true,
		Secure:   isSecureRequest(r),
		SameSite: http.SameSiteLaxMode,
	})
}

func isSecureRequest(r *http.Request) bool {
	return r.TLS != nil || strings.EqualFold(strings.TrimSpace(r.Header.Get("X-Forwarded-Proto")), "https")
}

type loginAttempt struct {
	failures int
	first    time.Time
}

type loginLimiter struct {
	mu       sync.Mutex
	limit    int
	window   time.Duration
	attempts map[string]loginAttempt
}

func newLoginLimiter(limit int, window time.Duration) *loginLimiter {
	return &loginLimiter{limit: limit, window: window, attempts: map[string]loginAttempt{}}
}

func (l *loginLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	attempt, ok := l.attempts[key]
	if !ok {
		return true
	}
	if time.Since(attempt.first) >= l.window {
		delete(l.attempts, key)
		return true
	}
	return attempt.failures < l.limit
}

func (l *loginLimiter) Fail(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	if len(l.attempts) > 4096 {
		for candidate, attempt := range l.attempts {
			if now.Sub(attempt.first) >= l.window {
				delete(l.attempts, candidate)
			}
		}
	}
	attempt, ok := l.attempts[key]
	if !ok || now.Sub(attempt.first) >= l.window {
		l.attempts[key] = loginAttempt{failures: 1, first: now}
		return
	}
	attempt.failures++
	l.attempts[key] = attempt
}

func (l *loginLimiter) Reset(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.attempts, key)
}

func loginLimiterKey(r *http.Request, username string) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	return strings.ToLower(strings.TrimSpace(host)) + "|" + strings.ToLower(strings.TrimSpace(username))
}
