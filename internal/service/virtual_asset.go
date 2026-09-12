package service

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"time"

	"github.com/oklog/ulid/v2"

	havitcrypto "github.com/mahoo12138/havit/internal/crypto"
	"github.com/mahoo12138/havit/internal/model"
)

// VirtualCredentialWithItem is a credential row joined with the owning item's
// name, the shape the credentials page aggregates across all virtual items.
type VirtualCredentialWithItem struct {
	model.VirtualCredential
	ItemName string `json:"item_name"`
}

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
	if err := s.ensureVisibleItem(ctx, itemID); err != nil {
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
	s.logCredentialEvent(ctx, itemID, "credential_created", jsonPayload(map[string]any{
		"platform": in.Platform,
	}))
	cred, err := s.getCredential(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.decryptCredential(cred)
}

// ListAllCredentials returns every credential visible to the caller joined
// with the owning item's name, newest purchase first. The credentials page
// derives its tab, metrics and platform filter from this single list instead
// of walking every virtual item.
func (s *VirtualAssetService) ListAllCredentials(ctx context.Context) ([]*VirtualCredentialWithItem, error) {
	where, args, err := applyItemPrivacy(ctx, s.db, "i", "1=1", nil)
	if err != nil {
		return nil, err
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT c.id, c.item_id, c.platform, c.account, c.order_id,
			c.license_key, c.purchased_at, c.price, c.currency,
			i.name
		FROM virtual_credentials c
		JOIN items i ON i.id = c.item_id
		WHERE `+where+`
		ORDER BY c.purchased_at DESC, c.id DESC`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*VirtualCredentialWithItem{}
	for rows.Next() {
		var credential VirtualCredentialWithItem
		if err := rows.Scan(
			&credential.ID, &credential.ItemID, &credential.Platform,
			&credential.Account, &credential.OrderID, &credential.LicenseKey,
			&credential.PurchasedAt, &credential.Price, &credential.Currency,
			&credential.ItemName,
		); err != nil {
			return nil, err
		}
		out = append(out, &credential)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for _, c := range out {
		if _, err := s.decryptCredential(&c.VirtualCredential); err != nil {
			return nil, err
		}
	}
	return out, nil
}

// UpdateCredential patches an existing credential. A nil license_key keeps the
// stored secret untouched, an empty string clears it, and any other value is
// re-encrypted — callers that round-trip a fetched credential back unchanged
// must therefore omit the field instead of echoing it.
func (s *VirtualAssetService) UpdateCredential(ctx context.Context, credentialID string, in VirtualCredentialInput) (*model.VirtualCredential, error) {
	if in.Platform == "" {
		return nil, errors.New("platform required")
	}
	cur, err := s.credentialByID(ctx, credentialID)
	if err != nil {
		return nil, err
	}
	if err := s.ensureVisibleItem(ctx, cur.ItemID); err != nil {
		return nil, err
	}

	cur.Platform = in.Platform
	cur.Account = in.Account
	cur.OrderID = in.OrderID
	cur.PurchasedAt = in.PurchasedAt
	cur.Price = in.Price
	cur.Currency = in.Currency
	if in.LicenseKey != nil {
		if *in.LicenseKey == "" {
			cur.LicenseKey = nil
		} else {
			enc, err := s.crypto.Encrypt(*in.LicenseKey)
			if err != nil {
				return nil, err
			}
			cur.LicenseKey = &enc
		}
	}

	now := time.Now().Unix()
	if _, err := s.db.ExecContext(ctx, `
		UPDATE virtual_credentials
		SET platform = ?, account = ?, order_id = ?, license_key = ?,
			purchased_at = ?, price = ?, currency = ?
		WHERE id = ?`,
		cur.Platform, cur.Account, cur.OrderID, cur.LicenseKey,
		cur.PurchasedAt, cur.Price, cur.Currency, credentialID,
	); err != nil {
		return nil, err
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE items SET updated_at = ? WHERE id = ?`, now, cur.ItemID); err != nil {
		return nil, err
	}
	s.logCredentialEvent(ctx, cur.ItemID, "credential_updated", jsonPayload(map[string]any{
		"platform": cur.Platform,
	}))
	return s.decryptCredential(cur)
}

// DeleteCredential removes a credential and logs the removal on the item's
// lifecycle ledger.
func (s *VirtualAssetService) DeleteCredential(ctx context.Context, credentialID string) error {
	cur, err := s.credentialByID(ctx, credentialID)
	if err != nil {
		return err
	}
	if err := s.ensureVisibleItem(ctx, cur.ItemID); err != nil {
		return err
	}

	now := time.Now().Unix()
	if _, err := s.db.ExecContext(ctx, `DELETE FROM virtual_credentials WHERE id = ?`, credentialID); err != nil {
		return err
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE items SET updated_at = ? WHERE id = ?`, now, cur.ItemID); err != nil {
		return err
	}
	s.logCredentialEvent(ctx, cur.ItemID, "credential_deleted", jsonPayload(map[string]any{
		"platform": cur.Platform,
	}))
	return nil
}

func (s *VirtualAssetService) ListCredentials(ctx context.Context, itemID string) ([]*model.VirtualCredential, error) {
	if err := s.ensureVirtualItem(ctx, itemID); err != nil {
		return nil, err
	}
	if err := s.ensureVisibleItem(ctx, itemID); err != nil {
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
	if err := s.ensureVisibleItem(ctx, itemID); err != nil {
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
	if err := s.ensureVisibleItem(ctx, itemID); err != nil {
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

// ensureVisibleItem reports ErrNotFound when the caller cannot see the item
// (own privacy + location inheritance). Credential reads and writes must not
// touch items the caller cannot see, otherwise a member could read another
// user's private license keys by guessing item ids.
func (s *VirtualAssetService) ensureVisibleItem(ctx context.Context, itemID string) error {
	owner := callerID(ctx)
	where := "id = ?"
	args := []any{itemID}
	where, args = itemPrivacy("items", owner, where, args)
	visible, err := visibleLocationIDs(ctx, s.db, owner)
	if err != nil {
		return err
	}
	where, args = locationClause("items", visible, where, args)
	var count int
	if err := s.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM items WHERE "+where, args...).Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		return ErrNotFound
	}
	return nil
}

// credentialByID fetches a credential without any visibility check; callers
// must run ensureVisibleItem on the returned ItemID before acting on it.
func (s *VirtualAssetService) credentialByID(ctx context.Context, id string) (*model.VirtualCredential, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, platform, account, order_id, license_key, purchased_at, price, currency
		FROM virtual_credentials WHERE id = ?`, id)
	credential, err := scanVirtualCredential(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return credential, nil
}

// logCredentialEvent writes a permanent entry on the item's lifecycle log.
// Failures are logged but do not fail the credential operation itself.
func (s *VirtualAssetService) logCredentialEvent(ctx context.Context, itemID, eventType string, payload *string) {
	eventID := ulid.Make().String()
	if _, err := s.db.ExecContext(ctx,
		`INSERT INTO item_events (id, item_id, event_type, payload, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
		eventID, itemID, eventType, payload, time.Now().Unix(),
	); err != nil {
		slog.Error("log credential event", "item", itemID, "type", eventType, "err", err)
	}
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
