use crate::error::AppResult;
use crate::repositories::system_repository::SystemRepository;
use rusqlite::Connection;
use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
pub struct SystemHealthDto {
    pub database_path: String,
    pub applied_migrations: i64,
}

pub struct SystemService<'a> {
    repository: SystemRepository<'a>,
    database_path: PathBuf,
}

impl<'a> SystemService<'a> {
    pub fn new(connection: &'a Connection, database_path: PathBuf) -> Self {
        Self {
            repository: SystemRepository::new(connection),
            database_path,
        }
    }

    pub fn health(&self) -> AppResult<SystemHealthDto> {
        Ok(SystemHealthDto {
            database_path: self.database_path.to_string_lossy().to_string(),
            applied_migrations: self.repository.count_applied_migrations()?,
        })
    }
}

