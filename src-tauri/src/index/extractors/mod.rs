// Type-specific extractors for different file formats
// Each extractor knows how to extract searchable data from its file type

use super::schema::{FileCategory, StructuredData};
use anyhow::Result;
use std::collections::HashMap;
use std::path::Path;

mod csv_extractor;
mod excel;
mod indexeddb;
mod json;
mod leveldb;
mod sqlite;
mod text;
mod xml;

pub use csv_extractor::CsvExtractor;
pub use excel::ExcelExtractor;
pub use indexeddb::IndexedDbExtractor;
pub use json::JsonExtractor;
pub use leveldb::LevelDbExtractor;
pub use sqlite::SqliteExtractor;
pub use text::TextExtractor;
pub use xml::XmlExtractor;

/// Trait for file content extractors
pub trait Extractor: Send + Sync {
    /// Extract structured data from a file
    fn extract(&self, path: &Path) -> Result<ExtractorOutput>;

    /// Check if this extractor can handle the file
    fn can_handle(&self, category: FileCategory, mime_type: &str) -> bool;

    /// Get extractor name
    fn name(&self) -> &'static str;
}

/// Output from an extractor
#[derive(Debug)]
pub struct ExtractorOutput {
    /// Structured data (if applicable)
    pub structured: Option<StructuredData>,

    /// Full text content (if applicable)
    pub content: Option<String>,

    /// Short preview (max 500 chars)
    pub preview: String,

    /// Searchable fields (key-value pairs for indexing)
    pub fields: HashMap<String, String>,
}

/// Registry of all extractors
pub struct ExtractorRegistry {
    extractors: Vec<Box<dyn Extractor>>,
}

impl ExtractorRegistry {
    /// Create a new registry with all built-in extractors
    pub fn new() -> Self {
        let mut registry = Self {
            extractors: Vec::new(),
        };

        // Register all extractors
        registry.register(Box::new(SqliteExtractor));
        registry.register(Box::new(JsonExtractor));
        registry.register(Box::new(CsvExtractor));
        registry.register(Box::new(ExcelExtractor));
        registry.register(Box::new(XmlExtractor));
        registry.register(Box::new(TextExtractor));
        registry.register(Box::new(LevelDbExtractor));
        registry.register(Box::new(IndexedDbExtractor));

        registry
    }

    /// Register a custom extractor
    pub fn register(&mut self, extractor: Box<dyn Extractor>) {
        self.extractors.push(extractor);
    }

    /// Clone by creating a new registry
    pub fn duplicate(&self) -> Self {
        Self::new()
    }

    /// Find an extractor for a file
    pub fn find_extractor(
        &self,
        category: FileCategory,
        mime_type: &str,
    ) -> Option<&dyn Extractor> {
        self.extractors
            .iter()
            .find(|e| e.can_handle(category, mime_type))
            .map(|e| e.as_ref())
    }

    /// Extract data using the appropriate extractor
    pub fn extract(
        &self,
        path: &Path,
        category: FileCategory,
        mime_type: &str,
    ) -> Result<ExtractorOutput> {
        if let Some(extractor) = self.find_extractor(category, mime_type) {
            extractor.extract(path)
        } else {
            // No specific extractor, return minimal output
            Ok(ExtractorOutput {
                structured: None,
                content: None,
                preview: format!("{} file", mime_type),
                fields: HashMap::new(),
            })
        }
    }
}

impl Default for ExtractorRegistry {
    fn default() -> Self {
        Self::new()
    }
}
