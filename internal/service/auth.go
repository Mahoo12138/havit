package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"net/mail"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

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
	db             *sql.DB
	jwtSecret      []byte
	sessionExpire  time.Duration
	demoMode       bool
	onOwnerCreated func()
	setupMu        sync.Mutex
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
	Nickname  string `json:"nickname"`
	Email     string `json:"email"`
	Bio       string `json:"bio"`
	Avatar    string `json:"avatar"`
	Role      string `json:"role"`
	CreatedAt int64  `json:"created_at"`
}

// ProfileInput carries the self-service editable user fields. The login
// username is deliberately not editable.
type ProfileInput struct {
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Bio      string `json:"bio"`
	Avatar   string `json:"avatar"`
}

type Claims struct {
	UserID       string `json:"uid"`
	Role         string `json:"role"`
	TokenVersion int    `json:"tv"`
	jwt.RegisteredClaims
}

func (s *AuthService) Setup(ctx context.Context, username, password string) (*User, string, error) {
	s.setupMu.Lock()
	defer s.setupMu.Unlock()

	if s.demoMode {
		return nil, "", ErrSetupClosed
	}
	username = strings.TrimSpace(username)
	if err := validateCredentials(username, password); err != nil {
		return nil, "", err
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
	var id, hash, role, nickname, email, bio, avatar string
	var createdAt int64
	err := s.db.QueryRowContext(ctx,
		`SELECT id, password, role, created_at, nickname, email, bio, avatar FROM users WHERE username = ?`,
		username,
	).Scan(&id, &hash, &role, &createdAt, &nickname, &email, &bio, &avatar)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}
	u := &User{
		ID:        id,
		Username:  username,
		Nickname:  nickname,
		Email:     email,
		Bio:       bio,
		Avatar:    avatar,
		Role:      role,
		CreatedAt: createdAt,
	}
	token, err := s.issueToken(u)
	if err != nil {
		return nil, "", err
	}
	return u, token, nil
}

func (s *AuthService) GetUser(ctx context.Context, id string) (*User, error) {
	var u User
	err := s.db.QueryRowContext(ctx,
		`SELECT id, username, nickname, email, bio, avatar, role, created_at FROM users WHERE id = ?`, id,
	).Scan(&u.ID, &u.Username, &u.Nickname, &u.Email, &u.Bio, &u.Avatar, &u.Role, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (s *AuthService) ListUsers(ctx context.Context) ([]*User, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, username, nickname, email, bio, avatar, role, created_at FROM users ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []*User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Username, &u.Nickname, &u.Email, &u.Bio, &u.Avatar, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, &u)
	}
	return users, rows.Err()
}

func (s *AuthService) CreateMember(ctx context.Context, username, password string) (*User, error) {
	username = strings.TrimSpace(username)
	if err := validateCredentials(username, password); err != nil {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash: %w", err)
	}
	id := ulid.Make().String()
	now := time.Now().Unix()
	if _, err := s.db.ExecContext(ctx,
		`INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, 'member', ?)`,
		id, username, string(hash), now,
	); err != nil {
		return nil, ErrUserExists
	}
	return &User{ID: id, Username: username, Role: "member", CreatedAt: now}, nil
}

