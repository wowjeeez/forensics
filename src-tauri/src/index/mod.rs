// Multi-stage search architecture for heterogeneous file trees
//
// Architecture:
// 1. Unified metadata index (fast filtering)
// 2. Type detection via magic bytes
// 3. Type-specific extractors
// 4. Federated query planner
// 5. Incremental indexing with change detection
// 6. Lazy deep extraction on demand

pub mod schema;
pub mod detector;
pub mod extractors;
pub mod inverted;
pub mod query;
pub mod watcher;
pub mod indexer;
pub mod archive_settings;
pub mod archive_extractor;
pub mod image_preview;

pub use schema::{FileDocument, DocumentMetadata, StructuredData, FileCategory, TypedHit, IndexStats as SchemaIndexStats};
pub use detector::{FileTypeDetector, DetectedFileType};
pub use extractors::{Extractor, ExtractorRegistry};
pub use inverted::{InvertedIndex, SearchHit};
pub use query::{QueryPlanner, Query, QueryResult};
pub use watcher::{ChangeDetector, FileChange};
pub use indexer::{MasterIndexer, IndexProgress, IndexPhase, IndexStats};
pub use archive_settings::{ArchiveSettings, ArchiveFormat, UnpackedArchiveInfo};
pub use archive_extractor::ArchiveExtractor;
pub use image_preview::{ImagePreviewGenerator, ImageInfo, PreviewConfig};
