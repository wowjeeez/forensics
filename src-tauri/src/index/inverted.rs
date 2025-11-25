use super::schema::{DocumentMetadata, FileCategory, FileDocument, TypedHit};
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tantivy::collector::TopDocs;
use tantivy::directory::MmapDirectory;
use tantivy::query::QueryParser;
use tantivy::schema::*;
use tantivy::{doc, Index, IndexWriter, Searcher, TantivyDocument};

/// Inverted index using Tantivy
/// Provides lightning-fast full-text search and filtering
pub struct InvertedIndex {
    index: Index,
    schema: Schema,
    writer: Arc<parking_lot::Mutex<IndexWriter>>,
}

/// Search hit result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchHit {
    pub id: String,
    pub path: PathBuf,
    pub category: FileCategory,
    pub snippet: String,
    pub score: f32,
}

impl InvertedIndex {
    /// Create a new inverted index at the specified path
    pub fn create(index_dir: &Path) -> Result<Self> {
        std::fs::create_dir_all(index_dir)?;

        // Build schema
        let schema = Self::build_schema();

        // Create index
        let dir = MmapDirectory::open(index_dir).context("Failed to open index directory")?;
        let index = Index::open_or_create(dir, schema.clone()).context("Failed to create index")?;

        // Create writer with 128MB heap
        let writer = index
            .writer(128_000_000)
            .context("Failed to create index writer")?;

        Ok(Self {
            index,
            schema,
            writer: Arc::new(parking_lot::Mutex::new(writer)),
        })
    }

    /// Open an existing index
    pub fn open(index_dir: &Path) -> Result<Self> {
        let schema = Self::build_schema();
        let dir = MmapDirectory::open(index_dir).context("Failed to open index directory")?;
        let index = Index::open(dir).context("Failed to open index")?;

        let writer = index
            .writer(128_000_000)
            .context("Failed to create index writer")?;

        Ok(Self {
            index,
            schema,
            writer: Arc::new(parking_lot::Mutex::new(writer)),
        })
    }

    /// Build the Tantivy schema
    fn build_schema() -> Schema {
        let mut schema_builder = Schema::builder();

        // Core metadata fields (always indexed)
        schema_builder.add_text_field("id", STRING | STORED);
        schema_builder.add_text_field("path", STRING | STORED);
        schema_builder.add_u64_field("size", INDEXED | STORED);
        schema_builder.add_date_field("modified", INDEXED | STORED);
        schema_builder.add_text_field("hash", STRING | STORED);
        schema_builder.add_text_field("mime_type", STRING | STORED);
        schema_builder.add_text_field("category", STRING | STORED);
        schema_builder.add_text_field("extension", STRING | STORED);

        // Full-text searchable fields
        schema_builder.add_text_field("preview", TEXT | STORED);
        schema_builder.add_text_field("content", TEXT);

        // Structured data fields (for filtering)
        schema_builder.add_text_field("tables", TEXT); // SQLite table names
        schema_builder.add_text_field("columns", TEXT); // Column names
        schema_builder.add_text_field("paths", TEXT); // JSON paths
        schema_builder.add_text_field("sheets", TEXT); // Excel sheet names

        // Generic fields extracted by type-specific extractors
        schema_builder.add_text_field("fields", TEXT);

        schema_builder.build()
    }

    /// Add a document to the index
    pub fn add_document(&self, file_doc: &FileDocument) -> Result<()> {
        let mut doc = TantivyDocument::new();

        // Add core metadata
        let id = self.schema.get_field("id").unwrap();
        let path = self.schema.get_field("path").unwrap();
        let size = self.schema.get_field("size").unwrap();
        let modified = self.schema.get_field("modified").unwrap();
        let hash = self.schema.get_field("hash").unwrap();
        let mime_type = self.schema.get_field("mime_type").unwrap();
        let category = self.schema.get_field("category").unwrap();
        let extension = self.schema.get_field("extension").unwrap();
        let preview = self.schema.get_field("preview").unwrap();
        let content = self.schema.get_field("content").unwrap();

        doc.add_text(id, &file_doc.id);
        doc.add_text(path, &file_doc.metadata.path.to_string_lossy());
        doc.add_u64(size, file_doc.metadata.size);
        doc.add_date(
            modified,
            tantivy::DateTime::from_timestamp_secs(file_doc.metadata.modified.timestamp()),
        );
        doc.add_text(hash, &file_doc.metadata.hash);
        doc.add_text(mime_type, &file_doc.metadata.mime_type);
        doc.add_text(
            category,
            &format!("{:?}", file_doc.metadata.category).to_lowercase(),
        );

        if let Some(ext) = &file_doc.metadata.extension {
            doc.add_text(extension, ext);
        }

        if let Some(prev) = &file_doc.preview {
            doc.add_text(preview, prev);
        }

        if let Some(cont) = &file_doc.content {
            doc.add_text(content, cont);
        }

        // Add structured data fields
        if let Some(structured) = &file_doc.structured {
            self.add_structured_fields(&mut doc, structured)?;
        }

        // Write document
        let mut writer = self.writer.lock();
        writer.add_document(doc)?;

        Ok(())
    }

