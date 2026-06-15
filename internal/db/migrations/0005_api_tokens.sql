-- Personal Access Tokens
CREATE TABLE api_tokens (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  INTEGER,
    last_used_at INTEGER,
    created_at  INTEGER NOT NULL
);

CREATE INDEX idx_api_tokens_user ON api_tokens(user_id);

-- Token version for session invalidation (kick-out mechanism)
ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
