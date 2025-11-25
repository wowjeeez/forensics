# Detective - Rust Backend

High-performance, parallelized file system abstraction layer for the Detective forensics application.

## Architecture

The backend uses a trait-based architecture to support multiple storage backends (local filesystem, S3, etc.) with a unified interface.

### Key Components

#### 1. File System Trait (`io/fs.rs`)

The core `FileSystem` trait provides a common async interface for all storage backends:

```rust
#[async_trait]
pub trait FileSystem: Send + Sync {
    async fn read_file(&self, path: &Path) -> Result<Vec<u8>>;
    async fn list_dir(&self, path: &Path) -> Result<Vec<FileInfo>>;
    async fn scan_directory(&self, path: &Path, options: DirectoryScanOptions) -> Result<FileInfo>;
    async fn search_files(&self, base_path: &Path, options: SearchOptions) -> Result<Vec<PathBuf>>;
    async fn calculate_hash(&self, path: &Path) -> Result<FileHash>;
    // ... and more
}
```

**Key Features:**
- Fully async using `tokio`
- Parallel operations support
- Type-safe error handling
- Extensible for future backends (S3, Azure, etc.)

#### 2. Local File System Implementation (`io/local.rs`)

Implements `FileSystem` trait for local storage using `tokio::fs`:

**Performance Features:**
- **Parallel Directory Scanning**: Uses `rayon` to scan directories in parallel
- **Chunked Reading**: Supports reading large files in chunks
- **Async I/O**: All operations are non-blocking
- **Hash Calculation**: MD5 and SHA256 hashing for file verification

**Example:**
```rust
let fs = LocalFileSystem::new();
let files = fs.list_dir(Path::new("/evidence")).await?;

// Parallel directory scan
let options = DirectoryScanOptions {
    max_depth: Some(5),
    include_hidden: false,
    follow_symlinks: false,
    parallel: true, // Enable parallel scanning
};
let tree = fs.scan_directory(Path::new("/evidence"), options).await?;
```

#### 3. Types (`io/types.rs`)

Comprehensive type definitions for file system operations:

- `FileInfo`: File/directory metadata with optional children
- `FileMetadata`: Detailed file information (size, dates, permissions)
- `FileType`: File, Directory, Symlink, Unknown
- `FilePermissions`: Cross-platform permission abstraction
- `SearchOptions`: Configurable search parameters
- `DirectoryScanOptions`: Options for recursive directory scanning
- `FileHash`: MD5 and SHA256 hash values

#### 4. Error Handling (`io/error.rs`)

Custom error types with serde support for frontend communication:

```rust
pub enum FileSystemError {
    FileNotFound { path: PathBuf },
    PermissionDenied { path: PathBuf },
    IoError(std::io::Error),
    // ... and more
}
```

Errors are automatically serialized for Tauri IPC.

#### 5. Tauri Commands (`io/commands.rs`)

Exposes file system operations to the frontend via Tauri commands:

**Available Commands:**
- `read_file` / `read_file_as_string`
- `write_file`
- `list_directory` / `scan_directory`
- `get_metadata` / `get_file_size`
- `search_files` / `search_content`
- `calculate_hash`
- `copy_file` / `move_path`
- `delete_file` / `delete_directory`
- `create_directory`

**Frontend Usage:**
```typescript
import { invoke } from '@tauri-apps/api/core';

// List directory
const files = await invoke('list_directory', { path: '/evidence' });

// Scan directory recursively with parallelization
const tree = await invoke('scan_directory', {
  path: '/evidence',
  options: {
    maxDepth: 5,
    includeHidden: false,
    followSymlinks: false,
    parallel: true
  }
});

// Calculate file hashes
const hashes = await invoke('calculate_hash', { path: '/evidence/file.bin' });
console.log(`MD5: ${hashes.md5}, SHA256: ${hashes.sha256}`);

// Search for files
const results = await invoke('search_files', {
  basePath: '/evidence',
  options: {
    pattern: '*.log',
    caseSensitive: false,
    includeHidden: false,
    maxResults: 100
  }
});
```

## Parallelization Strategy

### Directory Scanning

The `scan_directory` operation supports parallel scanning using `rayon`:

```rust
// Parallel scan (default)
let options = DirectoryScanOptions {
    parallel: true,
    max_depth: Some(10),
    ..Default::default()
};
```

**How it works:**
1. Directory entries are collected
2. Entries are processed in parallel using `rayon::par_iter()`
3. Subdirectories are recursively scanned in parallel
4. Results are aggregated into a tree structure

**Performance:** On multi-core systems, parallel scanning can be 3-5x faster for large directory trees.

### Search Operations

Both `search_files` and `search_content` run in separate threads using `tokio::task::spawn_blocking` to avoid blocking the async runtime.

## Future Backend Support

The trait-based design makes adding new backends straightforward:

### Example: S3 Backend

```rust
// Future implementation
pub struct S3FileSystem {
    client: aws_sdk_s3::Client,
    bucket: String,
}

#[async_trait]
impl FileSystem for S3FileSystem {
    async fn read_file(&self, path: &Path) -> Result<Vec<u8>> {
        // S3 get_object implementation
    }

    async fn list_dir(&self, path: &Path) -> Result<Vec<FileInfo>> {
        // S3 list_objects_v2 implementation
    }

    // ... implement other methods
}
```

Then update `FileSystemBuilder`:

```rust
pub enum BackendType {
    Local,
    S3 { bucket: String, region: String },
}

impl FileSystemBuilder {
    pub fn s3(bucket: String, region: String) -> Self {
        Self::new(BackendType::S3 { bucket, region })
    }
}
```

## Testing

```bash
# Run tests
cd src-tauri
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_local_fs_read_write
```

Example test:
```rust
#[tokio::test]
async fn test_local_fs_read_write() {
    let fs = LocalFileSystem::new();
    let test_path = Path::new("/tmp/test_detective.txt");

    let data = b"Hello, World!";
    fs.write_file(test_path, data).await.unwrap();

    let read_data = fs.read_file(test_path).await.unwrap();
    assert_eq!(data, &read_data[..]);

    fs.delete_file(test_path).await.unwrap();
}
```

## Dependencies

- **tokio**: Async runtime and async I/O
- **async-trait**: Async traits support
- **rayon**: Data parallelism
- **serde** / **serde_json**: Serialization
- **thiserror** / **anyhow**: Error handling
- **sha2** / **md-5**: Cryptographic hashing
- **chrono**: Date/time handling

## Performance Considerations

1. **Large Files**: Use `read_file_chunked` for files > 100MB
2. **Many Files**: Enable parallel scanning for directories with > 1000 files
3. **Deep Hierarchies**: Set `max_depth` to limit recursion
4. **Search**: Use file extension filters to reduce search space

## Security

- File operations respect OS permissions
- Path validation prevents directory traversal
- Error messages include sanitized paths
- Future: Add configurable path restrictions and sandboxing

## License

MIT
