CREATE TABLE IF NOT EXISTS product_import_batches (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'xls', 'xlsx')),
  duplicate_strategy TEXT NOT NULL CHECK (duplicate_strategy IN ('skip', 'update_prices', 'update_all')),
  allow_partial_import INTEGER NOT NULL DEFAULT 1 CHECK (allow_partial_import IN (0, 1)),
  rollback_on_error INTEGER NOT NULL DEFAULT 1 CHECK (rollback_on_error IN (0, 1)),
  total_rows INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  created_count INTEGER NOT NULL DEFAULT 0 CHECK (created_count >= 0),
  updated_count INTEGER NOT NULL DEFAULT 0 CHECK (updated_count >= 0),
  skipped_count INTEGER NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'completed_with_errors', 'rolled_back', 'failed')),
  report_json TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_import_rows (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES product_import_batches(id) ON UPDATE CASCADE ON DELETE CASCADE,
  row_number INTEGER NOT NULL CHECK (row_number > 0),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'skip', 'error')),
  product_id TEXT REFERENCES products(id) ON UPDATE CASCADE ON DELETE SET NULL,
  sku TEXT,
  barcode TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  errors_json TEXT NOT NULL DEFAULT '[]',
  warnings_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_product_import_batches_started_at
  ON product_import_batches(started_at);

CREATE INDEX IF NOT EXISTS ix_product_import_batches_status
  ON product_import_batches(status);

CREATE INDEX IF NOT EXISTS ix_product_import_rows_batch_id
  ON product_import_rows(batch_id, row_number);

CREATE INDEX IF NOT EXISTS ix_product_import_rows_sku
  ON product_import_rows(sku);

CREATE TRIGGER IF NOT EXISTS trg_product_import_batches_updated_at
AFTER UPDATE ON product_import_batches
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE product_import_batches SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

