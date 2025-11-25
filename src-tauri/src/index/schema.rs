use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use thiserror::Error;

/// Unified document schema for all file types
/// This is the normalized representation stored in the inverted index
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileDocument {
    /// Unique document ID (hash of path)
    pub id: String,

    /// Fast metadata for filtering
    pub metadata: DocumentMetadata,

    /// Structured data extracted from the file (lazy loaded)
    pub structured: Option<StructuredData>,

    /// Full-text content (only for text files, lazy loaded)
    pub content: Option<String>,

    /// Short preview (always extracted, max 500 chars)
    pub preview: Option<String>,

    /// Image metadata (if file is an image)
    pub image_metadata: Option<ImageMetadata>,

    /// Archive metadata (if file was unpacked from archive)
    pub archive_source: Option<ArchiveSource>,
}

/// Image metadata stored in document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageMetadata {
    pub width: u32,
    pub height: u32,
    pub format: String,
    pub has_alpha: bool,
    pub thumbnail_path: Option<PathBuf>,
}

/// Archive source information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveSource {
    pub archive_path: PathBuf,
    pub relative_path: String,
    pub archive_format: String,
}

/// Core metadata indexed for every file
/// This is always loaded - kept small for fast filtering
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    /// Absolute file path
    pub path: PathBuf,

    /// File size in bytes
    pub size: u64,

    /// Last modified timestamp
    pub modified: DateTime<Utc>,

    /// Created timestamp (if available)
    pub created: Option<DateTime<Utc>>,

    /// SHA256 hash for change detection
    pub hash: String,

    /// MIME type detected via magic bytes
    pub mime_type: String,

    /// Detected file category
    pub category: FileCategory,

    /// Magic header bytes (first 16 bytes in hex)
    pub magic_header: String,

    /// File extension (if any)
    pub extension: Option<String>,

    /// Indexing status
    pub indexed: bool,

    /// Last index time
    pub indexed_at: Option<DateTime<Utc>>,
}

/// High-level file categories for efficient filtering
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FileCategory {
    /// Structured database files (SQLite, LevelDB, etc.)
    Database,

    /// Structured data formats (JSON, XML, CSV, Parquet, etc.)
    StructuredData,

    /// Office documents (XLSX, DOCX, PDF, etc.)
    Document,

    /// Plain text files
    Text,

    /// Media files (images, audio, video)
    Media,

    /// Archive files (zip, tar, etc.)
    Archive,

    /// Executable binaries
    Binary,

    /// Unknown or unsupported
    Unknown,
}

/// Structured data extracted from specific file types
/// This is populated by type-specific extractors
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum StructuredData {
    /// SQLite database structure
    Sqlite {
        tables: Vec<TableInfo>,
        total_rows: u64,
        page_size: u32,
        version: String,
    },

    /// JSON structure
    Json {
        /// Flattened JSON paths
        paths: Vec<JsonPath>,
        depth: usize,
        object_count: usize,
        array_count: usize,
    },

    /// CSV/TSV structure
    Csv {
        headers: Vec<String>,
        row_count: u64,
        delimiter: char,
        schema: Vec<ColumnSchema>,
    },

    /// Excel/Sheets structure
    Excel {
        sheets: Vec<SheetInfo>,
        total_rows: u64,
    },

    /// XML structure
    Xml {
        root_element: String,
        namespaces: Vec<String>,
        element_count: usize,
    },

    /// Parquet structure
    Parquet {
        schema: Vec<ColumnSchema>,
        row_count: u64,
        row_groups: usize,
    },

    /// LevelDB/RocksDB structure
    LevelDb {
        key_count: u64,
        approximate_size: u64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub columns: Vec<ColumnInfo>,
    pub row_count: u64,
    pub indexes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub primary_key: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonPath {
    /// JSONPath expression (e.g., "$.users[0].name")
    pub path: String,

    /// Value type
    pub value_type: JsonValueType,

    /// Sample value (if primitive)
    pub sample: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum JsonValueType {
    String,
    Number,
    Boolean,
    Null,
    Object,
    Array,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnSchema {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SheetInfo {
    pub name: String,
    pub headers: Vec<String>,
    pub row_count: u64,
}

/// Search hit with type information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypedHit {
    /// Document ID
    pub id: String,

    /// File path
    pub path: PathBuf,

    /// File category
    pub category: FileCategory,

    /// Location inside the structure (e.g., "table:users", "$.path.to.field")
    pub location: Option<String>,

    /// Preview snippet
    pub snippet: String,

    /// Search score
    pub score: f32,

    /// Schema information (if structured)
    pub schema: Option<String>,
}

/// Index statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexStats {
    pub total_documents: u64,
    pub total_size: u64,
    pub by_category: HashMap<FileCategory, u64>,
    pub indexed_documents: u64,
    pub last_update: DateTime<Utc>,
}

impl FileCategory {
    pub fn from_mime(mime: &str) -> Self {
        match mime {
            // Databases
            m if m.contains("sqlite") || m.contains("x-sqlite") => Self::Database,

            // Structured data
            "application/json" | "text/json" => Self::StructuredData,
            "application/xml" | "text/xml" => Self::StructuredData,
            "text/csv" => Self::StructuredData,
            "application/vnd.apache.parquet" => Self::StructuredData,

            // Documents
            m if m.contains("pdf") => Self::Document,
            m if m.contains("vnd.openxmlformats") => Self::Document,
            m if m.contains("msword") => Self::Document,
            m if m.contains("vnd.ms-excel") => Self::Document,

            // Text
            m if m.starts_with("text/") => Self::Text,

            // Media
            m if m.starts_with("image/") => Self::Media,
            m if m.starts_with("audio/") => Self::Media,
            m if m.starts_with("video/") => Self::Media,

            // Archives
            m if m.contains("zip") || m.contains("gzip") || m.contains("tar") => Self::Archive,

            // Binary
            "application/octet-stream" | "application/x-executable" => Self::Binary,

            _ => Self::Unknown,
        }
    }
}

#[derive(Error, Debug)]
pub enum ProjectDatabaseError {
    #[error("Database error: {0}")]
    Sled(#[from] sled::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] bincode::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Invalid directory path")]
    InvalidPath,

    #[error("No app data directory found")]
    NoAppDataDir,
}
