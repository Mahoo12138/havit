package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/mahoo12138/havit/internal/service"
)

type ctxKey string

const claimsKey ctxKey = "claims"

func Auth(svc *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tok, err := extractToken(r)
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			claims, err := svc.Verify(tok)
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
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
