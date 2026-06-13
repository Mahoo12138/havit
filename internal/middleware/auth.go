package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	apperr "github.com/mahoo12138/havit/internal/errors"
	"github.com/mahoo12138/havit/internal/service"
)

type ctxKey string

const claimsKey ctxKey = "claims"

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func Auth(svc *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tok, err := extractToken(r)
			if err != nil {
				writeJSON(w, http.StatusUnauthorized, apperr.ErrInvalidCredentials)
				return
			}
			claims, err := svc.Verify(tok)
			if err != nil {
				writeJSON(w, http.StatusUnauthorized, apperr.ErrInvalidCredentials)
				return
			}
			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireOwner(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := ClaimsFrom(r.Context())
		if !ok || claims.Role != "owner" {
			writeJSON(w, http.StatusForbidden, apperr.ErrForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func ClaimsFrom(ctx context.Context) (*service.Claims, bool) {
	c, ok := ctx.Value(claimsKey).(*service.Claims)
	return c, ok
}

func extractToken(r *http.Request) (string, error) {
	h := r.Header.Get("Authorization")
	if h != "" {
		if !strings.HasPrefix(h, "Bearer ") {
			return "", errors.New("bad auth header")
		}
		return strings.TrimPrefix(h, "Bearer "), nil
	}
	if c, err := r.Cookie("havit_token"); err == nil {
		return c.Value, nil
	}
	return "", errors.New("missing token")
}
