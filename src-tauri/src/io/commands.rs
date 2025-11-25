use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

use super::error::Result;
use super::fs::{FileSystem, FileSystemBuilder};
use super::types::*;

/// Global file system state
pub struct FileSystemState {
    fs: Arc<Box<dyn FileSystem>>,
}

impl FileSystemState {
    pub fn new() -> Self {
        Self {
            fs: Arc::new(FileSystemBuilder::local().build()),
        }
    }

    pub fn fs(&self) -> &dyn FileSystem {
        self.fs.as_ref().as_ref()
    }
}

/// Read file contents as bytes
#[tauri::command]
pub async fn read_file(path: String, state: State<'_, FileSystemState>) -> Result<Vec<u8>> {
    let path = PathBuf::from(path);
    state.fs().read_file(&path).await
}

/// Read file contents as string
#[tauri::command]
pub async fn read_file_as_string(path: String, state: State<'_, FileSystemState>) -> Result<String> {
    let path = PathBuf::from(path);
    state.fs().read_to_string(&path).await
}

/// Write file contents
#[tauri::command]
pub async fn write_file(path: String, data: Vec<u8>, state: State<'_, FileSystemState>) -> Result<()> {
    let path = PathBuf::from(path);
    state.fs().write_file(&path, &data).await
}

/// Check if path exists
#[tauri::command]
pub async fn exists(path: String, state: State<'_, FileSystemState>) -> Result<bool> {
    let path = PathBuf::from(path);
    state.fs().exists(&path).await
}

/// Check if path is a file
#[tauri::command]
pub async fn is_file(path: String, state: State<'_, FileSystemState>) -> Result<bool> {
    let path = PathBuf::from(path);
    state.fs().is_file(&path).await
}

/// Check if path is a directory
#[tauri::command]
pub async fn is_dir(path: String, state: State<'_, FileSystemState>) -> Result<bool> {
    let path = PathBuf::from(path);
    state.fs().is_dir(&path).await
}

/// Get file metadata
#[tauri::command]
pub async fn get_metadata(path: String, state: State<'_, FileSystemState>) -> Result<FileMetadata> {
    let path = PathBuf::from(path);
    state.fs().metadata(&path).await
}

/// List directory contents (non-recursive)
#[tauri::command]
pub async fn list_directory(path: String, state: State<'_, FileSystemState>) -> Result<Vec<FileInfo>> {
    let path = PathBuf::from(path);
    state.fs().list_dir(&path).await
}

/// Scan directory recursively with options
#[tauri::command]
pub async fn scan_directory(
    path: String,
    options: DirectoryScanOptions,
    state: State<'_, FileSystemState>,
) -> Result<FileInfo> {
    let path = PathBuf::from(path);
    state.fs().scan_directory(&path, options).await
}

/// Delete a file
#[tauri::command]
pub async fn delete_file(path: String, state: State<'_, FileSystemState>) -> Result<()> {
    let path = PathBuf::from(path);
    state.fs().delete_file(&path).await
}

/// Delete a directory recursively
#[tauri::command]
pub async fn delete_directory(path: String, state: State<'_, FileSystemState>) -> Result<()> {
    let path = PathBuf::from(path);
    state.fs().delete_dir(&path).await
}

/// Create a directory with parents
#[tauri::command]
pub async fn create_directory(path: String, state: State<'_, FileSystemState>) -> Result<()> {
    let path = PathBuf::from(path);
    state.fs().create_dir(&path).await
}

/// Copy a file
#[tauri::command]
pub async fn copy_file(from: String, to: String, state: State<'_, FileSystemState>) -> Result<()> {
    let from_path = PathBuf::from(from);
    let to_path = PathBuf::from(to);
    state.fs().copy_file(&from_path, &to_path).await
}

/// Move/rename a file or directory
#[tauri::command]
pub async fn move_path(from: String, to: String, state: State<'_, FileSystemState>) -> Result<()> {
    let from_path = PathBuf::from(from);
    let to_path = PathBuf::from(to);
    state.fs().move_path(&from_path, &to_path).await
}

/// Calculate file hashes (MD5, SHA256)
#[tauri::command]
pub async fn calculate_hash(path: String, state: State<'_, FileSystemState>) -> Result<FileHash> {
    let path = PathBuf::from(path);
    state.fs().calculate_hash(&path).await
}

/// Search for files matching a pattern
#[tauri::command]
pub async fn search_files(
    base_path: String,
    options: SearchOptions,
    state: State<'_, FileSystemState>,
) -> Result<Vec<PathBuf>> {
    let path = PathBuf::from(base_path);
    state.fs().search_files(&path, options).await
}

/// Search file contents
#[tauri::command]
pub async fn search_content(
    base_path: String,
    options: SearchOptions,
    state: State<'_, FileSystemState>,
) -> Result<Vec<SearchResult>> {
    let path = PathBuf::from(base_path);
    state.fs().search_content(&path, options).await
}

/// Read file in chunks (for large files)
#[tauri::command]
pub async fn read_file_chunked(
    path: String,
    chunk_size: usize,
    state: State<'_, FileSystemState>,
) -> Result<Vec<Vec<u8>>> {
    let path = PathBuf::from(path);
    state.fs().read_file_chunked(&path, chunk_size).await
}

/// Get file size
#[tauri::command]
pub async fn get_file_size(path: String, state: State<'_, FileSystemState>) -> Result<u64> {
    let path = PathBuf::from(path);
    state.fs().file_size(&path).await
}

// Export all command handlers for use in main app
// Note: Commands are registered directly in lib.rs using tauri::generate_handler!
