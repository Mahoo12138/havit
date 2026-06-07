-- users
CREATE TABLE users (
    id          TEXT PRIMARY KEY,
    username    TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'member',
    created_at  INTEGER NOT NULL
);

-- locations (tree)
CREATE TABLE locations (
    id          TEXT PRIMARY KEY,
    parent_id   TEXT REFERENCES locations(id),
    name        TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'physical',
    qr_code     TEXT UNIQUE,
    is_private  INTEGER NOT NULL DEFAULT 0,
    owner_id    TEXT REFERENCES users(id),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

-- tags
CREATE TABLE tags (
    id      TEXT PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE,
    color   TEXT
);

-- items
CREATE TABLE items (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    category        TEXT,
    type            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'in_stock',

    location_id             TEXT REFERENCES locations(id),
    home_base_location_id   TEXT REFERENCES locations(id),
    current_status_tag      TEXT,

    purchase_price      REAL,
    purchase_currency   TEXT,
    purchase_date       INTEGER,
    purchase_platform   TEXT,

    warranty_expires_at INTEGER,
    serial_number       TEXT,
    warranty_contact    TEXT,

    exit_type       TEXT,
    exit_date       INTEGER,
    exit_price      REAL,
    exit_currency   TEXT,
    exit_notes      TEXT,

    platform        TEXT,
    auth_account    TEXT,
    license_key     TEXT,
    download_url    TEXT,

    current_stock       INTEGER,
    min_stock_threshold INTEGER DEFAULT 1,
    lifespan_days       INTEGER,
    in_use_since        INTEGER,

    is_private  INTEGER NOT NULL DEFAULT 0,
    owner_id    TEXT REFERENCES users(id),
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

CREATE TABLE item_tags (
    item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
    tag_id  TEXT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE attachments (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,
    filename     TEXT NOT NULL,
    path         TEXT NOT NULL,
    size         INTEGER,
    is_ai_source INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL
);

CREATE TABLE purchase_events (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    quantity     INTEGER NOT NULL DEFAULT 1,
    price        REAL,
    currency     TEXT,
    purchased_at INTEGER NOT NULL,
    notes        TEXT
);

CREATE TABLE calibration_events (
    id         TEXT PRIMARY KEY,
    item_id    TEXT REFERENCES items(id) ON DELETE CASCADE,
    signal     TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE loans (
    id                    TEXT PRIMARY KEY,
    item_id               TEXT REFERENCES items(id) ON DELETE CASCADE,
    borrower_name         TEXT NOT NULL,
    borrower_contact      TEXT,
    loaned_at             INTEGER NOT NULL,
    due_at                INTEGER,
    returned_at           INTEGER,
    status                TEXT NOT NULL DEFAULT 'active',
    compensation          REAL,
    compensation_currency TEXT,
    notes                 TEXT
);

CREATE TABLE virtual_credentials (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    platform     TEXT NOT NULL,
    account      TEXT,
    order_id     TEXT,
    license_key  TEXT,
    purchased_at INTEGER,
    price        REAL,
    currency     TEXT
);

CREATE TABLE virtual_addon_purchases (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    platform     TEXT,
    price        REAL,
    currency     TEXT,
    purchased_at INTEGER NOT NULL
);

CREATE TABLE reminders (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,
    trigger_at   INTEGER NOT NULL,
    sent_at      INTEGER,
    is_dismissed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE item_events (
    id         TEXT PRIMARY KEY,
    item_id    TEXT REFERENCES items(id) ON DELETE CASCADE,
    actor_id   TEXT REFERENCES users(id),
    event_type TEXT NOT NULL,
    payload    TEXT,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_items_location       ON items(location_id);
CREATE INDEX idx_items_status         ON items(status);
CREATE INDEX idx_items_type           ON items(type);
CREATE INDEX idx_items_owner          ON items(owner_id);
CREATE INDEX idx_attachments_item     ON attachments(item_id);
CREATE INDEX idx_purchase_events_item ON purchase_events(item_id);
CREATE INDEX idx_loans_item           ON loans(item_id);
CREATE INDEX idx_loans_status         ON loans(status);
CREATE INDEX idx_reminders_trigger    ON reminders(trigger_at) WHERE sent_at IS NULL;
CREATE INDEX idx_item_events_item     ON item_events(item_id);

CREATE VIRTUAL TABLE items_fts USING fts5(
    item_id UNINDEXED,
    name,
    description,
    category,
    serial_number,
    content='items',
    content_rowid='rowid',
    tokenize='trigram'
);
