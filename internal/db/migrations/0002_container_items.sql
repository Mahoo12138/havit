-- +goose Up
ALTER TABLE items ADD COLUMN parent_item_id TEXT REFERENCES items(id);
CREATE INDEX idx_items_parent ON items(parent_item_id);

-- +goose Down
DROP INDEX IF EXISTS idx_items_parent;
