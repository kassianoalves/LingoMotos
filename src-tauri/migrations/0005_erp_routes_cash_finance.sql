CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES product_categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS financial_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES financial_categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  cash_session_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  due_date TEXT,
  paid_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'received')),
  payment_method TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT,
  opening_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (opening_amount_cents >= 0),
  expected_amount_cents INTEGER NOT NULL DEFAULT 0,
  reported_amount_cents INTEGER,
  difference_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_financial_transactions_type_status_due
  ON financial_transactions(type, status, due_date);

CREATE INDEX IF NOT EXISTS ix_financial_transactions_category
  ON financial_transactions(category_id);

CREATE INDEX IF NOT EXISTS ix_cash_sessions_status
  ON cash_sessions(status);