func (s *AuthService) DeleteUser(ctx context.Context, id, callerID string) error {
	if id == callerID {
		return errors.New("cannot delete yourself")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Owned assets must be archived or transferred first; silently orphaning
	// them would break the family asset ledger.
	var owned int
	if err := tx.QueryRowContext(ctx, `
		SELECT (SELECT COUNT(*) FROM items WHERE owner_id = ?)
		     + (SELECT COUNT(*) FROM locations WHERE owner_id = ?)`,
		id, id,
	).Scan(&owned); err != nil {
		return err
	}
	if owned > 0 {
		return fmt.Errorf("cannot delete user: they still own %d item/location record(s); archive or transfer them first", owned)
	}

	// Keep audit history but drop the deleted user's identity on it.
	for _, stmt := range []string{
		`UPDATE item_events SET actor_id = NULL WHERE actor_id = ?`,
		`UPDATE system_configs SET updated_by = NULL WHERE updated_by = ?`,
	} {
		if _, err := tx.ExecContext(ctx, stmt, id); err != nil {
			return err
		}
	}

	res, err := tx.ExecContext(ctx, `DELETE FROM users WHERE id = ?`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return tx.Commit()
}

func (s *AuthService) UpdateRole(ctx context.Context, id, role, callerID string) (*User, error) {
	if id == callerID {
		return nil, errors.New("cannot change your own role")
	}
	if role != "owner" && role != "member" {
		return nil, errors.New("role must be 'owner' or 'member'")
	}
	// Bump token_version so JWTs issued with the previous role stop working.
	res, err := s.db.ExecContext(ctx,
		`UPDATE users SET role = ?, token_version = token_version + 1 WHERE id = ?`,
		role, id)
	if err != nil {
		return nil, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return nil, ErrNotFound
	}
	return s.GetUser(ctx, id)
}

const maxAvatarDataURLLength = 400_000 // ~300 KB decoded

var avatarDataURLPrefixes = []string{
	"data:image/png;base64,",
	"data:image/jpeg;base64,",
	"data:image/webp;base64,",
}

// UpdateProfile updates the self-service profile fields of the current user.
// Empty nickname/bio clear them; the UI falls back to the username for the
// display name. The avatar is stored inline as a downscaled image data URL.
func (s *AuthService) UpdateProfile(ctx context.Context, userID string, in ProfileInput) (*User, error) {
	nickname := strings.TrimSpace(in.Nickname)
	if utf8.RuneCountInString(nickname) > 40 {
		return nil, apperr.Wrapf(apperr.CodeValidationFailed, http.StatusBadRequest,
			"nickname must be at most 40 characters")
	}

	email := strings.TrimSpace(in.Email)
	if email != "" {
		addr, err := mail.ParseAddress(email)
		if err != nil || addr.Address != email || len(email) > 254 {
			return nil, apperr.Wrapf(apperr.CodeValidationFailed, http.StatusBadRequest,
				"invalid email address")
		}
	}

	bio := strings.TrimSpace(in.Bio)
	if utf8.RuneCountInString(bio) > 200 {
		return nil, apperr.Wrapf(apperr.CodeValidationFailed, http.StatusBadRequest,
			"bio must be at most 200 characters")
	}

	avatar := strings.TrimSpace(in.Avatar)
	if avatar != "" && !isAvatarDataURL(avatar) {
		return nil, apperr.Wrapf(apperr.CodeValidationFailed, http.StatusBadRequest,
			"invalid avatar image")
	}

	res, err := s.db.ExecContext(ctx,
		`UPDATE users SET nickname = ?, email = ?, bio = ?, avatar = ? WHERE id = ?`,
		nickname, email, bio, avatar, userID)
	if err != nil {
		return nil, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return nil, ErrNotFound
	}
	return s.GetUser(ctx, userID)
}

func isAvatarDataURL(value string) bool {
	if len(value) > maxAvatarDataURLLength {
		return false
	}
	for _, prefix := range avatarDataURLPrefixes {
		if strings.HasPrefix(value, prefix) {
			return true
		}
	}
	return false
}

// ChangePassword verifies the current password, rotates it and bumps
// token_version so every other device's credentials stop working. The
// returned token keeps the calling device signed in.
func (s *AuthService) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) (string, error) {
	if s.demoMode {
		return "", apperr.ErrDemoReadOnly
	}
	if err := validatePassword(newPassword); err != nil {
		return "", err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	var hash, role string
	if err := tx.QueryRowContext(ctx,
		`SELECT password, role FROM users WHERE id = ?`, userID,
	).Scan(&hash, &role); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrNotFound
		}
		return "", err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(currentPassword)); err != nil {
		return "", apperr.ErrInvalidCurrentPassword
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(newPassword)); err == nil {
		return "", apperr.Wrapf(apperr.CodeValidationFailed, http.StatusBadRequest,
			"new password must differ from the current password")
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash: %w", err)
	}
	if _, err := tx.ExecContext(ctx,
		`UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?`,
		string(newHash), userID); err != nil {
		return "", err
	}
	if err := tx.Commit(); err != nil {
		return "", err
	}
	return s.issueToken(&User{ID: userID, Role: role})
}

func validateCredentials(username, password string) error {
	if username == "" {
		return apperr.Wrapf(apperr.CodeValidationFailed, http.StatusBadRequest, "username is required")
	}
	return validatePassword(password)
}

func validatePassword(password string) error {
	if utf8.RuneCountInString(password) < 6 {
		return apperr.Wrapf(apperr.CodeValidationFailed, http.StatusBadRequest,
			"password must be at least 6 characters")
	}
	// bcrypt silently truncates beyond 72 bytes; reject instead.
	if len(password) > 72 {
		return apperr.Wrapf(apperr.CodeValidationFailed, http.StatusBadRequest,
			"password must be at most 72 bytes")
	}
	return nil
}

func (s *AuthService) issueToken(u *User) (string, error) {
	tv, err := s.getTokenVersion(u.ID)
	if err != nil {
		return "", err
	}
	now := time.Now()
	claims := &Claims{
		UserID:       u.ID,
		Role:         u.Role,
		TokenVersion: tv,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.sessionExpire)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return tok.SignedString(s.jwtSecret)
}

func (s *AuthService) getTokenVersion(userID string) (int, error) {
	var v int
	if err := s.db.QueryRow(`SELECT token_version FROM users WHERE id = ?`, userID).Scan(&v); err != nil {
		return 0, err
	}
	return v, nil
}

func (s *AuthService) Verify(tokenStr string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS256 {
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
	// Re-read the user on every verification: a deleted account must lose
	// access immediately, and the role must not come from a stale token.
	var role string
	var currentVersion int
	if err := s.db.QueryRow(
		`SELECT role, token_version FROM users WHERE id = ?`, claims.UserID,
	).Scan(&role, &currentVersion); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	if claims.TokenVersion != currentVersion {
		return nil, errors.New("token revoked")
	}
	claims.Role = role
	return claims, nil
}
