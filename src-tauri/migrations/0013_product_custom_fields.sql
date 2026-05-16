CREATE TABLE IF NOT EXISTS product_custom_fields (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'currency', 'date', 'boolean')),
    field_value TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (product_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_product_custom_fields_product_id
    ON product_custom_fields(product_id);
