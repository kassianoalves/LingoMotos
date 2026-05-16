ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN motorcycle_application TEXT;
ALTER TABLE products ADD COLUMN notes TEXT;
ALTER TABLE products ADD COLUMN margin_percent REAL NOT NULL DEFAULT 0;

ALTER TABLE stock_movements ADD COLUMN reason TEXT;
ALTER TABLE stock_movements ADD COLUMN reference_id TEXT;
ALTER TABLE stock_movements ADD COLUMN unit_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0);

ALTER TABLE stock_movements RENAME TO stock_movements_legacy;

CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  sale_id TEXT REFERENCES sales(id) ON UPDATE CASCADE ON DELETE SET NULL,
  sale_item_id TEXT REFERENCES sale_items(id) ON UPDATE CASCADE ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return', 'loss', 'internal_use', 'initial_balance')),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost_cents >= 0),
  unit_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  total_cost_cents INTEGER GENERATED ALWAYS AS (CAST(ROUND(quantity * unit_cost_cents) AS INTEGER)) STORED,
  reference_code TEXT,
  reference_id TEXT,
  reason TEXT,
  notes TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

INSERT INTO stock_movements (
  id, product_id, sale_id, sale_item_id, user_id, movement_type, direction, quantity,
  unit_cost_cents, unit_price_cents, reference_code, reference_id, reason, notes, occurred_at,
  import_batch_id, import_source, import_row_number, created_at, updated_at, deleted_at
)
SELECT
  id,
  product_id,
  sale_id,
  sale_item_id,
  user_id,
  CASE
    WHEN movement_type IN ('adjustment_in', 'adjustment_out') THEN 'adjustment'
    ELSE movement_type
  END,
  direction,
  quantity,
  unit_cost_cents,
  0,
  reference_code,
  NULL,
  NULL,
  notes,
  occurred_at,
  import_batch_id,
  import_source,
  import_row_number,
  created_at,
  updated_at,
  deleted_at
FROM stock_movements_legacy;

DROP TABLE stock_movements_legacy;

CREATE INDEX IF NOT EXISTS ix_stock_movements_product_date
  ON stock_movements(product_id, occurred_at);

CREATE INDEX IF NOT EXISTS ix_stock_movements_type_date
  ON stock_movements(movement_type, occurred_at);

CREATE INDEX IF NOT EXISTS ix_stock_movements_sale_item_id
  ON stock_movements(sale_item_id);

CREATE TRIGGER IF NOT EXISTS trg_stock_movements_updated_at
AFTER UPDATE ON stock_movements
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE stock_movements SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_stock_movements_insert_product_stock
AFTER INSERT ON stock_movements
FOR EACH ROW
WHEN NEW.deleted_at IS NULL
BEGIN
  UPDATE products
  SET current_stock_quantity = current_stock_quantity +
    CASE WHEN NEW.direction = 'in' THEN NEW.quantity ELSE -NEW.quantity END
  WHERE id = NEW.product_id
    AND is_stock_tracked = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_stock_movements_update_product_stock
AFTER UPDATE ON stock_movements
FOR EACH ROW
BEGIN
  UPDATE products
  SET current_stock_quantity = current_stock_quantity -
    CASE
      WHEN OLD.deleted_at IS NULL THEN
        CASE WHEN OLD.direction = 'in' THEN OLD.quantity ELSE -OLD.quantity END
      ELSE 0
    END
  WHERE id = OLD.product_id
    AND is_stock_tracked = 1;

  UPDATE products
  SET current_stock_quantity = current_stock_quantity +
    CASE
      WHEN NEW.deleted_at IS NULL THEN
        CASE WHEN NEW.direction = 'in' THEN NEW.quantity ELSE -NEW.quantity END
      ELSE 0
    END
  WHERE id = NEW.product_id
    AND is_stock_tracked = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_stock_movements_delete_product_stock
AFTER DELETE ON stock_movements
FOR EACH ROW
WHEN OLD.deleted_at IS NULL
BEGIN
  UPDATE products
  SET current_stock_quantity = current_stock_quantity -
    CASE WHEN OLD.direction = 'in' THEN OLD.quantity ELSE -OLD.quantity END
  WHERE id = OLD.product_id
    AND is_stock_tracked = 1;
END;
