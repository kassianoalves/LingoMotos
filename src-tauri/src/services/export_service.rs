use crate::error::AppResult;
use std::fs;
use std::path::PathBuf;
pub struct ExportService;

impl ExportService {
    pub fn new() -> Self {
        Self
    }

    pub fn write_to_path(&self, file_path: &str, content: &str) -> AppResult<String> {
        let path = PathBuf::from(file_path);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&path, content)?;
        Ok(path.to_string_lossy().to_string())
    }
}
