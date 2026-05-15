use crate::app_state::AppState;
use crate::error::{AppError, AppResult};
use crate::services::offline_service::{BackupDto, OfflineService, OfflineStatusDto};
use crate::services::system_service::{SystemHealthDto, SystemService};
use tauri::State;

#[tauri::command]
pub fn system_health(state: State<'_, AppState>) -> AppResult<SystemHealthDto> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let service = SystemService::new(&db, state.db_path.clone());
    service.health()
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
pub fn create_backup(state: State<'_, AppState>) -> AppResult<BackupDto> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let service = OfflineService::new(
        &db,
        state.db_path.clone(),
        state.data_dir.clone(),
        state.backup_dir.clone(),
    );
    service.create_backup()
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
pub fn restore_backup(state: State<'_, AppState>, backup_path: String) -> AppResult<BackupDto> {
    let db = state.db.lock().map_err(|_| AppError::StateUnavailable)?;
    let service = OfflineService::new(
        &db,
        state.db_path.clone(),
        state.data_dir.clone(),
        state.backup_dir.clone(),
    );
    service.restore_backup(backup_path)
}
