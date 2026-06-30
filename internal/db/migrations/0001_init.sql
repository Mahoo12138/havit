-- +goose Up

-- users
CREATE TABLE users (
    id              TEXT PRIMARY KEY,
    username        TEXT NOT NULL UNIQUE,
    password        TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'member',
    token_version   INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL
);

-- locations (tree)
CREATE TABLE locations (
    id          TEXT PRIMARY KEY,
    parent_id   TEXT REFERENCES locations(id),
    name        TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'room',
    qr_code     TEXT UNIQUE,
    is_private  INTEGER NOT NULL DEFAULT 0,
    owner_id    TEXT REFERENCES users(id),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

-- tags
CREATE TABLE tags (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    color       TEXT,
    created_at  INTEGER NOT NULL DEFAULT 0
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
    parent_item_id          TEXT REFERENCES items(id),

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

    metadata    TEXT NOT NULL DEFAULT '{}',
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
    content_type TEXT,
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

CREATE TABLE system_configs (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    updated_by TEXT REFERENCES users(id)
);

CREATE TABLE user_preferences (
    user_id                 TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme                   TEXT NOT NULL DEFAULT 'system',
    default_currency        TEXT NOT NULL DEFAULT 'CNY',
    date_format             TEXT NOT NULL DEFAULT 'relative',
    home_view               TEXT NOT NULL DEFAULT 'spaces',
    scan_behavior           TEXT NOT NULL DEFAULT 'confirm',
    default_visibility      TEXT NOT NULL DEFAULT 'shared',
    personal_bark_key       TEXT,
    personal_ntfy_topic     TEXT,
    show_archived_in_search INTEGER NOT NULL DEFAULT 0,
    updated_at              INTEGER NOT NULL
);

CREATE TABLE abnormal_records (
    id                    TEXT PRIMARY KEY,
    item_id               TEXT NOT NULL REFERENCES items(id),
    abnormal_type         TEXT NOT NULL,
    processing_status     TEXT NOT NULL DEFAULT 'pending',
    processing_notes      TEXT,
    responsible_person    TEXT,
    estimated_loss        REAL,
    estimated_loss_currency TEXT,
    recoverable_amount    REAL DEFAULT 0,
    recoverable_currency  TEXT,
    created_at            INTEGER NOT NULL,
    updated_at            INTEGER NOT NULL,
    UNIQUE(item_id)
);

CREATE TABLE categories (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    icon       TEXT,
    root_type  TEXT NOT NULL CHECK(root_type IN ('physical', 'virtual')),
    is_system  INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- Personal Access Tokens
CREATE TABLE api_tokens (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    token_hash   TEXT NOT NULL UNIQUE,
    expires_at   INTEGER,
    last_used_at INTEGER,
    created_at   INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_items_location       ON items(location_id);
CREATE INDEX idx_items_status         ON items(status);
CREATE INDEX idx_items_type           ON items(type);
CREATE INDEX idx_items_owner          ON items(owner_id);
CREATE INDEX idx_items_parent         ON items(parent_item_id);
CREATE INDEX idx_attachments_item     ON attachments(item_id);
CREATE INDEX idx_purchase_events_item ON purchase_events(item_id);
CREATE INDEX idx_loans_item           ON loans(item_id);
CREATE INDEX idx_loans_status         ON loans(status);
CREATE INDEX idx_reminders_trigger    ON reminders(trigger_at) WHERE sent_at IS NULL;
CREATE INDEX idx_item_events_item     ON item_events(item_id);
CREATE INDEX idx_abnormal_records_status ON abnormal_records(processing_status);
CREATE INDEX idx_abnormal_records_type   ON abnormal_records(abnormal_type);
CREATE INDEX idx_categories_root_type    ON categories(root_type);
CREATE INDEX idx_api_tokens_user         ON api_tokens(user_id);

-- Full-text search
CREATE VIRTUAL TABLE items_fts USING fts5(
    item_id UNINDEXED,
    name,
    description,
    category,
    serial_number,
    tokenize='trigram'
);

-- Seed default categories
INSERT INTO categories (id, name, icon, root_type, is_system, created_at) VALUES
('cat_furniture',  '家具',      'sofa',         'physical', 0, strftime('%s','now')),
('cat_appliances', '电器',      'refrigerator', 'physical', 0, strftime('%s','now')),
('cat_digital_hw', '数码硬件',  'smartphone',   'physical', 0, strftime('%s','now')),
('cat_clothing',   '衣物',      'shirt',        'physical', 0, strftime('%s','now')),
('cat_medical',    '医药',      'pill',         'physical', 0, strftime('%s','now')),
('cat_games',      '游戏',      'gamepad-2',    'virtual',  0, strftime('%s','now')),
('cat_ebooks',     '电子书',    'book-open',    'virtual',  0, strftime('%s','now')),
('cat_software',   '独立软件',  'code',         'virtual',  0, strftime('%s','now'));

-- +goose Down
DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS abnormal_records;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS system_configs;
DROP TABLE IF EXISTS items_fts;
DROP TABLE IF EXISTS item_events;
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS virtual_addon_purchases;
DROP TABLE IF EXISTS virtual_credentials;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS calibration_events;
DROP TABLE IF EXISTS purchase_events;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS item_tags;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;
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
    type        TEXT NOT NULL DEFAULT 'room',
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
    parent_item_id           TEXT REFERENCES items(id),

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
    content_type TEXT,
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
CREATE INDEX idx_items_parent         ON items(parent_item_id);

CREATE VIRTUAL TABLE items_fts USING fts5(
    item_id UNINDEXED,
    name,
    description,
    category,
    serial_number,
    tokenize='trigram'
);

CREATE TABLE system_configs (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    updated_by TEXT REFERENCES users(id)
);

CREATE TABLE user_preferences (
    user_id                 TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme                   TEXT NOT NULL DEFAULT 'system',
    default_currency        TEXT NOT NULL DEFAULT 'CNY',
    date_format             TEXT NOT NULL DEFAULT 'relative',
    home_view               TEXT NOT NULL DEFAULT 'spaces',
    scan_behavior           TEXT NOT NULL DEFAULT 'confirm',
    default_visibility      TEXT NOT NULL DEFAULT 'shared',
    personal_bark_key       TEXT,
    personal_ntfy_topic     TEXT,
    show_archived_in_search INTEGER NOT NULL DEFAULT 0,
    updated_at              INTEGER NOT NULL
);
