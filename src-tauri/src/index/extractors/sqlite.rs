use super::{Extractor, ExtractorOutput};
use crate::index::schema::{ColumnInfo, FileCategory, StructuredData, TableInfo};
use anyhow::{Context, Result};
use rusqlite::{Connection, OpenFlags};
use std::collections::HashMap;
use std::path::Path;

pub struct SqliteExtractor;

impl Extractor for SqliteExtractor {
    fn extract(&self, path: &Path) -> Result<ExtractorOutput> {
        // Open database in read-only mode
        let conn = Connection::open_with_flags(
            path,
            OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )
        .context("Failed to open SQLite database")?;

        // Get database version
        let version: String = conn
            .query_row("SELECT sqlite_version()", [], |row| row.get(0))
            .unwrap_or_else(|_| "unknown".to_string());

        // Get page size
        let page_size: u32 = conn
            .pragma_query_value(None, "page_size", |row| row.get(0))
            .unwrap_or(4096);

        // Get all tables (excluding internal SQLite tables)
        let tables = self.extract_tables(&conn)?;

        let total_rows: u64 = tables.iter().map(|t| t.row_count).sum();

        // Build searchable fields
        let mut fields = HashMap::new();
        fields.insert("database_type".to_string(), "sqlite".to_string());
        fields.insert("version".to_string(), version.clone());
        fields.insert("table_count".to_string(), tables.len().to_string());
        fields.insert("total_rows".to_string(), total_rows.to_string());

        // Add table names to searchable fields
        let table_names: Vec<String> = tables.iter().map(|t| t.name.clone()).collect();
        fields.insert("tables".to_string(), table_names.join(", "));

        // Add all column names for searching
        let mut all_columns = Vec::new();
        for table in &tables {
            for col in &table.columns {
                all_columns.push(format!("{}.{}", table.name, col.name));
            }
        }
        fields.insert("columns".to_string(), all_columns.join(", "));

        // Create preview
        let preview = format!(
            "SQLite database: {} tables, {} total rows. Tables: {}",
            tables.len(),
            total_rows,
            table_names.join(", ")
        );

        Ok(ExtractorOutput {
            structured: Some(StructuredData::Sqlite {
                tables,
                total_rows,
                page_size,
                version,
            }),
            content: None, // We don't index full DB content
            preview: preview.chars().take(500).collect(),
            fields,
        })
    }

    fn can_handle(&self, category: FileCategory, mime_type: &str) -> bool {
        category == FileCategory::Database
            && (mime_type.contains("sqlite") || mime_type.contains("x-sqlite"))
    }

    fn name(&self) -> &'static str {
        "sqlite"
    }
}

impl SqliteExtractor {
    fn extract_tables(&self, conn: &Connection) -> Result<Vec<TableInfo>> {
        let mut stmt = conn.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        )?;

        let table_names: Vec<String> = stmt
            .query_map([], |row| row.get(0))?
            .collect::<Result<_, _>>()?;

        let mut tables = Vec::new();

        for table_name in table_names {
            let columns = self.extract_columns(conn, &table_name)?;
            let row_count = self.count_rows(conn, &table_name)?;
            let indexes = self.get_indexes(conn, &table_name)?;

            tables.push(TableInfo {
                name: table_name,
                columns,
                row_count,
                indexes,
            });
        }

        Ok(tables)
    }

    fn extract_columns(&self, conn: &Connection, table_name: &str) -> Result<Vec<ColumnInfo>> {
        let mut stmt = conn.prepare(&format!("PRAGMA table_info('{}')", table_name))?;

        let columns: Vec<ColumnInfo> = stmt
            .query_map([], |row| {
                Ok(ColumnInfo {
                    name: row.get(1)?,
                    data_type: row.get(2)?,
                    nullable: row.get::<_, i32>(3)? == 0,
                    primary_key: row.get::<_, i32>(5)? == 1,
                })
            })?
            .collect::<Result<_, _>>()?;

        Ok(columns)
    }

    fn count_rows(&self, conn: &Connection, table_name: &str) -> Result<u64> {
        let count: i64 = conn.query_row(
            &format!("SELECT COUNT(*) FROM '{}'", table_name),
            [],
            |row| row.get(0),
        )?;
        Ok(count as u64)
    }

    fn get_indexes(&self, conn: &Connection, table_name: &str) -> Result<Vec<String>> {
        let mut stmt = conn.prepare(&format!("PRAGMA index_list('{}')", table_name))?;

        let indexes: Vec<String> = stmt
            .query_map([], |row| row.get(1))?
            .collect::<Result<_, _>>()?;

        Ok(indexes)
    }
}