    /// Add structured data fields to document
    fn add_structured_fields(
        &self,
        doc: &mut TantivyDocument,
        structured: &super::schema::StructuredData,
    ) -> Result<()> {
        use super::schema::StructuredData;

        match structured {
            StructuredData::Sqlite { tables, .. } => {
                let tables_field = self.schema.get_field("tables").unwrap();
                let columns_field = self.schema.get_field("columns").unwrap();

                let table_names: Vec<String> = tables.iter().map(|t| t.name.clone()).collect();
                doc.add_text(tables_field, &table_names.join(" "));

                let mut all_columns = Vec::new();
                for table in tables {
                    for col in &table.columns {
                        all_columns.push(format!("{}.{}", table.name, col.name));
                    }
                }
                doc.add_text(columns_field, &all_columns.join(" "));
            }
            StructuredData::Json { paths, .. } => {
                let paths_field = self.schema.get_field("paths").unwrap();
                let path_strings: Vec<String> = paths.iter().map(|p| p.path.clone()).collect();
                doc.add_text(paths_field, &path_strings.join(" "));
            }
            StructuredData::Excel { sheets, .. } => {
                let sheets_field = self.schema.get_field("sheets").unwrap();
                let columns_field = self.schema.get_field("columns").unwrap();

                let sheet_names: Vec<String> = sheets.iter().map(|s| s.name.clone()).collect();
                doc.add_text(sheets_field, &sheet_names.join(" "));

                let mut all_headers = Vec::new();
                for sheet in sheets {
                    for header in &sheet.headers {
                        all_headers.push(format!("{}.{}", sheet.name, header));
                    }
                }
                doc.add_text(columns_field, &all_headers.join(" "));
            }
            StructuredData::Csv { headers, .. } => {
                let columns_field = self.schema.get_field("columns").unwrap();
                doc.add_text(columns_field, &headers.join(" "));
            }
            _ => {}
        }

        Ok(())
    }

    /// Commit changes to the index
    pub fn commit(&self) -> Result<()> {
        let mut writer = self.writer.lock();
        writer.commit()?;
        Ok(())
    }

    /// Search the index
    pub fn search(&self, query_str: &str, limit: usize) -> Result<Vec<SearchHit>> {
        let reader = self.index.reader()?;
        let searcher = reader.searcher();

        // Parse query
        let query_parser = QueryParser::for_index(
            &self.index,
            vec![
                self.schema.get_field("path").unwrap(),
                self.schema.get_field("preview").unwrap(),
                self.schema.get_field("content").unwrap(),
                self.schema.get_field("tables").unwrap(),
                self.schema.get_field("columns").unwrap(),
                self.schema.get_field("paths").unwrap(),
            ],
        );

        let query = query_parser.parse_query(query_str)?;

        // Execute search
        let top_docs = searcher.search(&query, &TopDocs::with_limit(limit))?;

        // Convert results
        let mut hits = Vec::new();
        for (score, doc_address) in top_docs {
            let doc = searcher.doc(doc_address)?;
            hits.push(self.doc_to_hit(&doc, score));
        }

        Ok(hits)
    }

    /// Convert Tantivy document to SearchHit
    fn doc_to_hit(&self, doc: &TantivyDocument, score: f32) -> SearchHit {
        let id_field = self.schema.get_field("id").unwrap();
        let path_field = self.schema.get_field("path").unwrap();
        let category_field = self.schema.get_field("category").unwrap();
        let preview_field = self.schema.get_field("preview").unwrap();

        let id = doc
            .get_first(id_field)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let path_str = doc
            .get_first(path_field)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let category_str = doc
            .get_first(category_field)
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");

        let category = match category_str {
            "database" => FileCategory::Database,
            "structureddata" => FileCategory::StructuredData,
            "document" => FileCategory::Document,
            "text" => FileCategory::Text,
            "media" => FileCategory::Media,
            "archive" => FileCategory::Archive,
            "binary" => FileCategory::Binary,
            _ => FileCategory::Unknown,
        };

        let snippet = doc
            .get_first(preview_field)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        SearchHit {
            id,
            path: PathBuf::from(path_str),
            category,
            snippet,
            score,
        }
    }

    /// Get total document count
    pub fn document_count(&self) -> Result<u64> {
        let reader = self.index.reader()?;
        let searcher = reader.searcher();
        Ok(searcher.num_docs())
    }
}
