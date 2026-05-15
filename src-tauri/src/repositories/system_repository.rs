use crate::error::AppResult;
use rusqlite::Connection;

pub struct SystemRepository<'a> {
    connection: &'a Connection,
}

impl<'a> SystemRepository<'a> {
    pub fn new(connection: &'a Connection) -> Self {
        Self { connection }
    }

    pub fn count_applied_migrations(&self) -> AppResult<i64> {
        Ok(self.connection.query_row(
            "SELECT COUNT(*) FROM schema_migrations",
            [],
            |row| row.get(0),
        )?)
    }
}

