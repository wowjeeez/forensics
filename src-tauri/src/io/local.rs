use async_trait::async_trait;
use chrono::{DateTime, Utc};
use log::info;
use md5::Md5;
use rayon::prelude::*;
use sha2::Digest;
use sha2::Sha256;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use tokio::fs;
use tokio::io::AsyncReadExt;

use super::error::{FileSystemError, Result};
use super::fs::FileSystem;
use super::types::*;

/// Local file system implementation using tokio::fs
#[derive(Debug, Clone)]
pub struct LocalFileSystem {
    // Could add configuration here like root path, permissions, etc.
}

impl LocalFileSystem {
    pub fn new() -> Self {
        Self {}
    }

    /// Helper to convert std::time::SystemTime to chrono::DateTime<Utc>
    fn system_time_to_datetime(st: SystemTime) -> Option<DateTime<Utc>> {
        st.duration_since(SystemTime::UNIX_EPOCH)
            .ok()
            .map(|d| DateTime::from_timestamp(d.as_secs() as i64, d.subsec_nanos()))
            .flatten()
    }

    /// Helper to extract file permissions
    #[cfg(unix)]
    fn extract_permissions(metadata: &std::fs::Metadata) -> FilePermissions {
        use std::os::unix::fs::PermissionsExt;
        let mode = metadata.permissions().mode();
        FilePermissions {
            readonly: metadata.permissions().readonly(),
            can_read: (mode & 0o400) != 0,
            can_write: (mode & 0o200) != 0,
            can_execute: (mode & 0o100) != 0,
        }
    }

    #[cfg(not(unix))]
    fn extract_permissions(metadata: &std::fs::Metadata) -> FilePermissions {
        FilePermissions {
            readonly: metadata.permissions().readonly(),
            can_read: true,
            can_write: !metadata.permissions().readonly(),
            can_execute: false,
        }
    }

    /// Convert tokio metadata to our FileMetadata type
    async fn to_file_metadata(path: &Path) -> Result<FileMetadata> {
        let metadata = fs::metadata(path).await?;
        let std_metadata = std::fs::metadata(path)?;

        let modified = metadata
            .modified()
            .ok()
            .and_then(Self::system_time_to_datetime)
            .unwrap_or_else(|| Utc::now());

        let created = metadata
            .created()
            .ok()
            .and_then(Self::system_time_to_datetime);
        let accessed = metadata
            .accessed()
            .ok()
            .and_then(Self::system_time_to_datetime);

        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_string());

        let mime_type = extension.as_ref().and_then(|ext| {
            match ext.as_str() {
                "txt" | "log" => Some("text/plain"),
                "json" => Some("application/json"),
                "xml" => Some("application/xml"),
                "html" | "htm" => Some("text/html"),
                "css" => Some("text/css"),
                "js" => Some("application/javascript"),
                "png" => Some("image/png"),
                "jpg" | "jpeg" => Some("image/jpeg"),
                "gif" => Some("image/gif"),
                "svg" => Some("image/svg+xml"),
                "pdf" => Some("application/pdf"),
                "zip" => Some("application/zip"),
                _ => None,
            }
            .map(|s| s.to_string())
        });

