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
        transaction.execute_batch(migration.sql)?;
        transaction.execute(
            "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
            params![migration.version, migration.name],
        )?;
        transaction.commit()?;
    }

    Ok(())
}
