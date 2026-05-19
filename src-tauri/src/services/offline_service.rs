use crate::error::{AppError, AppResult};
use chrono::Local;
use deunicode::deunicode;
use rusqlite::{Connection, OptionalExtension};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

const AUTO_BACKUP_RETENTION: usize = 30;
const DEFAULT_AUTO_BACKUP_INTERVAL_HOURS: i64 = 6;
const MIN_AUTO_BACKUP_INTERVAL_HOURS: i64 = 1;
const MAX_AUTO_BACKUP_INTERVAL_HOURS: i64 = 24;

#[derive(Debug, Serialize)]
pub struct BackupDto {
    pub file_name: String,
    pub path: String,
    pub size_bytes: u64,
    pub created_at: String,
    pub backup_type: String,
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

#[derive(Debug, Serialize)]
pub struct BackupMaintenanceDto {
    pub backup_created: bool,
    pub backup: Option<BackupDto>,
    pub deleted_auto_backups: usize,
    pub interval_hours: i64,
    pub next_check_after_ms: u64,
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
        let store_name = self.store_name()?;
        let file_name = format!("{}_{}_backup.db", sanitize_backup_name(&store_name), Local::now().format("%Y-%m-%d_%H-%M-%S"));
        self.create_named_backup(file_name, "manual")
    }

    pub fn create_auto_update_backup(&self) -> AppResult<BackupDto> {
        fs::create_dir_all(&self.backup_dir)?;
        let store_name = sanitize_backup_name(&self.store_name()?);
        let file_name = format!(
            "pre-update_{}_{}_backup.db",
            store_name,
            Local::now().format("%Y-%m-%d_%H-%M-%S")
        );
        self.create_named_backup(file_name, "pre-update")
    }

    pub fn ensure_auto_backup(&self) -> AppResult<BackupMaintenanceDto> {
        fs::create_dir_all(&self.backup_dir)?;
        let deleted_auto_backups = self.cleanup_old_auto_backups()?;
        let interval_hours = self.auto_backup_interval_hours()?;
        let interval_ms = interval_hours as u64 * 60 * 60 * 1_000;

        if let Some(last_auto_backup_at) = self.last_auto_backup_modified_ms()? {
            let elapsed_ms = now_ms().saturating_sub(last_auto_backup_at);
            if elapsed_ms < interval_ms {
                return Ok(BackupMaintenanceDto {
                    backup_created: false,
                    backup: None,
                    deleted_auto_backups,
                    interval_hours,
                    next_check_after_ms: interval_ms.saturating_sub(elapsed_ms).max(60_000),
                });
            }
        }

        let store_name = sanitize_backup_name(&self.store_name()?);
        let file_name = format!("auto_{}_{}_backup.db", store_name, Local::now().format("%Y-%m-%d_%H-%M"));
        let backup = self.create_named_backup(file_name, "auto")?;
        Ok(BackupMaintenanceDto {
            backup_created: true,
            backup: Some(backup),
            deleted_auto_backups,
            interval_hours,
            next_check_after_ms: interval_ms.max(60_000),
        })
    }

    pub fn auto_backup_interval_hours(&self) -> AppResult<i64> {
        let stored: Option<String> = self
            .connection
            .query_row(
                "SELECT value FROM settings WHERE key = 'auto_backup_interval_hours'",
                [],
                |row| row.get(0),
            )
            .optional()?;

        Ok(clamp_auto_backup_interval(
            stored
                .as_deref()
                .and_then(|value| value.parse::<i64>().ok())
                .unwrap_or(DEFAULT_AUTO_BACKUP_INTERVAL_HOURS),
        ))
    }

    pub fn set_auto_backup_interval_hours(&self, interval_hours: i64) -> AppResult<i64> {
        let normalized = clamp_auto_backup_interval(interval_hours);
        self.connection.execute(
            "INSERT INTO settings (key, value, value_type, group_name, description, is_system)
             VALUES ('auto_backup_interval_hours', ?1, 'number', 'backup', 'Intervalo em horas para criacao automatica de backups locais', 0)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, value_type = 'number', group_name = 'backup', updated_at = CURRENT_TIMESTAMP",
            [normalized.to_string()],
        )?;
        Ok(normalized)
    }

    pub fn cleanup_old_auto_backups(&self) -> AppResult<usize> {
        fs::create_dir_all(&self.backup_dir)?;
        let mut auto_backups = fs::read_dir(&self.backup_dir)?
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| {
                let file_name = path.file_name().and_then(|value| value.to_str()).unwrap_or_default();
                file_name.starts_with("auto_") && file_name.ends_with("_backup.db")
            })
            .collect::<Vec<_>>();

        auto_backups.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        let expired = auto_backups.into_iter().skip(AUTO_BACKUP_RETENTION).collect::<Vec<_>>();
        let deleted = expired.len();

        for path in expired {
            fs::remove_file(&path)?;
            self.connection.execute(
                "DELETE FROM backup_history WHERE path = ?1",
                [path.to_string_lossy().to_string()],
            )?;
        }

        Ok(deleted)
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
            backup_type: backup_type_from_file_name(&file_name).to_string(),
            file_name,
            path: path.to_string_lossy().to_string(),
            size_bytes: metadata.len(),
        })
    }

    fn create_named_backup(&self, file_name: String, id_prefix: &str) -> AppResult<BackupDto> {
        fs::create_dir_all(&self.backup_dir)?;
        let created_at = timestamp();
        let backup_path = self.backup_dir.join(&file_name);

        self.connection.execute("VACUUM main INTO ?1", [backup_path.to_string_lossy().as_ref()])?;
        self.connection.execute(
            "INSERT INTO backup_history (id, file_name, path, size_bytes, status, created_at)
             VALUES (?1, ?2, ?3, ?4, 'created', CURRENT_TIMESTAMP)",
            (
                format!("{id_prefix}-{created_at}"),
                file_name,
                backup_path.to_string_lossy().to_string(),
                fs::metadata(&backup_path)?.len() as i64,
            ),
        )?;

        self.backup_from_path(backup_path)
    }

    fn last_auto_backup_modified_ms(&self) -> AppResult<Option<u64>> {
        let mut newest: Option<u64> = None;

        for entry in fs::read_dir(&self.backup_dir)?.filter_map(Result::ok) {
            let path = entry.path();
            let file_name = path.file_name().and_then(|value| value.to_str()).unwrap_or_default();
            if !file_name.starts_with("auto_") || !file_name.ends_with("_backup.db") {
                continue;
            }

            let modified_ms = path
                .metadata()?
                .modified()?
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
            newest = Some(newest.map_or(modified_ms, |current| current.max(modified_ms)));
        }

        Ok(newest)
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
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string()
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn clamp_auto_backup_interval(value: i64) -> i64 {
    value.clamp(MIN_AUTO_BACKUP_INTERVAL_HOURS, MAX_AUTO_BACKUP_INTERVAL_HOURS)
}

fn backup_type_from_file_name(file_name: &str) -> &'static str {
    if file_name.starts_with("auto_") {
        "automatic"
    } else if file_name.starts_with("pre-update_") {
        "pre-update"
    } else {
        "manual-legacy"
    }
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
