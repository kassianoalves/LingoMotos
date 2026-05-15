mod app_state;
mod commands;
mod database;
mod error;
mod repositories;
mod services;

use app_state::AppState;
use database::connection::open_database;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let database = open_database()?;
            app.manage(AppState::new(database));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::system_health,
            commands::system::offline_status,
            commands::system::create_backup,
            commands::system::list_backups,
            commands::system::restore_backup,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run LingoMotos");
}
