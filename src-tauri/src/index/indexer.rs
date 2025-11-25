use super::archive_extractor::ArchiveExtractor;
use super::archive_settings::ArchiveSettings;
use super::detector::FileTypeDetector;
use super::extractors::ExtractorRegistry;
use super::image_preview::{ImagePreviewGenerator, PreviewConfig};
use super::inverted::InvertedIndex;
use super::query::QueryPlanner;
use super::schema::{DocumentMetadata, FileDocument, ProjectDatabaseError};
use super::watcher::{ChangeDetector, FileChange};
use crate::db::AuxiliaryProjectDb;
use anyhow::{Context, Error, Result};
use chrono::Utc;
use directories::ProjectDirs;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

/// Main indexing orchestrator
/// Coordinates file detection, extraction, and indexing
pub struct MasterIndexer {
    /// Inverted index for fast search
    inverted_index: Arc<InvertedIndex>,

    /// Type-specific extractors
    extractor_registry: Arc<ExtractorRegistry>,

    /// Change detector for incremental indexing
    change_detector: Arc<parking_lot::Mutex<ChangeDetector>>,

    /// Archive extractor
    archive_extractor: Option<Arc<ArchiveExtractor>>,

    /// Image preview generator
    image_preview: Option<Arc<ImagePreviewGenerator>>,

    /// Index directory
    index_dir: PathBuf,

