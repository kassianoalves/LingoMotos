CREATE TABLE IF NOT EXISTS accounts_payable (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  category_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  due_date TEXT NOT NULL,
  company_or_supplier TEXT,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('unique', 'monthly')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'overdue', 'paid')),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS accounts_receivable (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  customer TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  due_date TEXT NOT NULL,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('unique', 'monthly')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'overdue', 'received')),
  received_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS ix_accounts_payable_due_status ON accounts_payable(due_date, status);
CREATE INDEX IF NOT EXISTS ix_accounts_receivable_due_status ON accounts_receivable(due_date, status);
