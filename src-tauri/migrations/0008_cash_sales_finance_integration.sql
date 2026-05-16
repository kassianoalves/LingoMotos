ALTER TABLE cash_movements ADD COLUMN cash_session_id TEXT REFERENCES cash_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE cash_movements ADD COLUMN source TEXT NOT NULL DEFAULT 'adjustment'
  CHECK (source IN ('sale', 'manual_revenue', 'manual_expense', 'adjustment'));
ALTER TABLE cash_movements ADD COLUMN payment_method TEXT;
ALTER TABLE cash_movements ADD COLUMN reference_id TEXT;

CREATE INDEX IF NOT EXISTS ix_cash_movements_session_date
  ON cash_movements(cash_session_id, occurred_at);