        Ok(FileMetadata {
            path: path.to_path_buf(),
            size: metadata.len(),
            modified,
            created,
            accessed,
            is_file: metadata.is_file(),
            is_dir: metadata.is_dir(),
            is_symlink: metadata.is_symlink(),
            permissions: Self::extract_permissions(&std_metadata),
            mime_type,
            extension,
        })
    }

    /// Convert metadata to FileInfo
    async fn to_file_info(path: &Path) -> Result<FileInfo> {
        let metadata = Self::to_file_metadata(path).await?;
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        let file_type = if metadata.is_dir {
            FileType::Directory
        } else if metadata.is_symlink {
            FileType::Symlink
        } else if metadata.is_file {
            FileType::File
        } else {
            FileType::Unknown
        };

        // Generate a simple ID based on path
        let mut hasher = Md5::new();
        hasher.update(path.to_string_lossy().as_bytes());
        let id = format!("{:x}", hasher.finalize());

        Ok(FileInfo {
            id,
            name,
            path: path.to_path_buf(),
            file_type,
            size: Some(metadata.size),
            modified: Some(metadata.modified),
            created: metadata.created,
            accessed: metadata.accessed,
            permissions: Some(metadata.permissions),
            children: None,
        })
    }

    /// Parallel directory scan implementation
    fn scan_directory_parallel(
        path: &Path,
        options: &DirectoryScanOptions,
        current_depth: usize,
    ) -> Result<FileInfo> {
        let mut info = std::fs::metadata(path)
            .map_err(|_| FileSystemError::DirectoryNotFound {
                path: path.to_path_buf(),
            })
            .and_then(|_| {
                // We need to use blocking operations here for rayon
                let metadata = std::fs::metadata(path)?;
                let name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();

                let modified = metadata
                    .modified()
                    .ok()
                    .and_then(Self::system_time_to_datetime)
                    .unwrap_or_else(|| Utc::now());

                let mut hasher = Md5::new();
                hasher.update(path.to_string_lossy().as_bytes());
                let id = format!("{:x}", hasher.finalize());

                Ok(FileInfo {
                    id,
                    name,
                    path: path.to_path_buf(),
                    file_type: FileType::Directory,
                    size: None,
                    modified: Some(modified),
                    created: metadata
                        .created()
                        .ok()
                        .and_then(Self::system_time_to_datetime),
                    accessed: metadata
                        .accessed()
                        .ok()
                        .and_then(Self::system_time_to_datetime),
                    permissions: Some(Self::extract_permissions(&metadata)),
                    children: Some(Vec::new()),
                })
            })?;

        // Check depth limit
        if let Some(max_depth) = options.max_depth {
            if current_depth >= max_depth {
                return Ok(info);
            }
        }

        // Read directory entries
        let entries: Vec<_> = std::fs::read_dir(path)
            .map_err(|e| FileSystemError::IoError(e))?
            .filter_map(|entry| entry.ok())
            .filter(|entry| {
                if !options.include_hidden {
                    if let Some(name) = entry.file_name().to_str() {
                        if name.starts_with('.') {
                            return false;
                        }
                    }
                }
                true
            })
            .collect();

        // Process entries in parallel
        let children: Vec<FileInfo> = entries
            .par_iter()
            .filter_map(|entry| {
                let path = entry.path();
                let metadata = std::fs::metadata(&path).ok()?;

                if metadata.is_dir() {
                    // Recursively scan subdirectory
                    Self::scan_directory_parallel(&path, options, current_depth + 1).ok()
                } else {
                    // Create FileInfo for file
                    let name = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("")
                        .to_string();

                    let modified = metadata
                        .modified()
                        .ok()
                        .and_then(Self::system_time_to_datetime)
                        .unwrap_or_else(|| Utc::now());

                    let mut hasher = Md5::new();
                    hasher.update(path.to_string_lossy().as_bytes());
                    let id = format!("{:x}", hasher.finalize());

                    let file_type = if metadata.is_symlink() {
                        FileType::Symlink
                    } else {
                        FileType::File
                    };

                    Some(FileInfo {
                        id,
                        name,
                        path: path.clone(),
                        file_type,
                        size: Some(metadata.len()),
                        modified: Some(modified),
                        created: metadata
                            .created()
                            .ok()
                            .and_then(Self::system_time_to_datetime),
                        accessed: metadata
                            .accessed()
                            .ok()
                            .and_then(Self::system_time_to_datetime),
                        permissions: Some(Self::extract_permissions(&metadata)),
                        children: None,
                    })
                }
            })
            .collect();

        info.children = Some(children);
        Ok(info)
    }
}

