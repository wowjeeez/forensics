use super::{Extractor, ExtractorOutput};
use crate::index::schema::{FileCategory, StructuredData, SheetInfo};
use anyhow::{Result, Context};
use calamine::{Reader, open_workbook, Xlsx, Data};
use std::collections::HashMap;
use std::path::Path;

pub struct ExcelExtractor;

impl Extractor for ExcelExtractor {
    fn extract(&self, path: &Path) -> Result<ExtractorOutput> {
        let mut workbook: Xlsx<_> = open_workbook(path)
            .context("Failed to open Excel file")?;

        let mut sheets = Vec::new();
        let mut total_rows = 0u64;

        // Process each sheet
        for sheet_name in workbook.sheet_names().to_vec() {
            if let Ok(range) = workbook.worksheet_range(&sheet_name) {
                let row_count = range.height() as u64;
                total_rows += row_count;

                // Extract headers from first row
                let headers: Vec<String> = range
                    .rows()
                    .next()
                    .map(|row| {
                        row.iter()
                            .map(|cell| Self::cell_to_string(cell))
                            .collect()
                    })
                    .unwrap_or_default();

                sheets.push(SheetInfo {
                    name: sheet_name.clone(),
                    headers,
                    row_count,
                });
            }
        }

        // Build searchable fields
        let mut fields = HashMap::new();
        fields.insert("format".to_string(), "excel".to_string());
        fields.insert("sheet_count".to_string(), sheets.len().to_string());
        fields.insert("total_rows".to_string(), total_rows.to_string());

        let sheet_names: Vec<String> = sheets.iter().map(|s| s.name.clone()).collect();
        fields.insert("sheets".to_string(), sheet_names.join(", "));

        // Collect all headers for searching
        let mut all_headers = Vec::new();
        for sheet in &sheets {
            for header in &sheet.headers {
                all_headers.push(format!("{}.{}", sheet.name, header));
            }
        }
        fields.insert("columns".to_string(), all_headers.join(", "));

        // Create preview
        let preview = format!(
            "Excel workbook: {} sheets, {} total rows. Sheets: {}",
            sheets.len(),
            total_rows,
            sheet_names.join(", ")
        );

        Ok(ExtractorOutput {
            structured: Some(StructuredData::Excel {
                sheets,
                total_rows,
            }),
            content: None, // Don't index entire spreadsheet content
            preview: preview.chars().take(500).collect(),
            fields,
        })
    }

    fn can_handle(&self, category: FileCategory, mime_type: &str) -> bool {
        category == FileCategory::Document
            && mime_type.contains("vnd.openxmlformats-officedocument.spreadsheetml")
    }

    fn name(&self) -> &'static str {
        "excel"
    }
}

impl ExcelExtractor {
    fn cell_to_string(cell: &Data) -> String {
        match cell {
            Data::Int(i) => i.to_string(),
            Data::Float(f) => f.to_string(),
            Data::String(s) => s.clone(),
            Data::Bool(b) => b.to_string(),
            Data::DateTime(dt) => format!("{:?}", dt),
            Data::Error(e) => format!("Error: {:?}", e),
            Data::Empty => String::new(),
            Data::DateTimeIso(s) => s.clone(),
            Data::DurationIso(s) => s.clone(),
        }
    }
}
