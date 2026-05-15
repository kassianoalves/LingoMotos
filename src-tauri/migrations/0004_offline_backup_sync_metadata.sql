CREATE TABLE IF NOT EXISTS backup_history (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  status TEXT NOT NULL CHECK (status IN ('created', 'restored', 'failed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY,
  entity_name TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'syncing', 'synced', 'failed', 'conflict')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_backup_history_created_at
  ON backup_history(created_at);

CREATE INDEX IF NOT EXISTS ix_sync_outbox_status_created_at
  ON sync_outbox(status, created_at);

CREATE INDEX IF NOT EXISTS ix_sync_outbox_entity
  ON sync_outbox(entity_name, entity_id);

CREATE TRIGGER IF NOT EXISTS trg_sync_outbox_updated_at
AFTER UPDATE ON sync_outbox
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sync_outbox SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_state_updated_at
AFTER UPDATE ON sync_state
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sync_state SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

