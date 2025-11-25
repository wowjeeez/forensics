use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Archive unpacking settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveSettings {
    /// Whether to automatically unpack archives during indexing
    pub auto_unpack: bool,

    /// If true, unpack to host directory (next to archive)
    /// If false, unpack to project appdata directory
    pub unpack_to_host: bool,

    /// Maximum archive size to unpack (in bytes)
    /// Prevents unpacking extremely large archives
    pub max_archive_size: Option<u64>,

    /// Maximum nesting level for archives within archives
    pub max_nesting_level: u32,

    /// File extensions to treat as archives
    pub archive_extensions: Vec<String>,

    /// Whether to delete unpacked files when re-indexing
    pub clean_on_reindex: bool,
}

impl Default for ArchiveSettings {
    fn default() -> Self {
        Self {
            auto_unpack: true,
            unpack_to_host: true, // Default to appdata for safety
            max_archive_size: Some(5 * 1024 * 1024 * 1024), // 5GB
            max_nesting_level: 3,
            archive_extensions: vec![
                "zip".to_string(),
                "tar".to_string(),
                "gz".to_string(),
                "tgz".to_string(),
                "bz2".to_string(),
                "xz".to_string(),
                "7z".to_string(),
                "rar".to_string(),
            ],
            clean_on_reindex: false,
        }
    }
}

/// Information about an unpacked archive
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnpackedArchiveInfo {
    /// Original archive path
    pub archive_path: PathBuf,

    /// Where files were unpacked to
    pub unpacked_to: PathBuf,

    /// Number of files extracted
    pub file_count: usize,

    /// Total size of extracted files
    pub total_size: u64,

    /// Nesting level (0 = top-level archive)
    pub nesting_level: u32,

    /// Archive format
    pub format: ArchiveFormat,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ArchiveFormat {
    Zip,
    Tar,
    TarGz,
    TarBz2,
    TarXz,
    SevenZ,
    Rar,
    Gzip,
    Bzip2,
    Xz,
}

impl ArchiveFormat {
    /// Detect archive format from file extension
    pub fn from_extension(ext: &str) -> Option<Self> {
        match ext.to_lowercase().as_str() {
            "zip" => Some(Self::Zip),
            "tar" => Some(Self::Tar),
            "gz" => Some(Self::Gzip),
            "tgz" => Some(Self::TarGz),
            "tar.gz" => Some(Self::TarGz),
            "bz2" => Some(Self::Bzip2),
            "tbz" | "tbz2" | "tar.bz2" => Some(Self::TarBz2),
            "xz" => Some(Self::Xz),
            "txz" | "tar.xz" => Some(Self::TarXz),
            "7z" => Some(Self::SevenZ),
            "rar" => Some(Self::Rar),
            _ => None,
        }
    }

    /// Check if format is supported
    pub fn is_supported(&self) -> bool {
        match self {
            Self::Zip | Self::Tar | Self::TarGz | Self::TarBz2 | Self::Gzip => true,
            Self::SevenZ => true,
            Self::Rar => false, // RAR requires proprietary library
            _ => false,
        }
    }
}
