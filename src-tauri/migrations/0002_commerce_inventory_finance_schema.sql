CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'operator'
    CHECK (role IN ('admin', 'manager', 'operator', 'cashier')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_login_at TEXT,
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'string'
    CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  group_name TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trade_name TEXT,
  document_number TEXT,
  state_registration TEXT,
  email TEXT,
  phone TEXT,
  mobile_phone TEXT,
  address_line TEXT,
  address_number TEXT,
  district TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  document_number TEXT,
  email TEXT,
  phone TEXT,
  mobile_phone TEXT,
  address_line TEXT,
  address_number TEXT,
  district TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT,
  credit_limit_cents INTEGER NOT NULL DEFAULT 0 CHECK (credit_limit_cents >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('cash', 'pix', 'debit_card', 'credit_card', 'bank_transfer', 'store_credit', 'other')),
  settlement_days INTEGER NOT NULL DEFAULT 0 CHECK (settlement_days >= 0),
  fee_percent REAL NOT NULL DEFAULT 0 CHECK (fee_percent >= 0),
  fee_fixed_cents INTEGER NOT NULL DEFAULT 0 CHECK (fee_fixed_cents >= 0),
  posts_to_cash INTEGER NOT NULL DEFAULT 1 CHECK (posts_to_cash IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  preferred_supplier_id TEXT REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  sku TEXT,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  product_type TEXT NOT NULL DEFAULT 'part'
    CHECK (product_type IN ('part', 'accessory', 'service', 'other')),
  cost_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (cost_price_cents >= 0),
  sale_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (sale_price_cents >= 0),
  min_stock_quantity REAL NOT NULL DEFAULT 0 CHECK (min_stock_quantity >= 0),
  current_stock_quantity REAL NOT NULL DEFAULT 0,
  location TEXT,
  is_stock_tracked INTEGER NOT NULL DEFAULT 1 CHECK (is_stock_tracked IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  sale_number TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'completed', 'cancelled', 'refunded')),
  sale_type TEXT NOT NULL DEFAULT 'counter'
    CHECK (sale_type IN ('counter', 'work_order', 'quote', 'other')),
  sold_at TEXT,
  subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  total_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cost_cents >= 0),
  gross_profit_cents INTEGER NOT NULL DEFAULT 0,
  margin_percent REAL NOT NULL DEFAULT 0,
  paid_cents INTEGER NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
  change_cents INTEGER NOT NULL DEFAULT 0 CHECK (change_cents >= 0),
  notes TEXT,
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON UPDATE CASCADE ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON UPDATE CASCADE ON DELETE SET NULL,
  item_order INTEGER NOT NULL DEFAULT 0,
  product_sku TEXT,
  product_name TEXT NOT NULL,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost_cents >= 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  line_subtotal_cents INTEGER GENERATED ALWAYS AS (CAST(ROUND(quantity * unit_price_cents) AS INTEGER)) STORED,
  line_total_cents INTEGER GENERATED ALWAYS AS (
    MAX(CAST(ROUND(quantity * unit_price_cents) AS INTEGER) - discount_cents, 0)
  ) STORED,
  line_cost_cents INTEGER GENERATED ALWAYS AS (CAST(ROUND(quantity * unit_cost_cents) AS INTEGER)) STORED,
  gross_profit_cents INTEGER GENERATED ALWAYS AS (
    MAX(CAST(ROUND(quantity * unit_price_cents) AS INTEGER) - discount_cents, 0)
    - CAST(ROUND(quantity * unit_cost_cents) AS INTEGER)
  ) STORED,
  notes TEXT,
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  sale_id TEXT REFERENCES sales(id) ON UPDATE CASCADE ON DELETE SET NULL,
  sale_item_id TEXT REFERENCES sale_items(id) ON UPDATE CASCADE ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  movement_type TEXT NOT NULL
    CHECK (movement_type IN ('purchase', 'sale', 'return', 'adjustment_in', 'adjustment_out', 'loss', 'initial_balance')),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost_cents >= 0),
  total_cost_cents INTEGER GENERATED ALWAYS AS (CAST(ROUND(quantity * unit_cost_cents) AS INTEGER)) STORED,
  reference_code TEXT,
  notes TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id TEXT PRIMARY KEY,
  sale_id TEXT REFERENCES sales(id) ON UPDATE CASCADE ON DELETE SET NULL,
  payment_method_id TEXT REFERENCES payment_methods(id) ON UPDATE CASCADE ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  movement_type TEXT NOT NULL
    CHECK (movement_type IN ('sale_payment', 'sale_refund', 'expense', 'cash_in', 'cash_out', 'opening_balance', 'closing_adjustment')),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  net_amount_cents INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN direction = 'in' THEN amount_cents - fee_cents
      ELSE -amount_cents - fee_cents
    END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  description TEXT,
  reference_code TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  import_batch_id TEXT,
  import_source TEXT,
  import_row_number INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username_active
  ON users(username)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_active
  ON users(email)
  WHERE email IS NOT NULL AND email <> '' AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_slug_active
  ON categories(slug)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_categories_parent_id
  ON categories(parent_id);