#[async_trait]
impl FileSystem for LocalFileSystem {
    async fn read_file(&self, path: &Path) -> Result<Vec<u8>> {
        fs::read(path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                FileSystemError::FileNotFound {
                    path: path.to_path_buf(),
                }
            } else if e.kind() == std::io::ErrorKind::PermissionDenied {
                FileSystemError::PermissionDenied {
                    path: path.to_path_buf(),
                }
            } else {
                FileSystemError::IoError(e)
            }
        })
    }

    async fn read_to_string(&self, path: &Path) -> Result<String> {
        fs::read_to_string(path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                FileSystemError::FileNotFound {
                    path: path.to_path_buf(),
                }
            } else {
                FileSystemError::IoError(e)
            }
        })
    }

    async fn write_file(&self, path: &Path, data: &[u8]) -> Result<()> {
        // Create parent directories if they don't exist
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await?;
        }
        fs::write(path, data)
            .await
            .map_err(FileSystemError::IoError)
    }

    async fn exists(&self, path: &Path) -> Result<bool> {
        Ok(fs::try_exists(path).await.unwrap_or(false))
    }

    async fn is_file(&self, path: &Path) -> Result<bool> {
        match fs::metadata(path).await {
            Ok(metadata) => Ok(metadata.is_file()),
            Err(_) => Ok(false),
        }
    }

    async fn is_dir(&self, path: &Path) -> Result<bool> {
        match fs::metadata(path).await {
            Ok(metadata) => Ok(metadata.is_dir()),
            Err(_) => Ok(false),
        }
    }

    async fn metadata(&self, path: &Path) -> Result<FileMetadata> {
        Self::to_file_metadata(path).await
    }

    async fn list_dir(&self, path: &Path) -> Result<Vec<FileInfo>> {
        if !self.is_dir(path).await? {
            return Err(FileSystemError::NotADirectory {
                path: path.to_path_buf(),
            });
        }

        let mut entries = fs::read_dir(path).await?;
        let mut files = Vec::new();

        while let Some(entry) = entries.next_entry().await? {
            match Self::to_file_info(&entry.path()).await {
                Ok(info) => files.push(info),
                Err(_) => continue, // Skip files we can't read
            }
        }

        Ok(files)
    }

    async fn scan_directory(&self, path: &Path, options: DirectoryScanOptions) -> Result<FileInfo> {
        if !self.is_dir(path).await? {
            return Err(FileSystemError::NotADirectory {
                path: path.to_path_buf(),
            });
        }
        info!(
            "Scanning directory: {:?} (parallel: {})",
            path, options.parallel
        );

        if options.parallel {
            // Use rayon for parallel scanning
            let path = path.to_path_buf();
            let opts = options.clone();
            tokio::task::spawn_blocking(move || Self::scan_directory_parallel(&path, &opts, 0))
                .await
                .map_err(|e| FileSystemError::Unknown(e.to_string()))?
        } else {
            // Sequential scan using async
            let mut info = Self::to_file_info(path).await?;

            if let Some(max_depth) = options.max_depth {
                if max_depth == 0 {
                    return Ok(info);
                }
            }

            let entries = self.list_dir(path).await?;
            info.children = Some(entries);
            Ok(info)
        }
    }

    async fn delete_file(&self, path: &Path) -> Result<()> {
        if !self.is_file(path).await? {
            return Err(FileSystemError::NotAFile {
                path: path.to_path_buf(),
            });
        }
        fs::remove_file(path)
            .await
            .map_err(FileSystemError::IoError)
    }

    async fn delete_dir(&self, path: &Path) -> Result<()> {
        if !self.is_dir(path).await? {
            return Err(FileSystemError::NotADirectory {
                path: path.to_path_buf(),
            });
        }
        fs::remove_dir_all(path)
            .await
            .map_err(FileSystemError::IoError)
    }

    async fn create_dir(&self, path: &Path) -> Result<()> {
        fs::create_dir_all(path)
            .await
            .map_err(FileSystemError::IoError)
    }

    async fn copy_file(&self, from: &Path, to: &Path) -> Result<()> {
        if !self.is_file(from).await? {
            return Err(FileSystemError::NotAFile {
                path: from.to_path_buf(),
            });
        }
        fs::copy(from, to).await?;
        Ok(())
    }

    async fn move_path(&self, from: &Path, to: &Path) -> Result<()> {
        fs::rename(from, to).await.map_err(FileSystemError::IoError)
    }

    async fn calculate_hash(&self, path: &Path) -> Result<FileHash> {
        let data = self.read_file(path).await?;

        // Calculate MD5
        let mut md5_hasher = Md5::new();
        md5_hasher.update(&data);
        let md5 = format!("{:x}", md5_hasher.finalize());

        // Calculate SHA256
        let mut sha256_hasher = Sha256::new();
        sha256_hasher.update(&data);
        let sha256 = format!("{:x}", sha256_hasher.finalize());

        Ok(FileHash {
            path: path.to_path_buf(),
            md5,
            sha256,
        })
    }

    async fn search_files(&self, base_path: &Path, options: SearchOptions) -> Result<Vec<PathBuf>> {
        let base_path = base_path.to_path_buf();
        let opts = options.clone();

        tokio::task::spawn_blocking(move || {
            let mut results = Vec::new();
            Self::search_files_recursive(&base_path, &opts, &mut results, 0)?;

            if let Some(max) = opts.max_results {
                results.truncate(max);
            }

            Ok(results)
        })
        .await
        .map_err(|e| FileSystemError::Unknown(e.to_string()))?
    }

    async fn search_content(
        &self,
        base_path: &Path,
        options: SearchOptions,
    ) -> Result<Vec<SearchResult>> {
        let base_path = base_path.to_path_buf();
        let opts = options.clone();

        tokio::task::spawn_blocking(move || {
            let mut results = Vec::new();
            Self::search_content_recursive(&base_path, &opts, &mut results, 0)?;

            if let Some(max) = opts.max_results {
                results.truncate(max);
            }

            Ok(results)
        })
        .await
        .map_err(|e| FileSystemError::Unknown(e.to_string()))?
    }

    async fn read_file_chunked(&self, path: &Path, chunk_size: usize) -> Result<Vec<Vec<u8>>> {
        let mut file = fs::File::open(path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                FileSystemError::FileNotFound {
                    path: path.to_path_buf(),
                }
            } else {
                FileSystemError::IoError(e)
            }
        })?;

        let mut chunks = Vec::new();
        let mut buffer = vec![0u8; chunk_size];

        loop {
            let n = file.read(&mut buffer).await?;
            if n == 0 {
                break;
            }
            chunks.push(buffer[..n].to_vec());
        }

        Ok(chunks)
    }

    async fn file_size(&self, path: &Path) -> Result<u64> {
        let metadata = fs::metadata(path).await.map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                FileSystemError::FileNotFound {
                    path: path.to_path_buf(),
                }
            } else {
                FileSystemError::IoError(e)
            }
        })?;
        Ok(metadata.len())
    }
}

