use super::{Extractor, ExtractorOutput};
use crate::index::schema::{FileCategory, JsonPath, JsonValueType, StructuredData};
use anyhow::{Context, Result};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

pub struct JsonExtractor;

impl Extractor for JsonExtractor {
    fn extract(&self, path: &Path) -> Result<ExtractorOutput> {
        let content = fs::read_to_string(path).context("Failed to read JSON file")?;

        // Parse JSON
        let value: Value = serde_json::from_str(&content).context("Failed to parse JSON")?;

        // Extract structure
        let paths = self.extract_paths(&value, "$");
        let (depth, object_count, array_count) = self.analyze_structure(&value);

        // Build searchable fields
        let mut fields = HashMap::new();
        fields.insert("format".to_string(), "json".to_string());
        fields.insert("depth".to_string(), depth.to_string());
        fields.insert("object_count".to_string(), object_count.to_string());
        fields.insert("array_count".to_string(), array_count.to_string());

        // Add all paths for searching
        let path_strings: Vec<String> = paths.iter().map(|p| p.path.clone()).collect();
        fields.insert("paths".to_string(), path_strings.join(" "));

        // Create preview
        let preview = if content.len() > 500 {
            format!("{}\n...", &content[..497])
        } else {
            content.clone()
        };

        Ok(ExtractorOutput {
            structured: Some(StructuredData::Json {
                paths,
                depth,
                object_count,
                array_count,
            }),
            content: Some(content),
            preview,
            fields,
        })
    }

    fn can_handle(&self, category: FileCategory, mime_type: &str) -> bool {
        category == FileCategory::StructuredData
            && (mime_type == "application/json" || mime_type == "text/json")
    }

    fn name(&self) -> &'static str {
        "json"
    }
}

impl JsonExtractor {
    /// Extract all JSON paths from the value
    fn extract_paths(&self, value: &Value, current_path: &str) -> Vec<JsonPath> {
        let mut paths = Vec::new();
        self.extract_paths_recursive(value, current_path, &mut paths, 0);
        paths
    }

    fn extract_paths_recursive(
        &self,
        value: &Value,
        current_path: &str,
        paths: &mut Vec<JsonPath>,
        depth: usize,
    ) {
        // Limit depth to prevent explosion on deeply nested structures
        if depth > 20 {
            return;
        }

        match value {
            Value::Object(map) => {
                for (key, val) in map {
                    let path = format!("{}.{}", current_path, key);
                    paths.push(JsonPath {
                        path: path.clone(),
                        value_type: Self::get_value_type(val),
                        sample: Self::get_sample(val),
                    });
                    self.extract_paths_recursive(val, &path, paths, depth + 1);
                }
            }
            Value::Array(arr) => {
                for (idx, val) in arr.iter().enumerate().take(3) {
                    // Sample first 3 items
                    let path = format!("{}[{}]", current_path, idx);
                    paths.push(JsonPath {
                        path: path.clone(),
                        value_type: Self::get_value_type(val),
                        sample: Self::get_sample(val),
                    });
                    self.extract_paths_recursive(val, &path, paths, depth + 1);
                }
            }
            _ => {}
        }
    }

    fn get_value_type(value: &Value) -> JsonValueType {
        match value {
            Value::String(_) => JsonValueType::String,
            Value::Number(_) => JsonValueType::Number,
            Value::Bool(_) => JsonValueType::Boolean,
            Value::Null => JsonValueType::Null,
            Value::Object(_) => JsonValueType::Object,
            Value::Array(_) => JsonValueType::Array,
        }
    }

    fn get_sample(value: &Value) -> Option<String> {
        match value {
            Value::String(s) => {
                if s.len() > 100 {
                    Some(format!("{}...", &s[..97]))
                } else {
                    Some(s.clone())
                }
            }
            Value::Number(n) => Some(n.to_string()),
            Value::Bool(b) => Some(b.to_string()),
            Value::Null => Some("null".to_string()),
            _ => None,
        }
    }

    fn analyze_structure(&self, value: &Value) -> (usize, usize, usize) {
        let mut max_depth = 0;
        let mut object_count = 0;
        let mut array_count = 0;

        self.analyze_recursive(
            value,
            0,
            &mut max_depth,
            &mut object_count,
            &mut array_count,
        );

        (max_depth, object_count, array_count)
    }

    fn analyze_recursive(
        &self,
        value: &Value,
        depth: usize,
        max_depth: &mut usize,
        object_count: &mut usize,
        array_count: &mut usize,
    ) {
        *max_depth = (*max_depth).max(depth);

        match value {
            Value::Object(map) => {
                *object_count += 1;
                for val in map.values() {
                    self.analyze_recursive(val, depth + 1, max_depth, object_count, array_count);
                }
            }
            Value::Array(arr) => {
                *array_count += 1;
                for val in arr {
                    self.analyze_recursive(val, depth + 1, max_depth, object_count, array_count);
                }
            }
            _ => {}
        }
    }
}
