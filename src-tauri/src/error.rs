use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Erro de banco de dados: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Erro de sistema de arquivos: {0}")]
    Io(#[from] std::io::Error),

    #[error("Diretorio local de dados nao encontrado")]
    DataDirectoryNotFound,

    #[error("Estado interno indisponivel")]
    StateUnavailable,

    #[error("Backup invalido ou nao encontrado")]
    InvalidBackup,

    #[error("URL externa invalida")]
    InvalidExternalUrl,

    #[error("Arquivo de logo invalido")]
    InvalidLogoFile,

    #[error("{0}")]
    Validation(String),
}

#[derive(Debug, Serialize)]
pub struct SerializedError {
    pub code: &'static str,
    pub message: String,
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let code = match self {
            AppError::Database(_) => "DATABASE_ERROR",
            AppError::Io(_) => "IO_ERROR",
            AppError::DataDirectoryNotFound => "DATA_DIRECTORY_NOT_FOUND",
            AppError::StateUnavailable => "STATE_UNAVAILABLE",
            AppError::InvalidBackup => "INVALID_BACKUP",
            AppError::InvalidExternalUrl => "INVALID_EXTERNAL_URL",
            AppError::InvalidLogoFile => "INVALID_LOGO_FILE",
            AppError::Validation(_) => "VALIDATION_ERROR",
        };

        SerializedError {
            code,
            message: self.to_string(),
        }
        .serialize(serializer)
    }
}

pub type AppResult<T> = Result<T, AppError>;
