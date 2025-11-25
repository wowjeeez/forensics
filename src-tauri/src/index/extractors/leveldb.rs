use super::{Extractor, ExtractorOutput};
use crate::index::schema::{FileCategory, StructuredData};
use anyhow::{Result, Context};
use std::collections::HashMap;
use std::path::Path;

pub struct LevelDbExtractor;

impl Extractor for LevelDbExtractor {
    fn extract(&self, path: &Path) -> Result<ExtractorOutput> {
        // LevelDB is a directory-based database
        if !path.is_dir() {
            anyhow::bail!("LevelDB path must be a directory");
        }

        // Check for LevelDB files
        if !self.is_leveldb_directory(path)? {
            anyhow::bail!("Not a valid LevelDB directory");
        }

        // Estimate size and key count from files
        let (key_count, approximate_size) = self.estimate_from_files(path)?;

        // Build searchable fields
        let mut fields = HashMap::new();
        fields.insert("database_type".to_string(), "leveldb".to_string());
        fields.insert("key_count".to_string(), key_count.to_string());
        fields.insert("approximate_size".to_string(), approximate_size.to_string());

        let preview = format!(
            "LevelDB database: ~{} keys, ~{} bytes",
            key_count,
            approximate_size
        );

        Ok(ExtractorOutput {
            structured: Some(StructuredData::LevelDb {
                key_count,
                approximate_size,
            }),
            content: None,
            preview: preview.chars().take(500).collect(),
            fields,
        })
    }

    fn can_handle(&self, category: FileCategory, mime_type: &str) -> bool {
        category == FileCategory::Database
            && (mime_type.contains("leveldb") || mime_type.contains("x-leveldb"))
    }

    fn name(&self) -> &'static str {
        "leveldb"
    }
}

impl LevelDbExtractor {
    /// Check if directory contains LevelDB files
    fn is_leveldb_directory(&self, path: &Path) -> Result<bool> {
        // LevelDB directories typically contain CURRENT, LOCK, LOG files
        let current_file = path.join("CURRENT");
        let lock_file = path.join("LOCK");
        let manifest_file = path.join("MANIFEST-000001");

        Ok(current_file.exists() || lock_file.exists() || manifest_file.exists())
    }

    /// Estimate from file sizes
    fn estimate_from_files(&self, path: &Path) -> Result<(u64, u64)> {
        let mut total_size = 0u64;

        for entry in std::fs::read_dir(path)? {
            let entry = entry?;
            if entry.path().is_file() {
                total_size += entry.metadata()?.len();
            }
        }

        // Rough estimate: average 100 bytes per key-value pair
        let key_count = total_size / 100;

        Ok((key_count, total_size))
    }
}
