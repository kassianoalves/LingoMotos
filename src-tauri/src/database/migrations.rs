use crate::error::AppResult;
use rusqlite::{params, Connection};

struct Migration {
    version: i64,
    name: &'static str,
    sql: &'static str,
}

const MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        name: "initial_system_tables",
        sql: include_str!("../../migrations/0001_initial_system_tables.sql"),
    },
    Migration {
        version: 2,
        name: "commerce_inventory_finance_schema",
        sql: include_str!("../../migrations/0002_commerce_inventory_finance_schema.sql"),
    },
    Migration {
        version: 3,
        name: "product_import_batches",
        sql: include_str!("../../migrations/0003_product_import_batches.sql"),
    },
    Migration {
        version: 4,
        name: "offline_backup_sync_metadata",
        sql: include_str!("../../migrations/0004_offline_backup_sync_metadata.sql"),
    },
    Migration {
        version: 5,
        name: "erp_routes_cash_finance",
        sql: include_str!("../../migrations/0005_erp_routes_cash_finance.sql"),
    },
    Migration {
        version: 6,
        name: "financial_goals",
        sql: include_str!("../../migrations/0006_financial_goals.sql"),
    },
    Migration {
        version: 7,
        name: "products_stock_real_persistence",
        sql: include_str!("../../migrations/0007_products_stock_real_persistence.sql"),
    },
    Migration {
        version: 8,
        name: "cash_sales_finance_integration",
        sql: include_str!("../../migrations/0008_cash_sales_finance_integration.sql"),
    },
    Migration {
        version: 9,
        name: "master_password",
        sql: include_str!("../../migrations/0009_master_password.sql"),
    },
    Migration {
        version: 10,
        name: "store_pix_settings",
        sql: include_str!("../../migrations/0010_store_pix_settings.sql"),
    },
    Migration {
        version: 11,
        name: "sales_discount_type_amount",
        sql: include_str!("../../migrations/0011_sales_discount_type_amount.sql"),
    },
    Migration {
        version: 12,
        name: "accounts_payable_receivable",
        sql: include_str!("../../migrations/0012_accounts_payable_receivable.sql"),
    },
    Migration {
        version: 13,
        name: "product_custom_fields",
        sql: include_str!("../../migrations/0013_product_custom_fields.sql"),
    },
    Migration {
        version: 14,
        name: "auto_backup_settings",
        sql: include_str!("../../migrations/0014_auto_backup_settings.sql"),
    },
    Migration {
        version: 15,
        name: "backup_history_error_message",
        sql: include_str!("../../migrations/0015_backup_history_error_message.sql"),
    },
    Migration {
        version: 16,
        name: "customer_motorcycle_model",
        sql: include_str!("../../migrations/0016_customer_motorcycle_model.sql"),
    },
];

pub fn run_migrations(connection: &Connection) -> AppResult<()> {
    connection.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        ",
    )?;

    for migration in MIGRATIONS {
        let already_applied: bool = connection.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = ?1)",
            params![migration.version],
            |row| row.get(0),
        )?;

        if already_applied {
            continue;
        }

        let transaction = connection.unchecked_transaction()?;
        if migration.version == 11 {
            ensure_sales_discount_columns(&transaction)?;
        }
        if migration.version == 15 && column_exists(&transaction, "backup_history", "error_message")? {
            transaction.execute(
                "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
                params![migration.version, migration.name],
            )?;
            transaction.commit()?;
            continue;
        }
        if migration.version == 16 && column_exists(&transaction, "customers", "motorcycle_model")? {
            transaction.execute(
                "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
                params![migration.version, migration.name],
            )?;
            transaction.commit()?;
            continue;
        }
        transaction.execute_batch(migration.sql)?;
        transaction.execute(
            "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
            params![migration.version, migration.name],
        )?;
        transaction.commit()?;
    }

    Ok(())
}

fn ensure_sales_discount_columns(connection: &Connection) -> AppResult<()> {
    if !column_exists(connection, "sales", "discount_type")? {
        connection.execute_batch(
            "ALTER TABLE sales
             ADD COLUMN discount_type TEXT NOT NULL DEFAULT 'value'
             CHECK (discount_type IN ('value', 'percentage'));",
        )?;
    }

    if !column_exists(connection, "sales", "discount_amount")? {
        connection.execute_batch(
            "ALTER TABLE sales
             ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0
             CHECK (discount_amount >= 0);",
        )?;
    }

    Ok(())
}

fn column_exists(connection: &Connection, table_name: &str, column_name: &str) -> AppResult<bool> {
    let mut statement = connection.prepare(&format!("PRAGMA table_info({table_name})"))?;
    let columns = statement.query_map([], |row| row.get::<_, String>(1))?;

    for column in columns {
        if column? == column_name {
            return Ok(true);
        }
    }

    Ok(false)
}
