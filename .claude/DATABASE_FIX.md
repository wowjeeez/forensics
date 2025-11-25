# Database Locking Issue - Fixed

## Problem
The application was encountering a database lock error:
```
Database error: IO error: could not acquire lock on "/Users/levander/Library/Application Support/com.detective.detective/412171ecfcfcb231/db": Os { code: 35, kind: WouldBlock, message: "Resource temporarily unavailable" }
```

## Root Cause
The issue occurred in `src-tauri/src/db/commands.rs` in the `index_directory` function. The code was:
1. Opening a shared database reference through the `DatabaseState`
2. Using that reference for indexing
3. Then **opening the database again** to update metadata (line 72)

This created a lock conflict because Sled (the embedded database) doesn't allow multiple concurrent instances accessing the same database directory.

## Changes Made

### 1. Improved Sled Configuration (`src-tauri/src/db/store.rs:79-85`)
```rust
// Configure Sled for better concurrency and performance
let config = sled::Config::new()
    .path(&db_path)
    .cache_capacity(1024 * 1024 * 128) // 128MB cache
    .flush_every_ms(Some(1000)) // Flush every second
    .mode(sled::Mode::HighThroughput);

let db = config.open()?;
```

**Benefits:**
- Larger cache (128MB) reduces disk I/O
- Periodic flushing (1 second) balances durability with performance
- HighThroughput mode optimized for concurrent operations

### 2. Removed Mutable Requirement (`src-tauri/src/db/store.rs:145,154`)
Changed method signatures from `&mut self` to `&self`:
```rust
// Before
pub fn save_metadata(&mut self, metadata: &ProjectMetadata) -> Result<()>
pub fn update_last_opened(&mut self) -> Result<()>

// After
pub fn save_metadata(&self, metadata: &ProjectMetadata) -> Result<()>
pub fn update_last_opened(&self) -> Result<()>
```

**Why:** Sled is thread-safe internally. Operations don't need exclusive mutable access. This allows the methods to work with `Arc<ProjectDatabase>` without requiring exclusive locks.

### 3. Fixed index_directory Function (`src-tauri/src/db/commands.rs:56-82`)
```rust
// Before (BROKEN)
let db = state.get_db().await.ok_or("No database open")?;
let indexer = FileIndexer::new_with_arc(Arc::clone(&db));
let stats = indexer.index_tree(&file_tree).await?;

// Re-opening the database while shared reference is still held!
let mut db_for_update = ProjectDatabase::open(db.project_path())?;
db_for_update.save_metadata(&metadata)?; // LOCK CONFLICT

// After (FIXED)
let db = state.get_db().await.ok_or("No database open")?;
let indexer = FileIndexer::new_with_arc(Arc::clone(&db));
let stats = indexer.index_tree(&file_tree).await?;

// Use the same shared database reference
db.save_metadata(&metadata)?; // Works because save_metadata no longer needs mut
```

## Impact

### Performance Improvements
- **128MB cache**: Faster reads/writes by keeping more data in memory
- **Async flushing**: Better throughput by batching disk writes
- **HighThroughput mode**: Optimized for concurrent operations

### Reliability Improvements
- **No more lock conflicts**: Single database instance shared across operations
- **Thread-safe access**: Sled handles concurrency internally
- **Cleaner code**: No need for workarounds or retry logic

## Testing
To verify the fix:
1. Open a large directory (1000+ files)
2. Let it scan and index completely
3. Verify no lock errors appear in logs
4. Check that metadata is correctly updated

## Related Files
- `src-tauri/src/db/store.rs` - Database configuration and method signatures
- `src-tauri/src/db/commands.rs` - Command handlers that use the database
- `src-tauri/src/db/indexer.rs` - File indexing logic (unchanged but affected)

## Future Considerations
- Consider adding connection pooling if database access patterns become more complex
- Monitor cache hit rates and adjust cache size if needed
- Add metrics for database operation latency
