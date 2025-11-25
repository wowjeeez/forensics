use super::{Extractor, ExtractorOutput};
use crate::index::schema::{FileCategory, StructuredData, ColumnSchema};
use anyhow::{Result, Context};
use csv::ReaderBuilder;
use std::collections::HashMap;
use std::fs::File;
use std::path::Path;

pub struct CsvExtractor;

impl Extractor for CsvExtractor {
    fn extract(&self, path: &Path) -> Result<ExtractorOutput> {
        let file = File::open(path).context("Failed to open CSV file")?;

        // Try to detect delimiter
        let delimiter = self.detect_delimiter(path).unwrap_or(b',');

        let mut reader = ReaderBuilder::new()
            .delimiter(delimiter)
            .has_headers(true)
            .from_reader(file);

        // Get headers
        let headers: Vec<String> = reader
            .headers()
            .context("Failed to read CSV headers")?
            .iter()
            .map(|s| s.to_string())
            .collect();

        // Infer schema by sampling first 100 rows
        let schema = self.infer_schema(&mut reader, &headers)?;

        // Count total rows
        let row_count = reader.into_records().count() as u64;

        // Build searchable fields
        let mut fields = HashMap::new();
        fields.insert("format".to_string(), "csv".to_string());
        fields.insert("delimiter".to_string(), (delimiter as char).to_string());
        fields.insert("column_count".to_string(), headers.len().to_string());
        fields.insert("row_count".to_string(), row_count.to_string());
        fields.insert("columns".to_string(), headers.join(", "));

        // Create preview
        let preview = format!(
            "CSV file: {} columns, {} rows. Headers: {}",
            headers.len(),
            row_count,
            headers.join(", ")
        );

        Ok(ExtractorOutput {
            structured: Some(StructuredData::Csv {
                headers,
                row_count,
                delimiter: delimiter as char,
                schema,
            }),
            content: None, // Don't index entire CSV content
            preview: preview.chars().take(500).collect(),
            fields,
        })
    }

    fn can_handle(&self, category: FileCategory, mime_type: &str) -> bool {
        category == FileCategory::StructuredData && mime_type == "text/csv"
    }

    fn name(&self) -> &'static str {
        "csv"
    }
}

impl CsvExtractor {
    fn detect_delimiter(&self, path: &Path) -> Result<u8> {
        let file = File::open(path)?;
        let mut reader = ReaderBuilder::new()
            .has_headers(false)
            .from_reader(file);

        if let Some(result) = reader.records().next() {
            let record = result?;
            let line = record.as_slice();

            // Count occurrences of common delimiters
            let comma_count = line.matches(',').count();
            let tab_count = line.matches('\t').count();
            let pipe_count = line.matches('|').count();
            let semicolon_count = line.matches(';').count();

            // Return most common delimiter
            let max = comma_count
                .max(tab_count)
                .max(pipe_count)
                .max(semicolon_count);

            if max == comma_count {
                return Ok(b',');
            } else if max == tab_count {
                return Ok(b'\t');
            } else if max == pipe_count {
                return Ok(b'|');
            } else if max == semicolon_count {
                return Ok(b';');
            }
        }

        Ok(b',')
    }

    fn infer_schema(
        &self,
        reader: &mut csv::Reader<File>,
        headers: &[String],
    ) -> Result<Vec<ColumnSchema>> {
        let mut schema: Vec<ColumnSchema> = headers
            .iter()
            .map(|name| ColumnSchema {
                name: name.clone(),
                data_type: "string".to_string(),
                nullable: true,
            })
            .collect();

        // Sample first 100 rows to infer types
        let mut has_values = vec![false; headers.len()];
        let mut all_numeric = vec![true; headers.len()];
        let mut all_integer = vec![true; headers.len()];

        for result in reader.records().take(100) {
            if let Ok(record) = result {
                for (idx, field) in record.iter().enumerate() {
                    if idx >= schema.len() {
                        break;
                    }

                    if !field.is_empty() {
                        has_values[idx] = true;

                        // Check if numeric
                        if field.parse::<f64>().is_err() {
                            all_numeric[idx] = false;
                            all_integer[idx] = false;
                        } else if field.parse::<i64>().is_err() {
                            all_integer[idx] = false;
                        }
                    }
                }
            }
        }

        // Update schema with inferred types
        for (idx, col) in schema.iter_mut().enumerate() {
            if all_integer[idx] && has_values[idx] {
                col.data_type = "integer".to_string();
            } else if all_numeric[idx] && has_values[idx] {
                col.data_type = "number".to_string();
            }
        }

        Ok(schema)
    }
}
