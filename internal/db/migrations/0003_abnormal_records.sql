CREATE TABLE abnormal_records (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id),
  abnormal_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  processing_notes TEXT,
  responsible_person TEXT,
  estimated_loss REAL,
  estimated_loss_currency TEXT,
  recoverable_amount REAL DEFAULT 0,
  recoverable_currency TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(item_id)
);
CREATE INDEX idx_abnormal_records_status ON abnormal_records(processing_status);
CREATE INDEX idx_abnormal_records_type ON abnormal_records(abnormal_type);