CREATE INDEX IF NOT EXISTS ix_suppliers_name
  ON suppliers(name);

CREATE UNIQUE INDEX IF NOT EXISTS ux_suppliers_document_active
  ON suppliers(document_number)
  WHERE document_number IS NOT NULL AND document_number <> '' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_customers_name
  ON customers(name);

CREATE UNIQUE INDEX IF NOT EXISTS ux_customers_document_active
  ON customers(document_number)
  WHERE document_number IS NOT NULL AND document_number <> '' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_payment_methods_type
  ON payment_methods(type);

CREATE UNIQUE INDEX IF NOT EXISTS ux_products_sku_active
  ON products(sku)
  WHERE sku IS NOT NULL AND sku <> '' AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_products_barcode_active
  ON products(barcode)
  WHERE barcode IS NOT NULL AND barcode <> '' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_products_name
  ON products(name);

CREATE INDEX IF NOT EXISTS ix_products_category_id
  ON products(category_id);

CREATE INDEX IF NOT EXISTS ix_products_supplier_id
  ON products(preferred_supplier_id);

CREATE INDEX IF NOT EXISTS ix_products_stock_alert
  ON products(is_active, is_stock_tracked, current_stock_quantity, min_stock_quantity)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_sales_sale_number_active
  ON sales(sale_number)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_sales_sold_at
  ON sales(sold_at);

CREATE INDEX IF NOT EXISTS ix_sales_customer_id
  ON sales(customer_id);

CREATE INDEX IF NOT EXISTS ix_sales_user_id
  ON sales(user_id);

CREATE INDEX IF NOT EXISTS ix_sales_status_sold_at
  ON sales(status, sold_at);

CREATE INDEX IF NOT EXISTS ix_sales_financial_report
  ON sales(sold_at, status, total_cents, total_cost_cents, gross_profit_cents);

CREATE INDEX IF NOT EXISTS ix_sale_items_sale_id
  ON sale_items(sale_id);

CREATE INDEX IF NOT EXISTS ix_sale_items_product_id
  ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS ix_sale_items_report_product
  ON sale_items(product_id, created_at, line_total_cents, gross_profit_cents);

CREATE INDEX IF NOT EXISTS ix_stock_movements_product_date
  ON stock_movements(product_id, occurred_at);

CREATE INDEX IF NOT EXISTS ix_stock_movements_type_date
  ON stock_movements(movement_type, occurred_at);

CREATE INDEX IF NOT EXISTS ix_stock_movements_sale_item_id
  ON stock_movements(sale_item_id);

CREATE INDEX IF NOT EXISTS ix_cash_movements_date
  ON cash_movements(occurred_at);

CREATE INDEX IF NOT EXISTS ix_cash_movements_sale_id
  ON cash_movements(sale_id);

CREATE INDEX IF NOT EXISTS ix_cash_movements_payment_method_date
  ON cash_movements(payment_method_id, occurred_at);

CREATE INDEX IF NOT EXISTS ix_cash_movements_report
  ON cash_movements(occurred_at, status, direction, amount_cents, fee_cents);

CREATE INDEX IF NOT EXISTS ix_settings_group_name
  ON settings(group_name);

CREATE INDEX IF NOT EXISTS ix_products_import_lookup
  ON products(import_batch_id, import_row_number);

CREATE INDEX IF NOT EXISTS ix_sales_import_lookup
  ON sales(import_batch_id, import_row_number);

CREATE INDEX IF NOT EXISTS ix_customers_import_lookup
  ON customers(import_batch_id, import_row_number);

CREATE INDEX IF NOT EXISTS ix_suppliers_import_lookup
  ON suppliers(import_batch_id, import_row_number);

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
AFTER UPDATE ON settings
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

CREATE TRIGGER IF NOT EXISTS trg_categories_updated_at
AFTER UPDATE ON categories
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_suppliers_updated_at
AFTER UPDATE ON suppliers
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE suppliers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_customers_updated_at
AFTER UPDATE ON customers
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_payment_methods_updated_at
AFTER UPDATE ON payment_methods
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE payment_methods SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_products_updated_at
AFTER UPDATE ON products
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_sales_updated_at
AFTER UPDATE ON sales
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sales SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_sale_items_updated_at
AFTER UPDATE ON sale_items
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sale_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_stock_movements_updated_at
AFTER UPDATE ON stock_movements
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE stock_movements SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_cash_movements_updated_at
AFTER UPDATE ON cash_movements
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE cash_movements SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
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

