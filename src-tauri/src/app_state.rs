use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<Connection>,
    pub db_path: PathBuf,
    pub data_dir: PathBuf,
    pub backup_dir: PathBuf,
}

impl AppState {
    pub fn new(database: crate::database::connection::DatabaseConnection) -> Self {
        Self {
            db: Mutex::new(database.connection),
            db_path: database.path,
            data_dir: database.data_dir,
            backup_dir: database.backup_dir,
        }
    }
}
