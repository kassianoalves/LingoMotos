use crate::error::{AppError, AppResult};
use crate::app_state::AppState;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::State;

#[tauri::command]
pub fn open_external_url(url: String) -> AppResult<()> {
    let allowed_url = url.starts_with("https://wa.me/")
        || url.starts_with("https://www.instagram.com/")
        || url.starts_with("https://instagram.com/");

    if !allowed_url {
        return Err(AppError::InvalidExternalUrl);
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg(&url).spawn()?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open").arg(&url).spawn()?;
    }

    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct SaveLogoPayload {
    pub file_name: String,
    pub bytes: Vec<u8>,
}

#[derive(Debug, Serialize)]
pub struct SavedLogoDto {
    pub path: String,
}

#[tauri::command]
pub fn save_store_logo(state: State<'_, AppState>, payload: SaveLogoPayload) -> AppResult<SavedLogoDto> {
    let extension = payload
        .file_name
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_ascii_lowercase();

    if !matches!(extension.as_str(), "png" | "jpg" | "jpeg" | "webp") {
        return Err(AppError::InvalidLogoFile);
    }

    let logos_dir = state.data_dir.join("logos");
    fs::create_dir_all(&logos_dir)?;
    let path = logos_dir.join(format!("store-logo.{}", extension));
    fs::write(&path, payload.bytes)?;

    Ok(SavedLogoDto {
        path: path.to_string_lossy().to_string(),
    })
}
