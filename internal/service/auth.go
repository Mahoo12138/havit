package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/oklog/ulid/v2"
	"golang.org/x/crypto/bcrypt"

	apperr "github.com/mahoo12138/havit/internal/errors"
)

var (
	ErrInvalidCredentials = apperr.ErrInvalidCredentials
	ErrSetupClosed        = apperr.ErrSetupClosed
	ErrUserExists         = apperr.ErrUserExists
)

type AuthService struct {
	db                *sql.DB
	jwtSecret         []byte
	sessionExpire     time.Duration
	demoMode          bool
	onOwnerCreated    func()
}

func NewAuthService(db *sql.DB, jwtSecret string, expireHours int, demoMode bool, onOwnerCreated func()) *AuthService {
	if expireHours <= 0 {
		expireHours = 720
	}
	return &AuthService{
		db:             db,
		jwtSecret:      []byte(jwtSecret),
		sessionExpire:  time.Duration(expireHours) * time.Hour,
		demoMode:       demoMode,
		onOwnerCreated: onOwnerCreated,
	}
}

type User struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	CreatedAt int64  `json:"created_at"`
}

type Claims struct {
	UserID string `json:"uid"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func (s *AuthService) Setup(ctx context.Context, username, password string) (*User, string, error) {
	if s.demoMode {
		return nil, "", ErrSetupClosed
	}
	if username == "" || password == "" {
		return nil, "", errors.New("username and password required")
	}

	var count int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&count); err != nil {
		return nil, "", err
	}
	if count > 0 {
		return nil, "", ErrSetupClosed
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", fmt.Errorf("hash: %w", err)
	}

	id := ulid.Make().String()
	now := time.Now().Unix()
	if _, err := s.db.ExecContext(ctx,
		`INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, 'owner', ?)`,
		id, username, string(hash), now,
	); err != nil {
		return nil, "", fmt.Errorf("insert: %w", err)
	}

	u := &User{ID: id, Username: username, Role: "owner", CreatedAt: now}
	token, err := s.issueToken(u)
	if err != nil {
		return nil, "", err
	}
	if s.onOwnerCreated != nil {
		s.onOwnerCreated()
	}
	return u, token, nil
}

func (s *AuthService) Login(ctx context.Context, username, password string) (*User, string, error) {
	var id, hash, role string
	var createdAt int64
	err := s.db.QueryRowContext(ctx,
		`SELECT id, password, role, created_at FROM users WHERE username = ?`,
		username,
	).Scan(&id, &hash, &role, &createdAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}
	u := &User{ID: id, Username: username, Role: role, CreatedAt: createdAt}
	token, err := s.issueToken(u)
	if err != nil {
		return nil, "", err
	}
	return u, token, nil
}

func (s *AuthService) GetUser(ctx context.Context, id string) (*User, error) {
	var u User
	err := s.db.QueryRowContext(ctx,
		`SELECT id, username, role, created_at FROM users WHERE id = ?`, id,
	).Scan(&u.ID, &u.Username, &u.Role, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (s *AuthService) issueToken(u *User) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID: u.ID,
		Role:   u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.sessionExpire)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString(s.jwtSecret)
}

func (s *AuthService) Verify(tokenStr string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
