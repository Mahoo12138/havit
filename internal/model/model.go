package model

type ItemType string
type ItemStatus string
type AttachmentType string

const (
	ItemTypeDurable     ItemType = "durable"
	ItemTypeConsumableA ItemType = "consumable_a"
	ItemTypeConsumableB ItemType = "consumable_b"
	ItemTypeEDC         ItemType = "edc"
	ItemTypeVirtual     ItemType = "virtual"
)

const (
	StatusInStock    ItemStatus = "in_stock"
	StatusBorrowed   ItemStatus = "borrowed"
	StatusIdle       ItemStatus = "idle"
	StatusForSale    ItemStatus = "for_sale"
	StatusSold       ItemStatus = "sold"
	StatusGivenAway  ItemStatus = "given_away"
	StatusLost       ItemStatus = "lost"
	StatusStolen     ItemStatus = "stolen"
	StatusUnreturned ItemStatus = "unreturned"
	StatusDamaged    ItemStatus = "damaged"
	StatusArchived   ItemStatus = "archived"
)

const (
	AttachmentTypePhoto AttachmentType = "photo"
)

type Item struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	Category    *string    `json:"category,omitempty"`
	Type        ItemType   `json:"type"`
	Status      ItemStatus `json:"status"`

	LocationID         *string `json:"location_id,omitempty"`
	HomeBaseLocationID *string `json:"home_base_location_id,omitempty"`
	CurrentStatusTag   *string `json:"current_status_tag,omitempty"`

	PurchasePrice    *float64 `json:"purchase_price,omitempty"`
	PurchaseCurrency *string  `json:"purchase_currency,omitempty"`
	PurchaseDate     *int64   `json:"purchase_date,omitempty"`
	PurchasePlatform *string  `json:"purchase_platform,omitempty"`

	WarrantyExpiresAt *int64  `json:"warranty_expires_at,omitempty"`
	SerialNumber      *string `json:"serial_number,omitempty"`

	IsPrivate bool    `json:"is_private"`
	OwnerID   *string `json:"owner_id,omitempty"`
	CreatedAt int64   `json:"created_at"`
	UpdatedAt int64   `json:"updated_at"`
	Tags      []*Tag  `json:"tags,omitempty"`
}

type Tag struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Color *string `json:"color,omitempty"`
}

type Attachment struct {
	ID          string         `json:"id"`
	ItemID      string         `json:"item_id"`
	Type        AttachmentType `json:"type"`
	Filename    string         `json:"filename"`
	Path        string         `json:"path"`
	Size        int64          `json:"size"`
	ContentType string         `json:"content_type"`
	URL         string         `json:"url"`
	IsAISource  bool           `json:"is_ai_source"`
	CreatedAt   int64          `json:"created_at"`
}

type Location struct {
	ID        string  `json:"id"`
	ParentID  *string `json:"parent_id,omitempty"`
	Name      string  `json:"name"`
	Type      string  `json:"type"`
	QRCode    *string `json:"qr_code,omitempty"`
	IsPrivate bool    `json:"is_private"`
	OwnerID   *string `json:"owner_id,omitempty"`
	SortOrder int     `json:"sort_order"`
	CreatedAt int64   `json:"created_at"`
	UpdatedAt int64   `json:"updated_at"`

	Children []*Location `json:"children,omitempty"`
}
