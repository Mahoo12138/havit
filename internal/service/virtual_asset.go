package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/oklog/ulid/v2"

	havitcrypto "github.com/mahoo12138/havit/internal/crypto"
	"github.com/mahoo12138/havit/internal/model"
)

type VirtualAssetService struct {
	db    *sql.DB
	crypto *havitcrypto.AESCrypto
}

func NewVirtualAssetService(db *sql.DB, crypto *havitcrypto.AESCrypto) *VirtualAssetService {
	return &VirtualAssetService{db: db, crypto: crypto}
}

type VirtualCredentialInput struct {
	Platform    string   `json:"platform"`
	Account     *string  `json:"account,omitempty"`
	OrderID     *string  `json:"order_id,omitempty"`
	LicenseKey  *string  `json:"license_key,omitempty"`
	PurchasedAt *int64   `json:"purchased_at,omitempty"`
	Price       *float64 `json:"price,omitempty"`
	Currency    *string  `json:"currency,omitempty"`
}

type VirtualAddonInput struct {
	Name        string   `json:"name"`
	Platform    *string  `json:"platform,omitempty"`
	Price       *float64 `json:"price,omitempty"`
	Currency    *string  `json:"currency,omitempty"`
	PurchasedAt int64    `json:"purchased_at,omitempty"`
}

func (s *VirtualAssetService) CreateCredential(ctx context.Context, itemID string, in VirtualCredentialInput) (*model.VirtualCredential, error) {
	if in.Platform == "" {
		return nil, errors.New("platform required")
	}
	if err := s.ensureVirtualItem(ctx, itemID); err != nil {
		return nil, err
	}

	now := time.Now().Unix()
	id := ulid.Make().String()
	var encKey *string
	if in.LicenseKey != nil {
		enc, err := s.crypto.Encrypt(*in.LicenseKey)
		if err != nil {
			return nil, err
		}
		encKey = &enc
	}
	if _, err := s.db.ExecContext(ctx, `
		INSERT INTO virtual_credentials (
			id, item_id, platform, account, order_id,
			license_key, purchased_at, price, currency
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, itemID, in.Platform, in.Account, in.OrderID,
		encKey, in.PurchasedAt, in.Price, in.Currency,
	); err != nil {
		return nil, err
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE items SET updated_at = ? WHERE id = ?`, now, itemID); err != nil {
		return nil, err
	}
	cred, err := s.getCredential(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.decryptCredential(cred)
}

func (s *VirtualAssetService) ListCredentials(ctx context.Context, itemID string) ([]*model.VirtualCredential, error) {
	if err := s.ensureVirtualItem(ctx, itemID); err != nil {
		return nil, err
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, platform, account, order_id, license_key, purchased_at, price, currency
		FROM virtual_credentials
		WHERE item_id = ?
		ORDER BY platform ASC, id ASC`, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.VirtualCredential{}
	for rows.Next() {
		credential, err := scanVirtualCredential(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, credential)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return s.decryptCredentials(out)
}

func (s *VirtualAssetService) CreateAddon(ctx context.Context, itemID string, in VirtualAddonInput) (*model.VirtualAddonPurchase, error) {
	if in.Name == "" {
		return nil, errors.New("name required")
	}
	if err := s.ensureVirtualItem(ctx, itemID); err != nil {
		return nil, err
	}

	now := time.Now().Unix()
	if in.PurchasedAt == 0 {
		in.PurchasedAt = now
	}
	id := ulid.Make().String()
	if _, err := s.db.ExecContext(ctx, `
		INSERT INTO virtual_addon_purchases (
			id, item_id, name, platform, price, currency, purchased_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		id, itemID, in.Name, in.Platform, in.Price, in.Currency, in.PurchasedAt,
	); err != nil {
		return nil, err
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE items SET updated_at = ? WHERE id = ?`, now, itemID); err != nil {
		return nil, err
	}
	return s.getAddon(ctx, id)
}

func (s *VirtualAssetService) ListAddons(ctx context.Context, itemID string) ([]*model.VirtualAddonPurchase, error) {
	if err := s.ensureVirtualItem(ctx, itemID); err != nil {
		return nil, err
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, name, platform, price, currency, purchased_at
		FROM virtual_addon_purchases
		WHERE item_id = ?
		ORDER BY purchased_at DESC, id DESC`, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.VirtualAddonPurchase{}
	for rows.Next() {
		addon, err := scanVirtualAddon(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, addon)
	}
	return out, rows.Err()
}

func (s *VirtualAssetService) ensureVirtualItem(ctx context.Context, itemID string) error {
	var itemType model.ItemType
	if err := s.db.QueryRowContext(ctx, `SELECT type FROM items WHERE id = ?`, itemID).Scan(&itemType); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}
	if itemType != model.ItemTypeVirtual {
		return ErrInvalidItemType
	}
	return nil
}

func (s *VirtualAssetService) getCredential(ctx context.Context, id string) (*model.VirtualCredential, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, platform, account, order_id, license_key, purchased_at, price, currency
		FROM virtual_credentials WHERE id = ?`, id)
	return scanVirtualCredential(row)
}

func (s *VirtualAssetService) getAddon(ctx context.Context, id string) (*model.VirtualAddonPurchase, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, name, platform, price, currency, purchased_at
		FROM virtual_addon_purchases WHERE id = ?`, id)
	return scanVirtualAddon(row)
}

type virtualCredentialScanner interface {
	Scan(dest ...any) error
}

func scanVirtualCredential(row virtualCredentialScanner) (*model.VirtualCredential, error) {
	var credential model.VirtualCredential
	if err := row.Scan(
		&credential.ID, &credential.ItemID, &credential.Platform,
		&credential.Account, &credential.OrderID, &credential.LicenseKey,
		&credential.PurchasedAt, &credential.Price, &credential.Currency,
	); err != nil {
		return nil, err
	}
	return &credential, nil
}

// decryptCredential decrypts the license_key in-place. Returns the same pointer for convenience.
func (s *VirtualAssetService) decryptCredential(c *model.VirtualCredential) (*model.VirtualCredential, error) {
	if c.LicenseKey == nil || *c.LicenseKey == "" {
		return c, nil
	}
	plain, err := s.crypto.Decrypt(*c.LicenseKey)
	if err != nil {
		return nil, err
	}
	c.LicenseKey = &plain
	return c, nil
}

func (s *VirtualAssetService) decryptCredentials(list []*model.VirtualCredential) ([]*model.VirtualCredential, error) {
	for _, c := range list {
		if _, err := s.decryptCredential(c); err != nil {
			return nil, err
		}
	}
	return list, nil
}

type virtualAddonScanner interface {
	Scan(dest ...any) error
}

func scanVirtualAddon(row virtualAddonScanner) (*model.VirtualAddonPurchase, error) {
	var addon model.VirtualAddonPurchase
	if err := row.Scan(
		&addon.ID, &addon.ItemID, &addon.Name, &addon.Platform,
		&addon.Price, &addon.Currency, &addon.PurchasedAt,
	); err != nil {
		return nil, err
	}
	return &addon, nil
}
