use super::{Extractor, ExtractorOutput};
use crate::index::schema::FileCategory;
use anyhow::{Result, Context};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

pub struct TextExtractor;

impl Extractor for TextExtractor {
    fn extract(&self, path: &Path) -> Result<ExtractorOutput> {
        let content = fs::read_to_string(path).context("Failed to read text file")?;

        // Calculate stats
        let line_count = content.lines().count();
        let word_count = content.split_whitespace().count();

        // Build searchable fields
        let mut fields = HashMap::new();
        fields.insert("format".to_string(), "text".to_string());
        fields.insert("line_count".to_string(), line_count.to_string());
        fields.insert("word_count".to_string(), word_count.to_string());
        fields.insert("char_count".to_string(), content.len().to_string());

        // Create preview
        let preview = if content.len() > 500 {
            format!("{}\n...", &content[..497])
        } else {
            content.clone()
        };

        Ok(ExtractorOutput {
            structured: None,
            content: Some(content),
            preview,
            fields,
        })
    }

    fn can_handle(&self, category: FileCategory, _mime_type: &str) -> bool {
        category == FileCategory::Text
    }

    fn name(&self) -> &'static str {
        "text"
    }
}
