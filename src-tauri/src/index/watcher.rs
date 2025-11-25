use sha2::{Sha256, Digest};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use anyhow::{Result, Context};

/// Change detector for incremental indexing
/// Uses SHA256 hashing and mtime to detect file changes
pub struct ChangeDetector {
    /// Cached file states: path -> FileState
    cache: HashMap<PathBuf, FileState>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileState {
    pub path: PathBuf,
    pub size: u64,
    pub modified: DateTime<Utc>,
    pub hash: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FileChange {
    /// New file added
    Added(PathBuf),
    /// Existing file modified
    Modified(PathBuf),
    /// File deleted
    Deleted(PathBuf),
    /// File unchanged
    Unchanged(PathBuf),
}

impl ChangeDetector {
    pub fn new() -> Self {
        Self {
            cache: HashMap::new(),
        }
    }

    /// Load cache from disk
    pub fn load(cache_path: &Path) -> Result<Self> {
        if cache_path.exists() {
            let data = fs::read(cache_path).context("Failed to read cache file")?;
            let cache: HashMap<PathBuf, FileState> = bincode::deserialize(&data)
                .context("Failed to deserialize cache")?;
            Ok(Self { cache })
        } else {
            Ok(Self::new())
        }
    }

    /// Save cache to disk
    pub fn save(&self, cache_path: &Path) -> Result<()> {
        let data = bincode::serialize(&self.cache)
            .context("Failed to serialize cache")?;

        if let Some(parent) = cache_path.parent() {
            fs::create_dir_all(parent)?;
        }

        fs::write(cache_path, data).context("Failed to write cache file")?;
        Ok(())
    }

    /// Detect changes for a file
    pub fn detect_change(&mut self, path: &Path) -> Result<FileChange> {
        if !path.exists() {
            // File was deleted
            if self.cache.contains_key(path) {
                self.cache.remove(path);
                return Ok(FileChange::Deleted(path.to_path_buf()));
            }
            return Ok(FileChange::Unchanged(path.to_path_buf()));
        }

        let metadata = fs::metadata(path).context("Failed to read file metadata")?;

        if !metadata.is_file() {
            return Ok(FileChange::Unchanged(path.to_path_buf()));
        }

        let size = metadata.len();
        let modified = Self::system_time_to_datetime(
            metadata.modified().unwrap_or(SystemTime::now())
        );

        // Check if we have this file cached
        if let Some(cached_state) = self.cache.get(path) {
            // Quick check: if size and mtime unchanged, assume unchanged
            if cached_state.size == size && cached_state.modified == modified {
                return Ok(FileChange::Unchanged(path.to_path_buf()));
            }

            // Size or mtime changed - verify with hash
            let hash = Self::calculate_hash(path)?;

            if hash == cached_state.hash {
                // False positive - file unchanged but mtime updated
                // Update cache with new mtime
                self.cache.insert(path.to_path_buf(), FileState {
                    path: path.to_path_buf(),
                    size,
                    modified,
                    hash,
                });
                return Ok(FileChange::Unchanged(path.to_path_buf()));
            }

            // File actually modified
            self.cache.insert(path.to_path_buf(), FileState {
                path: path.to_path_buf(),
                size,
                modified,
                hash: hash.clone(),
            });
            return Ok(FileChange::Modified(path.to_path_buf()));
        }

        // New file
        let hash = Self::calculate_hash(path)?;
        self.cache.insert(path.to_path_buf(), FileState {
            path: path.to_path_buf(),
            size,
            modified,
            hash,
        });

        Ok(FileChange::Added(path.to_path_buf()))
    }

    /// Batch detect changes for multiple files
    pub fn detect_changes(&mut self, paths: &[PathBuf]) -> Result<Vec<FileChange>> {
        paths.iter()
            .map(|p| self.detect_change(p))
            .collect()
    }

    /// Calculate SHA256 hash of a file
    fn calculate_hash(path: &Path) -> Result<String> {
        let data = fs::read(path).context("Failed to read file for hashing")?;
        let mut hasher = Sha256::new();
        hasher.update(&data);
        Ok(format!("{:x}", hasher.finalize()))
    }

    /// Convert SystemTime to DateTime<Utc>
    fn system_time_to_datetime(st: SystemTime) -> DateTime<Utc> {
        DateTime::from(st)
    }

    /// Get cached state for a file
    pub fn get_cached_state(&self, path: &Path) -> Option<&FileState> {
        self.cache.get(path)
    }

    /// Remove a file from cache
    pub fn remove(&mut self, path: &Path) {
        self.cache.remove(path);
    }

    /// Clear all cache
    pub fn clear(&mut self) {
        self.cache.clear();
    }

    /// Get number of cached files
    pub fn cache_size(&self) -> usize {
        self.cache.len()
    }
}

impl Default for ChangeDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;
    use std::io::Write;

    #[test]
    fn test_detect_new_file() {
        let mut detector = ChangeDetector::new();
        let mut file = NamedTempFile::new().unwrap();
        file.write_all(b"test content").unwrap();
        file.flush().unwrap();

        let change = detector.detect_change(file.path()).unwrap();
        assert!(matches!(change, FileChange::Added(_)));
    }

    #[test]
    fn test_detect_unchanged_file() {
        let mut detector = ChangeDetector::new();
        let mut file = NamedTempFile::new().unwrap();
        file.write_all(b"test content").unwrap();
        file.flush().unwrap();

        // First detection - added
        detector.detect_change(file.path()).unwrap();

        // Second detection - unchanged
        let change = detector.detect_change(file.path()).unwrap();
        assert!(matches!(change, FileChange::Unchanged(_)));
    }

    #[test]
    fn test_detect_modified_file() {
        let mut detector = ChangeDetector::new();
        let mut file = NamedTempFile::new().unwrap();
        file.write_all(b"test content").unwrap();
        file.flush().unwrap();

        // First detection
        detector.detect_change(file.path()).unwrap();

        // Modify file
        std::thread::sleep(std::time::Duration::from_millis(100));
        file.write_all(b" modified").unwrap();
        file.flush().unwrap();

        // Second detection - modified
        let change = detector.detect_change(file.path()).unwrap();
        assert!(matches!(change, FileChange::Modified(_)));
    }
}
