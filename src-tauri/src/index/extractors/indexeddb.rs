use super::{Extractor, ExtractorOutput};
use crate::index::schema::{FileCategory, StructuredData};
use anyhow::{Context, Result};
use std::collections::HashMap;
use std::path::Path;

/// IndexedDB extractor for Chrome/Chromium dumps
/// IndexedDB stores data in LevelDB, but Chrome also maintains SQLite metadata
pub struct IndexedDbExtractor;

impl Extractor for IndexedDbExtractor {
    fn extract(&self, path: &Path) -> Result<ExtractorOutput> {
        // IndexedDB is a directory-based database
        if !path.is_dir() {
            anyhow::bail!("IndexedDB path must be a directory");
        }

        // Check for IndexedDB structure
        if !self.is_indexeddb_directory(path)? {
            anyhow::bail!("Not a valid IndexedDB directory");
        }

        // Extract metadata from IndexedDB.leveldb if it exists
        let leveldb_path = path.join("IndexedDB.leveldb");
        let (databases, total_keys) = if leveldb_path.exists() {
            self.extract_from_leveldb(&leveldb_path)?
        } else {
            self.extract_from_directory(path)?
        };

        // Build searchable fields
        let mut fields = HashMap::new();
        fields.insert("database_type".to_string(), "indexeddb".to_string());
        fields.insert("databases".to_string(), databases.join(", "));
        fields.insert("database_count".to_string(), databases.len().to_string());
        fields.insert("total_keys".to_string(), total_keys.to_string());

        let preview = format!(
            "Chrome IndexedDB: {} databases ({}), ~{} records",
            databases.len(),
            databases.join(", "),
            total_keys
        );

        // For now, represent IndexedDB as SQLite (since Chrome uses SQLite for metadata)
        // In the future, we can add a dedicated IndexedDB structured type
        Ok(ExtractorOutput {
            structured: Some(StructuredData::Sqlite {
                tables: vec![], // Would need to parse LevelDB to get actual structure
                total_rows: total_keys,
                page_size: 0,
                version: "IndexedDB".to_string(),
            }),
            content: None,
            preview: preview.chars().take(500).collect(),
            fields,
        })
    }

    fn can_handle(&self, category: FileCategory, _mime_type: &str) -> bool {
        // We'll detect IndexedDB by directory structure during indexing
        category == FileCategory::Database
    }

    fn name(&self) -> &'static str {
        "indexeddb"
    }
}

impl IndexedDbExtractor {
    /// Check if directory contains IndexedDB structure
    fn is_indexeddb_directory(&self, path: &Path) -> Result<bool> {
        // Check for common IndexedDB files/directories
        let leveldb_dir = path.join("IndexedDB.leveldb");
        let blob_dir = path.join("blob_storage");

        // Look for .indexeddb files or leveldb subdirectory
        if leveldb_dir.exists() {
            return Ok(true);
        }

        // Check for any .indexeddb files
        for entry in std::fs::read_dir(path)? {
            let entry = entry?;
            if let Some(ext) = entry.path().extension() {
                if ext == "indexeddb" {
                    return Ok(true);
                }
            }
        }

        Ok(blob_dir.exists())
    }

    /// Extract database information from LevelDB
    fn extract_from_leveldb(&self, leveldb_path: &Path) -> Result<(Vec<String>, u64)> {
        // Simplified: just estimate from file structure
        let mut total_size = 0u64;

        for entry in std::fs::read_dir(leveldb_path)? {
            let entry = entry?;
            if entry.path().is_file() {
                total_size += entry.metadata()?.len();
            }
        }

        // Estimate key count
        let total_keys = total_size / 100; // Rough estimate

        // Try to find database names from file structure
        let databases = vec!["indexeddb".to_string()]; // Placeholder

        Ok((databases, total_keys))
    }

    /// Extract database information from directory structure
    fn extract_from_directory(&self, path: &Path) -> Result<(Vec<String>, u64)> {
        let mut databases = Vec::new();
        let mut total_keys = 0u64;

        // Look for subdirectories that represent databases
        for entry in std::fs::read_dir(path)? {
            let entry = entry?;
            let entry_path = entry.path();

            if entry_path.is_dir() {
                if let Some(name) = entry_path.file_name() {
                    let name_str = name.to_string_lossy().to_string();

                    // Check if it's a database directory
                    if name_str.ends_with(".indexeddb") {
                        databases.push(name_str.replace(".indexeddb", ""));

                        // Try to count keys in this database
                        if let Ok(count) = self.count_keys_in_db(&entry_path) {
                            total_keys += count;
                        }
                    }
                }
            }
        }

        Ok((databases, total_keys))
    }

    /// Parse database name from IndexedDB key
    fn parse_database_name(&self, key: &str) -> Option<String> {
        // IndexedDB keys have various formats
        // Try to extract meaningful database identifiers

        // Format: "database-name@1"
        if let Some(at_pos) = key.find('@') {
            return Some(key[..at_pos].to_string());
        }

        // Format: "db-id-X-name"
        if key.starts_with("db-") {
            if let Some(parts) = key.split('-').nth(3) {
                return Some(parts.to_string());
            }
        }

        None
    }

    /// Count keys in a database directory
    fn count_keys_in_db(&self, db_path: &Path) -> Result<u64> {
        // Estimate from file sizes
        let mut total_size = 0u64;

        for entry in std::fs::read_dir(db_path)? {
            let entry = entry?;
            if entry.path().is_file() {
                total_size += entry.metadata()?.len();
            }
        }

        Ok(total_size / 100) // Rough estimate
    }
}
