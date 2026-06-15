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

func Auth(svc *service.AuthService, tokenSvc ...*service.APITokenService) func(http.Handler) http.Handler {
	var patSvc *service.APITokenService
	if len(tokenSvc) > 0 {
		patSvc = tokenSvc[0]
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tok, err := extractToken(r)
			if err != nil {
				writeJSON(w, http.StatusUnauthorized, apperr.ErrInvalidCredentials)
				return
			}

			// Try PAT first if the token has the hv_pat_ prefix.
			if patSvc != nil && strings.HasPrefix(tok, "hv_pat_") {
				userID, patErr := patSvc.Verify(tok)
				if patErr == nil {
					claims := &service.Claims{UserID: userID, Role: "member"}
					// Look up the actual role from the user record.
					if u, uErr := svc.GetUser(r.Context(), userID); uErr == nil {
						claims.Role = u.Role
					}
					ctx := context.WithValue(r.Context(), claimsKey, claims)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
				writeJSON(w, http.StatusUnauthorized, apperr.ErrInvalidCredentials)
				return
			}

			// Standard JWT flow.
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
	// Check X-API-Key header first (PAT convention).
	if apiKey := r.Header.Get("X-API-Key"); apiKey != "" {
		return apiKey, nil
	}
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
