// Multi-stage search architecture for heterogeneous file trees
//
// Architecture:
// 1. Unified metadata index (fast filtering)
// 2. Type detection via magic bytes
// 3. Type-specific extractors
// 4. Federated query planner
// 5. Incremental indexing with change detection
// 6. Lazy deep extraction on demand

pub mod archive_extractor;
pub mod archive_settings;
pub mod detector;
pub mod extractors;
pub mod image_preview;
pub mod indexer;
pub mod inverted;
pub mod query;
pub mod schema;
pub mod watcher;

pub use archive_extractor::ArchiveExtractor;
pub use archive_settings::{ArchiveFormat, ArchiveSettings, UnpackedArchiveInfo};
pub use detector::{DetectedFileType, FileTypeDetector};
pub use extractors::{Extractor, ExtractorRegistry};
pub use image_preview::{ImageInfo, ImagePreviewGenerator, PreviewConfig};
pub use indexer::{IndexPhase, IndexProgress, IndexStats, MasterIndexer};
pub use inverted::{InvertedIndex, SearchHit};
pub use query::{Query, QueryPlanner, QueryResult};
pub use schema::{
    DocumentMetadata, FileCategory, FileDocument, IndexStats as SchemaIndexStats, StructuredData,
    TypedHit,
};
pub use watcher::{ChangeDetector, FileChange};