impl LocalFileSystem {
    fn search_files_recursive(
        path: &Path,
        options: &SearchOptions,
        results: &mut Vec<PathBuf>,
        depth: usize,
    ) -> Result<()> {
        if let Some(max_depth) = options.max_depth {
            if depth >= max_depth {
                return Ok(());
            }
        }

        if let Some(max) = options.max_results {
            if results.len() >= max {
                return Ok(());
            }
        }

        let entries = std::fs::read_dir(path)?;

        for entry in entries.filter_map(|e| e.ok()) {
            let entry_path = entry.path();

            // Skip hidden files if needed
            if !options.include_hidden {
                if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with('.') {
                        continue;
                    }
                }
            }

            if entry_path.is_dir() {
                Self::search_files_recursive(&entry_path, options, results, depth + 1)?;
            } else if entry_path.is_file() {
                // Check file extension filter
                if let Some(exts) = &options.file_extensions {
                    if let Some(ext) = entry_path.extension().and_then(|e| e.to_str()) {
                        if !exts.contains(&ext.to_string()) {
                            continue;
                        }
                    } else {
                        continue;
                    }
                }

                // Match against pattern
                if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
                    let matches = if options.regex {
                        // TODO: Use regex crate for proper regex matching
                        name.contains(&options.pattern)
                    } else if options.case_sensitive {
                        name.contains(&options.pattern)
                    } else {
                        name.to_lowercase()
                            .contains(&options.pattern.to_lowercase())
                    };

                    if matches {
                        results.push(entry_path);
                    }
                }
            }
        }

        Ok(())
    }

    fn search_content_recursive(
        path: &Path,
        options: &SearchOptions,
        results: &mut Vec<SearchResult>,
        depth: usize,
    ) -> Result<()> {
        if let Some(max_depth) = options.max_depth {
            if depth >= max_depth {
                return Ok(());
            }
        }

        if let Some(max) = options.max_results {
            if results.len() >= max {
                return Ok(());
            }
        }

        let entries = std::fs::read_dir(path)?;

        for entry in entries.filter_map(|e| e.ok()) {
            let entry_path = entry.path();

            if !options.include_hidden {
                if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with('.') {
                        continue;
                    }
                }
            }

            if entry_path.is_dir() {
                Self::search_content_recursive(&entry_path, options, results, depth + 1)?;
            } else if entry_path.is_file() {
                // Try to read file as text
                if let Ok(content) = std::fs::read_to_string(&entry_path) {
                    for (line_num, line) in content.lines().enumerate() {
                        let matches = if options.regex {
                            // TODO: Use regex crate
                            line.contains(&options.pattern)
                        } else if options.case_sensitive {
                            line.contains(&options.pattern)
                        } else {
                            line.to_lowercase()
                                .contains(&options.pattern.to_lowercase())
                        };

                        if matches {
                            if let Some(col) = line.find(&options.pattern) {
                                results.push(SearchResult {
                                    path: entry_path.clone(),
                                    line: line_num + 1,
                                    column: col,
                                    content: line.to_string(),
                                    r#match: options.pattern.clone(),
                                });

                                if let Some(max) = options.max_results {
                                    if results.len() >= max {
                                        return Ok(());
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_local_fs_read_write() {
        let fs = LocalFileSystem::new();
        let test_path = Path::new("/tmp/test_detective.txt");

        let data = b"Hello, World!";
        fs.write_file(test_path, data).await.unwrap();

        let read_data = fs.read_file(test_path).await.unwrap();
        assert_eq!(data, &read_data[..]);

        fs.delete_file(test_path).await.unwrap();
    }
}