    auxiliary_db: Arc<AuxiliaryProjectDb>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexProgress {
    pub files_processed: u64,
    pub files_total: u64,
    pub bytes_processed: u64,
    pub current_file: String,
    pub phase: IndexPhase,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IndexPhase {
    Scanning,
    Detecting,
    Extracting,
    Indexing,
    Complete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexStats {
    pub total_files: u64,
    pub indexed_files: u64,
    pub total_size: u64,
    pub by_category: std::collections::HashMap<String, u64>,
    pub duration_ms: u64,
}

impl MasterIndexer {
    /// Create a new master indexer
    pub fn create(index_dir: &Path) -> Result<Self> {
        Self::create_with_settings(index_dir, None, None)
    }

    /// Create with archive and preview settings
    pub fn create_with_settings(
        index_dir: &Path,
        archive_settings: Option<ArchiveSettings>,
        preview_config: Option<PreviewConfig>,
    ) -> Result<Self> {
        std::fs::create_dir_all(index_dir)?;

        let inverted_index = InvertedIndex::create(&index_dir.join("inverted"))?;
        let extractor_registry = ExtractorRegistry::new();

        let cache_path = index_dir.join("change_cache.bin");
        let change_detector = ChangeDetector::load(&cache_path).unwrap_or_default();

        // Set up archive extractor if enabled
        let archive_extractor = if let Some(settings) = archive_settings {
            if settings.auto_unpack {
                Some(Arc::new(ArchiveExtractor::new(settings)))
            } else {
                None
            }
        } else {
            None
        };

        // Set up image preview generator if enabled
        let image_preview = if let Some(config) = preview_config {
            if config.enabled {
                let preview_dir = index_dir.join("previews");
                Some(Arc::new(ImagePreviewGenerator::new(config, preview_dir)?))
            } else {
                None
            }
        } else {
            None
        };

        let auxiliary_db = AuxiliaryProjectDb::init(index_dir.join("aux"))?;

        Ok(Self {
            inverted_index: Arc::new(inverted_index),
            extractor_registry: Arc::new(extractor_registry),
            change_detector: Arc::new(parking_lot::Mutex::new(change_detector)),
            archive_extractor,
            image_preview,
            index_dir: index_dir.to_path_buf(),
            auxiliary_db: Arc::new(auxiliary_db),
        })
    }

    /// Open an existing indexer
    pub fn open(index_dir: &Path) -> Result<Self> {
        Self::open_with_settings(index_dir, None, None)
    }

    pub fn get_or_init_from_project_path(project_path: &Path) -> Result<MasterIndexer> {
        let db_path = Self::project_path_to_db_path(project_path)?;
        println!("DB path {:?}", db_path);
        let open = Self::open_with_settings(
            db_path.as_path(),
            Some(ArchiveSettings::default()),
            Some(PreviewConfig::default()),
        );

        if open.as_ref().err().is_some() {
            Self::create_with_settings(
                db_path.as_path(),
                Some(ArchiveSettings::default()),
                Some(PreviewConfig::default()),
            )
        } else {
            open
        }
    }

    fn project_path_to_db_path(project_path: &Path) -> Result<PathBuf> {
        let proj_dirs = ProjectDirs::from("com", "levandor", "forensics")
            .ok_or(ProjectDatabaseError::NoAppDataDir)?;

        let data_dir = proj_dirs.data_dir();

        let path_str = project_path
            .to_str()
            .ok_or(ProjectDatabaseError::InvalidPath)?;

        let mut hasher = Sha256::new();
        hasher.update(path_str.as_bytes());
        let hash = format!("{:x}", hasher.finalize());

        let db_name = &hash[..16];

        Ok(data_dir.join(db_name))
    }

    /// Open with archive and preview settings
    pub fn open_with_settings(
        index_dir: &Path,
        archive_settings: Option<ArchiveSettings>,
        preview_config: Option<PreviewConfig>,
    ) -> Result<Self> {
        let inverted_index = InvertedIndex::open(&index_dir.join("inverted"))?;
        let extractor_registry = ExtractorRegistry::new();

        let cache_path = index_dir.join("change_cache.bin");
        let change_detector = ChangeDetector::load(&cache_path).unwrap_or_default();

        // Set up archive extractor if enabled
        let archive_extractor = if let Some(settings) = archive_settings {
            if settings.auto_unpack {
                Some(Arc::new(ArchiveExtractor::new(settings)))
            } else {
                None
            }
        } else {
            None
        };

        // Set up image preview generator if enabled
        let image_preview = if let Some(config) = preview_config {
            if config.enabled {
                let preview_dir = index_dir.join("previews");
                Some(Arc::new(ImagePreviewGenerator::new(config, preview_dir)?))
            } else {
                None
            }
        } else {
            None
        };

        let auxiliary_db = AuxiliaryProjectDb::init(index_dir.join("aux"))?;

        Ok(Self {
            inverted_index: Arc::new(inverted_index),
            extractor_registry: Arc::new(extractor_registry),
            change_detector: Arc::new(parking_lot::Mutex::new(change_detector)),
            archive_extractor,
            image_preview,
            index_dir: index_dir.to_path_buf(),
            auxiliary_db: Arc::new(auxiliary_db),
        })
    }

    /// Index a directory tree
    pub fn index_directory(&self, root: &Path) -> Result<IndexStats> {
        let start = std::time::Instant::now();

        // 1. Scan directory to find all files
        let files = Self::scan_directory(root)?;
        let total_files = files.len() as u64;

        // 2. Detect changes (incremental indexing)
        let changes = {
            let mut detector = self.change_detector.lock();
            detector.detect_changes(&files)?
        };

        // Filter to only new/modified files
        let files_to_index: Vec<PathBuf> = changes
            .into_iter()
            .filter_map(|change| match change {
                FileChange::Added(p) | FileChange::Modified(p) => Some(p),
                _ => None,
            })
            .collect();

        println!(
            "Files to index: {} out of {}",
            files_to_index.len(),
            total_files
        );

        // 3. Index files in batches with memory limits
        let files_processed = Arc::new(AtomicU64::new(0));
        let total_size = Arc::new(AtomicU64::new(0));
        let by_category = Arc::new(parking_lot::Mutex::new(std::collections::HashMap::new()));

        const BATCH_SIZE: usize = 100;
        const MAX_FILE_SIZE: u64 = 100 * 1024 * 1024; // 100MB per file limit

        // Process in batches to avoid memory exhaustion
        for batch in files_to_index.chunks(BATCH_SIZE) {
            batch.par_iter().for_each(|path| {
                // Skip extremely large files to prevent crashes
                if let Ok(metadata) = std::fs::metadata(path) {
                    if metadata.len() > MAX_FILE_SIZE {
                        println!(
                            "Skipping large file ({}MB): {}",
                            metadata.len() / (1024 * 1024),
                            path.display()
                        );
                        return;
                    }
                }

                if let Ok(file_doc) = self.index_file(path) {
                    // Update statistics
                    files_processed.fetch_add(1, Ordering::Relaxed);
                    total_size.fetch_add(file_doc.metadata.size, Ordering::Relaxed);

                    let mut cat_map = by_category.lock();
                    *cat_map
                        .entry(format!("{:?}", file_doc.metadata.category))
                        .or_insert(0) += 1;
                }
            });

            // Commit after each batch to save progress
            if let Err(e) = self.inverted_index.commit() {
                eprintln!("Failed to commit batch: {}", e);
            }

            // Give system time to breathe between batches
            std::thread::sleep(std::time::Duration::from_millis(10));
        }

        // 4. Final commit
        self.inverted_index.commit()?;

        // 5. Save change detector cache
        let cache_path = self.index_dir.join("change_cache.bin");
        self.change_detector.lock().save(&cache_path)?;

        let duration_ms = start.elapsed().as_millis() as u64;

        // Extract by_category map before creating IndexStats
        let by_category_map = by_category.lock().clone();

        Ok(IndexStats {
            total_files,
            indexed_files: files_processed.load(Ordering::Relaxed),
            total_size: total_size.load(Ordering::Relaxed),
            by_category: by_category_map,
            duration_ms,
        })
    }

    /// Index a single file
    fn index_file(&self, path: &Path) -> Result<FileDocument> {
        // 1. Check if file is an archive and unpack if enabled
        if let Some(ref archive_extractor) = self.archive_extractor {
            if archive_extractor.is_archive(path) {
                // Unpack archive
                if let Ok(unpacked_info) = archive_extractor.unpack(
                    path,
                    &self.index_dir,
                    0, // Top-level nesting
                ) {
                    // Note: The unpacked files will be indexed in subsequent scans
                    println!(
                        "Unpacked archive {} to {}: {} files",
                        path.display(),
                        unpacked_info.unpacked_to.display(),
                        unpacked_info.file_count
                    );
                }
            }
        }

        // 2. Detect file type via magic bytes
        let detected = FileTypeDetector::detect(path).context("Failed to detect file type")?;

        // 3. Generate image preview if it's an image
        let mut image_info = None;
        if let Some(ref image_preview) = self.image_preview {
            if image_preview.is_image(path) {
                if let Ok(info) = image_preview.generate_preview(path) {
                    image_info = Some(info);
                }
            }
        }

        // 4. Get file metadata
        let metadata = std::fs::metadata(path)?;
        let size = metadata.len();

        let modified =
            chrono::DateTime::from(metadata.modified().unwrap_or(std::time::SystemTime::now()));

        let created = metadata.created().ok().map(chrono::DateTime::from);

        // 5. Calculate hash
        let hash = Self::calculate_hash(path)?;

        // 6. Build document ID
        let doc_id = Self::make_doc_id(path);

        // 7. Extract content using appropriate extractor
        let mut extraction = self
            .extractor_registry
            .extract(path, detected.category, &detected.mime_type)
            .unwrap_or_else(|_| {
                // Minimal extraction if extractor fails
                super::extractors::ExtractorOutput {
                    structured: None,
                    content: None,
                    preview: format!("File: {}", path.display()),
                    fields: std::collections::HashMap::new(),
                }
            });

        // 8. Enhance extraction with image metadata if available
        if let Some(ref img_info) = image_info {
            extraction
                .fields
                .insert("image_width".to_string(), img_info.width.to_string());
            extraction
                .fields
                .insert("image_height".to_string(), img_info.height.to_string());
            extraction
                .fields
                .insert("image_format".to_string(), img_info.format.clone());

            if let Some(ref thumb_path) = img_info.thumbnail_path {
                extraction.fields.insert(
                    "thumbnail".to_string(),
                    thumb_path.to_string_lossy().to_string(),
                );
            }

            // Update preview with image info
            extraction.preview = format!(
                "Image: {}x{} {} - {}",
                img_info.width, img_info.height, img_info.format, extraction.preview
            );
        }

        // 9. Build image metadata if available
        let image_metadata = image_info.map(|info| super::schema::ImageMetadata {
            width: info.width,
            height: info.height,
            format: info.format,
            has_alpha: info.has_alpha,
            thumbnail_path: info.thumbnail_path,
        });

        // 10. Build file document
        let file_doc = FileDocument {
            id: doc_id,
            metadata: DocumentMetadata {
                path: path.to_path_buf(),
                size,
                modified,
                created,
                hash,
                mime_type: detected.mime_type,
                category: detected.category,
                magic_header: detected.magic_header,
                extension: path
                    .extension()
                    .and_then(|s| s.to_str())
                    .map(|s| s.to_string()),
                indexed: true,
                indexed_at: Some(Utc::now()),
            },
            structured: extraction.structured,
            content: extraction.content,
            preview: Some(extraction.preview),
            image_metadata,
            archive_source: None, // TODO: Track if file came from archive
        };

        // 10. Add to inverted index
        self.inverted_index.add_document(&file_doc)?;

        Ok(file_doc)
    }

    /// Scan directory recursively to find all files
    fn scan_directory(root: &Path) -> Result<Vec<PathBuf>> {
        let mut files = Vec::new();
        Self::scan_recursive(root, &mut files)?;
        Ok(files)
    }

    pub fn get_auxiliary_db(&self) -> Arc<AuxiliaryProjectDb> {
        self.auxiliary_db.clone()
    }

    fn scan_recursive(dir: &Path, files: &mut Vec<PathBuf>) -> Result<()> {
        if !dir.is_dir() {
            return Ok(());
        }

        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                files.push(path);
            } else if path.is_dir() {
                // Skip hidden directories
                if let Some(name) = path.file_name() {
                    if !name.to_string_lossy().starts_with('.') {
                        Self::scan_recursive(&path, files)?;
                    }
                }
            }
        }

        Ok(())
    }

    /// Calculate SHA256 hash incrementally to avoid loading entire file into memory
    fn calculate_hash(path: &Path) -> Result<String> {
        use std::io::Read;

        let mut file = std::fs::File::open(path)?;
        let mut hasher = Sha256::new();
        let mut buffer = [0u8; 8192]; // 8KB buffer

        loop {
            let bytes_read = file.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }

        Ok(format!("{:x}", hasher.finalize()))
    }

    /// Create document ID from path
    fn make_doc_id(path: &Path) -> String {
        let path_str = path.to_string_lossy();
        let mut hasher = Sha256::new();
        hasher.update(path_str.as_bytes());
        format!("{:x}", hasher.finalize())[..16].to_string()
    }

    /// Create a query planner for searching
    pub fn query_planner(&self) -> QueryPlanner {
        QueryPlanner::new(self.inverted_index.clone(), self.extractor_registry.clone())
    }

    /// Get index statistics
    pub fn stats(&self) -> Result<IndexStats> {
        let doc_count = self.inverted_index.document_count()?;

        Ok(IndexStats {
            total_files: doc_count,
            indexed_files: doc_count,
            total_size: 0, // Would need to query index for this
            by_category: std::collections::HashMap::new(),
            duration_ms: 0,
        })
    }
}
