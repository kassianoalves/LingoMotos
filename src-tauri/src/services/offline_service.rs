use crate::error::{AppError, AppResult};
use rusqlite::Connection;
use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
pub struct BackupDto {
    pub file_name: String,
    pub path: String,
    pub size_bytes: u64,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct OfflineStatusDto {
    pub mode: String,
    pub database_path: String,
    pub data_dir: String,
    pub backup_dir: String,
    pub last_backup_at: Option<String>,
    pub backup_count: usize,
    pub pending_sync_count: i64,
}

pub struct OfflineService<'a> {
    connection: &'a Connection,
    database_path: PathBuf,
    data_dir: PathBuf,
    backup_dir: PathBuf,
}

impl<'a> OfflineService<'a> {
    pub fn new(connection: &'a Connection, database_path: PathBuf, data_dir: PathBuf, backup_dir: PathBuf) -> Self {
        Self {
            connection,
            database_path,
            data_dir,
            backup_dir,
        }
    }

    pub fn status(&self) -> AppResult<OfflineStatusDto> {
        let backups = self.list_backups()?;
        let last_backup_at = backups.first().map(|backup| backup.created_at.clone());
        let pending_sync_count = self.connection.query_row(
            "SELECT COUNT(*) FROM sync_outbox WHERE status = 'pending'",
            [],
            |row| row.get(0),
        )?;

        Ok(OfflineStatusDto {
            mode: "offline-local".to_string(),
            database_path: self.database_path.to_string_lossy().to_string(),
            data_dir: self.data_dir.to_string_lossy().to_string(),
            backup_dir: self.backup_dir.to_string_lossy().to_string(),
            last_backup_at,
            backup_count: backups.len(),
            pending_sync_count,
        })
    }

    pub fn create_backup(&self) -> AppResult<BackupDto> {
        fs::create_dir_all(&self.backup_dir)?;
        let created_at = timestamp();
        let file_name = format!("lingomotos-backup-{}.sqlite3", created_at);
        let backup_path = self.backup_dir.join(&file_name);

        self.connection.execute("VACUUM main INTO ?1", [backup_path.to_string_lossy().as_ref()])?;
        self.connection.execute(
            "INSERT INTO backup_history (id, file_name, path, size_bytes, status, created_at)
             VALUES (?1, ?2, ?3, ?4, 'created', CURRENT_TIMESTAMP)",
            (
                created_at.clone(),
                file_name.clone(),
                backup_path.to_string_lossy().to_string(),
                fs::metadata(&backup_path)?.len() as i64,
            ),
        )?;

        self.backup_from_path(backup_path)
    }

    pub fn list_backups(&self) -> AppResult<Vec<BackupDto>> {
        fs::create_dir_all(&self.backup_dir)?;
        let mut backups = fs::read_dir(&self.backup_dir)?
            .filter_map(Result::ok)
            .filter(|entry| entry.path().extension().and_then(|value| value.to_str()) == Some("sqlite3"))
            .filter_map(|entry| self.backup_from_path(entry.path()).ok())
            .collect::<Vec<_>>();

        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(backups)
    }

    pub fn restore_backup(&self, backup_path: String) -> AppResult<BackupDto> {
        let source = PathBuf::from(backup_path);

        if !source.exists() || source.extension().and_then(|value| value.to_str()) != Some("sqlite3") {
            return Err(AppError::InvalidBackup);
        }

        self.connection.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;
        let safety_backup = self.create_backup()?;

        fs::copy(&source, &self.database_path)?;
        self.connection.execute(
            "INSERT INTO backup_history (id, file_name, path, size_bytes, status, created_at)
             VALUES (?1, ?2, ?3, ?4, 'restored', CURRENT_TIMESTAMP)",
            (
                format!("restore-{}", timestamp()),
                source.file_name().and_then(|value| value.to_str()).unwrap_or("backup.sqlite3").to_string(),
                source.to_string_lossy().to_string(),
                fs::metadata(&source)?.len() as i64,
            ),
        )?;

        Ok(safety_backup)
    }

    fn backup_from_path(&self, path: PathBuf) -> AppResult<BackupDto> {
        let metadata = fs::metadata(&path)?;
        let file_name = path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("backup.sqlite3")
            .to_string();

        Ok(BackupDto {
            created_at: file_name
                .trim_start_matches("lingomotos-backup-")
                .trim_end_matches(".sqlite3")
                .to_string(),
            file_name,
            path: path.to_string_lossy().to_string(),
            size_bytes: metadata.len(),
        })
    }
}

fn timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string()
}
