CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    root_type TEXT NOT NULL CHECK(root_type IN ('physical', 'virtual')),
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_categories_root_type ON categories(root_type);

-- Seed system preset categories
INSERT INTO categories (id, name, icon, root_type, is_system, created_at) VALUES
('cat_furniture',  '家具',      'sofa',         'physical', 1, strftime('%s','now')),
('cat_appliances', '电器',      'refrigerator', 'physical', 1, strftime('%s','now')),
('cat_digital_hw', '数码硬件',  'smartphone',   'physical', 1, strftime('%s','now')),
('cat_clothing',   '衣物',      'shirt',        'physical', 1, strftime('%s','now')),
('cat_medical',    '医药',      'pill',         'physical', 1, strftime('%s','now')),
('cat_games',      '游戏',      'gamepad-2',    'virtual',  1, strftime('%s','now')),
('cat_ebooks',     '电子书',    'book-open',    'virtual',  1, strftime('%s','now')),
('cat_software',   '独立软件',  'code',         'virtual',  1, strftime('%s','now'));
