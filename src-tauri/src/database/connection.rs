use crate::database::migrations::run_migrations;
use crate::error::{AppError, AppResult};
use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;

pub struct DatabaseConnection {
    pub connection: Connection,
    pub path: PathBuf,
    pub data_dir: PathBuf,
    pub backup_dir: PathBuf,
}

pub fn open_database() -> AppResult<DatabaseConnection> {
    let db_dir = resolve_database_dir()?;
    let backup_dir = resolve_backup_dir()?;
    fs::create_dir_all(&db_dir)?;
    fs::create_dir_all(&backup_dir)?;

    let db_path = db_dir.join("lingomotos.sqlite3");
    let connection = Connection::open(&db_path)?;

    connection.pragma_update(None, "journal_mode", "WAL")?;
    connection.pragma_update(None, "foreign_keys", "ON")?;
    connection.pragma_update(None, "busy_timeout", 5_000)?;

    run_migrations(&connection)?;

    Ok(DatabaseConnection {
        connection,
        path: db_path,
        data_dir: db_dir,
        backup_dir,
    })
}

pub fn resolve_app_dir() -> AppResult<PathBuf> {
    let base_dir = dirs::data_local_dir().ok_or(AppError::DataDirectoryNotFound)?;
    Ok(base_dir.join("LingoMotos"))
}

pub fn resolve_database_dir() -> AppResult<PathBuf> {
    Ok(resolve_app_dir()?.join("data"))
}

pub fn resolve_backup_dir() -> AppResult<PathBuf> {
    Ok(resolve_app_dir()?.join("backups"))
}
