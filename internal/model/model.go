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
	ParentItemID       *string `json:"parent_item_id,omitempty"`

	PurchasePrice    *float64 `json:"purchase_price,omitempty"`
	PurchaseCurrency *string  `json:"purchase_currency,omitempty"`
	PurchaseDate     *int64   `json:"purchase_date,omitempty"`
	PurchasePlatform *string  `json:"purchase_platform,omitempty"`

	WarrantyExpiresAt *int64  `json:"warranty_expires_at,omitempty"`
	SerialNumber      *string `json:"serial_number,omitempty"`
	WarrantyContact   *string `json:"warranty_contact,omitempty"`

	ExitType     *string  `json:"exit_type,omitempty"`
	ExitDate     *int64   `json:"exit_date,omitempty"`
	ExitPrice    *float64 `json:"exit_price,omitempty"`
	ExitCurrency *string  `json:"exit_currency,omitempty"`
	ExitNotes    *string  `json:"exit_notes,omitempty"`

	CurrentStock      *int   `json:"current_stock,omitempty"`
	MinStockThreshold *int   `json:"min_stock_threshold,omitempty"`
	LifespanDays      *int   `json:"lifespan_days,omitempty"`
	InUseSince        *int64 `json:"in_use_since,omitempty"`
	NeedsRestock      bool   `json:"needs_restock"`
	LifeExpiresAt     *int64 `json:"life_expires_at,omitempty"`

	IsPrivate bool    `json:"is_private"`
	OwnerID   *string `json:"owner_id,omitempty"`
	CreatedAt int64   `json:"created_at"`
	UpdatedAt int64   `json:"updated_at"`
	Tags      []*Tag  `json:"tags,omitempty"`
}

type Tag struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Color      *string `json:"color,omitempty"`
	CreatedAt  int64   `json:"created_at"`
	UsageCount int     `json:"usage_count"`
}

type Category struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Icon       *string `json:"icon,omitempty"`
	RootType   string  `json:"root_type"`
	IsSystem   bool    `json:"is_system"`
	CreatedAt  int64   `json:"created_at"`
	UsageCount int     `json:"usage_count"`
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

type PurchaseEvent struct {
	ID          string   `json:"id"`
	ItemID      string   `json:"item_id"`
	Quantity    int      `json:"quantity"`
	Price       *float64 `json:"price,omitempty"`
	Currency    *string  `json:"currency,omitempty"`
	PurchasedAt int64    `json:"purchased_at"`
	Notes       *string  `json:"notes,omitempty"`
}

type CalibrationEvent struct {
	ID        string `json:"id"`
	ItemID    string `json:"item_id"`
	Signal    string `json:"signal"`
	CreatedAt int64  `json:"created_at"`
}

type Loan struct {
	ID                   string   `json:"id"`
	ItemID               string   `json:"item_id"`
	BorrowerName         string   `json:"borrower_name"`
	BorrowerContact      *string  `json:"borrower_contact,omitempty"`
	LoanedAt             int64    `json:"loaned_at"`
	DueAt                *int64   `json:"due_at,omitempty"`
	ReturnedAt           *int64   `json:"returned_at,omitempty"`
	Status               string   `json:"status"`
	Compensation         *float64 `json:"compensation,omitempty"`
	CompensationCurrency *string  `json:"compensation_currency,omitempty"`
	Notes                *string  `json:"notes,omitempty"`
}

type VirtualCredential struct {
	ID          string   `json:"id"`
	ItemID      string   `json:"item_id"`
	Platform    string   `json:"platform"`
	Account     *string  `json:"account,omitempty"`
	OrderID     *string  `json:"order_id,omitempty"`
	LicenseKey  *string  `json:"license_key,omitempty"`
	PurchasedAt *int64   `json:"purchased_at,omitempty"`
	Price       *float64 `json:"price,omitempty"`
	Currency    *string  `json:"currency,omitempty"`
}

type VirtualAddonPurchase struct {
	ID          string   `json:"id"`
	ItemID      string   `json:"item_id"`
	Name        string   `json:"name"`
	Platform    *string  `json:"platform,omitempty"`
	Price       *float64 `json:"price,omitempty"`
	Currency    *string  `json:"currency,omitempty"`
	PurchasedAt int64    `json:"purchased_at"`
}

type Reminder struct {
	ID          string `json:"id"`
	ItemID      string `json:"item_id"`
	Type        string `json:"type"`
	TriggerAt   int64  `json:"trigger_at"`
	SentAt      *int64 `json:"sent_at,omitempty"`
	IsDismissed bool   `json:"is_dismissed"`
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

type LocationScanResult struct {
	Location *Location `json:"location"`
	Items    []*Item   `json:"items"`
}

type AbnormalRecord struct {
	ID                    string   `json:"id"`
	ItemID                string   `json:"item_id"`
	AbnormalType          string   `json:"abnormal_type"`
	ProcessingStatus      string   `json:"processing_status"`
	ProcessingNotes       *string  `json:"processing_notes,omitempty"`
	ResponsiblePerson     *string  `json:"responsible_person,omitempty"`
	EstimatedLoss         *float64 `json:"estimated_loss,omitempty"`
	EstimatedLossCurrency *string  `json:"estimated_loss_currency,omitempty"`
	RecoverableAmount     *float64 `json:"recoverable_amount,omitempty"`
	RecoverableCurrency   *string  `json:"recoverable_currency,omitempty"`
	CreatedAt             int64    `json:"created_at"`
	UpdatedAt             int64    `json:"updated_at"`
}

type ItemEvent struct {
	ID        string  `json:"id"`
	ItemID    string  `json:"item_id"`
	ActorID   *string `json:"actor_id,omitempty"`
	EventType string  `json:"event_type"`
	Payload   *string `json:"payload,omitempty"`
	CreatedAt int64   `json:"created_at"`
}
