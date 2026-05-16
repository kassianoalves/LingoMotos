use crate::error::{AppError, AppResult};
use chrono::Local;
use deunicode::deunicode;
use rusqlite::{Connection, OptionalExtension};
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
        let store_name = self.store_name()?;
        let file_name = format!("{}_{}_backup.db", sanitize_backup_name(&store_name), Local::now().format("%Y-%m-%d_%H-%M-%S"));
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
            .filter(|entry| matches!(entry.path().extension().and_then(|value| value.to_str()), Some("db") | Some("sqlite3")))
            .filter_map(|entry| self.backup_from_path(entry.path()).ok())
            .collect::<Vec<_>>();

        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(backups)
    }

    pub fn restore_backup(&self, backup_path: String) -> AppResult<BackupDto> {
        let source = PathBuf::from(backup_path);

        if !source.exists() || !matches!(source.extension().and_then(|value| value.to_str()), Some("db") | Some("sqlite3")) {
            return Err(AppError::InvalidBackup);
        }
        let integrity: String = Connection::open(&source)?.query_row("PRAGMA integrity_check", [], |row| row.get(0))?;
        if integrity != "ok" {
            return Err(AppError::InvalidBackup);
        }

        self.connection.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;

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

        self.backup_from_path(source)
    }

    pub fn delete_backup(&self, backup_path: String) -> AppResult<()> {
        let target = self.resolve_backup_path(&backup_path)?;
        if target == self.database_path {
            return Err(AppError::Validation("Nao e permitido excluir o banco ativo.".into()));
        }

        fs::remove_file(&target)?;
        self.connection.execute(
            "DELETE FROM backup_history WHERE path = ?1",
            [target.to_string_lossy().to_string()],
        )?;
        Ok(())
    }

    pub fn delete_all_backups(&self) -> AppResult<()> {
        fs::create_dir_all(&self.backup_dir)?;
        for entry in fs::read_dir(&self.backup_dir)?.filter_map(Result::ok) {
            let path = entry.path();
            if matches!(path.extension().and_then(|value| value.to_str()), Some("db") | Some("sqlite3")) {
                fs::remove_file(path)?;
            }
        }
        self.connection.execute("DELETE FROM backup_history", [])?;
        Ok(())
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
                .trim_end_matches(".db")
                .trim_end_matches(".sqlite3")
                .to_string(),
            file_name,
            path: path.to_string_lossy().to_string(),
            size_bytes: metadata.len(),
        })
    }

    fn store_name(&self) -> AppResult<String> {
        Ok(self
            .connection
            .query_row("SELECT NULLIF(value, '') FROM settings WHERE key = 'store.name'", [], |row| row.get(0))
            .optional()?
            .flatten()
            .unwrap_or_else(|| "LingoMotos".to_string()))
    }

    fn resolve_backup_path(&self, backup_path: &str) -> AppResult<PathBuf> {
        let target = PathBuf::from(backup_path);
        if !matches!(target.extension().and_then(|value| value.to_str()), Some("db")) {
            return Err(AppError::InvalidBackup);
        }
        let canonical_target = target.canonicalize().map_err(|_| AppError::InvalidBackup)?;
        let canonical_backup_dir = self.backup_dir.canonicalize().map_err(|_| AppError::InvalidBackup)?;
        if !canonical_target.starts_with(&canonical_backup_dir) {
            return Err(AppError::InvalidBackup);
        }
        Ok(canonical_target)
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

fn sanitize_backup_name(value: &str) -> String {
    let slug = deunicode(value).to_lowercase();
    let mut sanitized = String::with_capacity(slug.len());
    let mut previous_was_dash = false;

    for character in slug.chars() {
        let next = if character.is_ascii_alphanumeric() {
            previous_was_dash = false;
            Some(character)
        } else if character.is_whitespace() || character == '-' || character == '_' {
            if previous_was_dash {
                None
            } else {
                previous_was_dash = true;
                Some('-')
            }
        } else {
            None
        };

        if let Some(character) = next {
            sanitized.push(character);
        }
    }

    sanitized.trim_matches('-').to_string()
}
