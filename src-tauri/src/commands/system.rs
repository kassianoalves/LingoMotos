use crate::app_state::AppState;
use crate::error::{AppError, AppResult};
use crate::services::offline_service::{BackupDto, OfflineService, OfflineStatusDto};
use crate::services::system_service::{SystemHealthDto, SystemService};
use bcrypt::{hash, verify};
use rusqlite::OptionalExtension;
use std::time::Instant;
use tauri::State;

const LOCAL_MASTER_PASSWORD_COST: u32 = 8;

#[tauri::command]
pub fn system_health(state: State<'_, AppState>) -> AppResult<SystemHealthDto> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let service = SystemService::new(&db, state.db_path.clone());
    service.health()
}

#[tauri::command]
pub fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub fn offline_status(state: State<'_, AppState>) -> AppResult<OfflineStatusDto> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let service = OfflineService::new(
        &db,
        state.db_path.clone(),
        state.data_dir.clone(),
        state.backup_dir.clone(),
    );
    service.status()
}

#[tauri::command]
pub fn create_backup(state: State<'_, AppState>, password: String) -> AppResult<BackupDto> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let verify_started = Instant::now();
    require_master_password(&db, &password)?;
    debug_timing("master_password.verify.create_backup", verify_started);
    let service = OfflineService::new(
        &db,
        state.db_path.clone(),
        state.data_dir.clone(),
        state.backup_dir.clone(),
    );
    let action_started = Instant::now();
    let result = service.create_backup();
    debug_timing("protected_action.create_backup", action_started);
    result
}

#[tauri::command]
pub fn list_backups(state: State<'_, AppState>) -> AppResult<Vec<BackupDto>> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let service = OfflineService::new(
        &db,
        state.db_path.clone(),
        state.data_dir.clone(),
        state.backup_dir.clone(),
    );
    service.list_backups()
}

#[tauri::command]
pub fn restore_backup(state: State<'_, AppState>, backup_path: String, password: String) -> AppResult<BackupDto> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let verify_started = Instant::now();
    require_master_password(&db, &password)?;
    debug_timing("master_password.verify.restore_backup", verify_started);
    let service = OfflineService::new(
        &db,
        state.db_path.clone(),
        state.data_dir.clone(),
        state.backup_dir.clone(),
    );
    let action_started = Instant::now();
    let result = service.restore_backup(backup_path);
    debug_timing("protected_action.restore_backup", action_started);
    result
}

#[tauri::command]
pub fn create_database_backup(state: State<'_, AppState>, password: String) -> AppResult<BackupDto> {
    create_backup(state, password)
}

#[tauri::command]
pub fn list_database_backups(state: State<'_, AppState>) -> AppResult<Vec<BackupDto>> {
    list_backups(state)
}

#[tauri::command]
pub fn restore_database_backup(state: State<'_, AppState>, backup_path: String, password: String) -> AppResult<BackupDto> {
    restore_backup(state, backup_path, password)
}

#[tauri::command]
pub fn delete_database_backup(state: State<'_, AppState>, backup_path: String, password: String) -> AppResult<()> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let verify_started = Instant::now();
    require_master_password(&db, &password)?;
    debug_timing("master_password.verify.delete_backup", verify_started);
    let service = OfflineService::new(
        &db,
        state.db_path.clone(),
        state.data_dir.clone(),
        state.backup_dir.clone(),
    );
    let action_started = Instant::now();
    let result = service.delete_backup(backup_path);
    debug_timing("protected_action.delete_backup", action_started);
    result
}

#[tauri::command]
pub fn get_backup_status(state: State<'_, AppState>) -> AppResult<OfflineStatusDto> {
    offline_status(state)
}

#[tauri::command]
pub fn is_master_password_configured(state: State<'_, AppState>) -> AppResult<bool> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    db.query_row(
        "SELECT EXISTS(SELECT 1 FROM security_settings WHERE key = 'master_password_hash')",
        [],
        |row| row.get(0),
    )
    .map_err(Into::into)
}

#[tauri::command]
pub fn set_master_password(state: State<'_, AppState>, password: String) -> AppResult<()> {
    if password.trim().len() < 4 {
        return Err(AppError::Validation("Senha master deve ter ao menos 4 caracteres.".into()));
    }
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let password_hash = hash(password, LOCAL_MASTER_PASSWORD_COST).map_err(|error| AppError::Validation(error.to_string()))?;
    db.execute(
        "INSERT INTO security_settings (key, value) VALUES ('master_password_hash', ?1)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        [password_hash],
    )?;
    Ok(())
}

#[tauri::command]
pub fn verify_master_password(state: State<'_, AppState>, password: String) -> AppResult<bool> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let verify_started = Instant::now();
    let stored: Option<String> = db
        .query_row(
            "SELECT value FROM security_settings WHERE key = 'master_password_hash'",
            [],
            |row| row.get(0),
        )
        .optional()?;
    let valid = stored
        .map(|value| verify(password, &value).unwrap_or(false))
        .unwrap_or(false);
    debug_timing("master_password.verify.command", verify_started);
    Ok(valid)
}

#[tauri::command]
pub fn factory_reset(state: State<'_, AppState>, password: String) -> AppResult<()> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let verify_started = Instant::now();
    require_master_password(&db, &password)?;
    debug_timing("master_password.verify.factory_reset", verify_started);
    let service = OfflineService::new(
        &db,
        state.db_path.clone(),
        state.data_dir.clone(),
        state.backup_dir.clone(),
    );
    let action_started = Instant::now();
    service.delete_all_backups()?;
    db.execute_batch(
        "
        PRAGMA foreign_keys = OFF;
        DELETE FROM product_custom_fields;
        DELETE FROM product_import_rows;
        DELETE FROM product_import_batches;
        DELETE FROM sale_items;
        DELETE FROM sales;
        DELETE FROM stock_movements;
        DELETE FROM cash_movements;
        DELETE FROM financial_transactions;
        DELETE FROM accounts_payable;
        DELETE FROM accounts_receivable;
        DELETE FROM cash_sessions;
        DELETE FROM products;
        DELETE FROM suppliers;
        DELETE FROM categories;
        DELETE FROM product_categories;
        DELETE FROM payment_methods;
        DELETE FROM customers;
        DELETE FROM settings;
        DELETE FROM financial_goals;
        DELETE FROM backup_history;
        DELETE FROM security_settings WHERE key = 'master_password_hash';
        PRAGMA foreign_keys = ON;
        ",
    )?;
    debug_timing("protected_action.factory_reset", action_started);
    Ok(())
}

pub(crate) fn require_master_password(db: &rusqlite::Connection, password: &str) -> AppResult<()> {
    let stored: Option<String> = db
        .query_row(
            "SELECT value FROM security_settings WHERE key = 'master_password_hash'",
            [],
            |row| row.get(0),
        )
        .optional()?;
    let valid = stored
        .map(|value| verify(password, &value).unwrap_or(false))
        .unwrap_or(false);
    if valid {
        Ok(())
    } else {
        Err(AppError::Validation("Senha invalida.".into()))
    }
}

fn debug_timing(label: &str, started: Instant) {
    #[cfg(debug_assertions)]
    eprintln!("{label}: {} ms", started.elapsed().as_millis());
}
