use async_trait::async_trait;
use std::path::{Path, PathBuf};

use super::error::Result;
use super::types::*;

/// Core file system abstraction trait
///
/// This trait provides a common interface for different storage backends
/// (local filesystem, S3, etc.) with async operations and parallel support.
#[async_trait]
pub trait FileSystem: Send + Sync {
    /// Read the entire contents of a file
    async fn read_file(&self, path: &Path) -> Result<Vec<u8>>;

    /// Read file as UTF-8 string
    async fn read_to_string(&self, path: &Path) -> Result<String>;

    /// Write data to a file (creates or overwrites)
    async fn write_file(&self, path: &Path, data: &[u8]) -> Result<()>;

    /// Check if a path exists
    async fn exists(&self, path: &Path) -> Result<bool>;

    /// Check if path is a file
    async fn is_file(&self, path: &Path) -> Result<bool>;

    /// Check if path is a directory
    async fn is_dir(&self, path: &Path) -> Result<bool>;

    /// Get file metadata
    async fn metadata(&self, path: &Path) -> Result<FileMetadata>;

    /// List directory contents (non-recursive)
    async fn list_dir(&self, path: &Path) -> Result<Vec<FileInfo>>;

    /// Recursively scan directory with options
    async fn scan_directory(&self, path: &Path, options: DirectoryScanOptions) -> Result<FileInfo>;

    /// Delete a file
    async fn delete_file(&self, path: &Path) -> Result<()>;

    /// Delete a directory (recursive)
    async fn delete_dir(&self, path: &Path) -> Result<()>;

    /// Create a directory (with parents if needed)
    async fn create_dir(&self, path: &Path) -> Result<()>;

    /// Copy a file
    async fn copy_file(&self, from: &Path, to: &Path) -> Result<()>;

    /// Move/rename a file or directory
    async fn move_path(&self, from: &Path, to: &Path) -> Result<()>;

    /// Calculate file hashes (MD5, SHA256)
    async fn calculate_hash(&self, path: &Path) -> Result<FileHash>;

    /// Search for files matching a pattern
    async fn search_files(&self, base_path: &Path, options: SearchOptions) -> Result<Vec<PathBuf>>;

    /// Search file contents
    async fn search_content(
        &self,
        base_path: &Path,
        options: SearchOptions,
    ) -> Result<Vec<SearchResult>>;

    /// Read file in chunks (for large files)
    async fn read_file_chunked(&self, path: &Path, chunk_size: usize) -> Result<Vec<Vec<u8>>>;

    /// Get file size without reading entire file
    async fn file_size(&self, path: &Path) -> Result<u64>;
}

/// Builder for creating file system instances
pub struct FileSystemBuilder {
    backend_type: BackendType,
}

#[derive(Debug, Clone, Copy)]
pub enum BackendType {
    Local,
    // Future: S3, Azure, GCS, etc.
}

impl FileSystemBuilder {
    pub fn new(backend_type: BackendType) -> Self {
        Self { backend_type }
    }

    pub fn local() -> Self {
        Self::new(BackendType::Local)
    }

    pub fn build(self) -> Box<dyn FileSystem> {
        match self.backend_type {
            BackendType::Local => Box::new(super::local::LocalFileSystem::new()),
        }
    }
}
