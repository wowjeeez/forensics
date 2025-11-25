use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum FileSystemError {
    #[error("File not found: {path}")]
    FileNotFound { path: PathBuf },

    #[error("Directory not found: {path}")]
    DirectoryNotFound { path: PathBuf },

    #[error("Permission denied: {path}")]
    PermissionDenied { path: PathBuf },

    #[error("Invalid path: {path}")]
    InvalidPath { path: PathBuf },

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Path is not a directory: {path}")]
    NotADirectory { path: PathBuf },

    #[error("Path is not a file: {path}")]
    NotAFile { path: PathBuf },

    #[error("File too large: {path} ({size} bytes)")]
    FileTooLarge { path: PathBuf, size: u64 },

    #[error("Unsupported operation: {0}")]
    UnsupportedOperation(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl serde::Serialize for FileSystemError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = std::result::Result<T, FileSystemError>;
