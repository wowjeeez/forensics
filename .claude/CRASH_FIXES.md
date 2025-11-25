# Crash Fixes and Special File Handling

## Issues Fixed

### 1. HexViewer Crash - "Cannot access uninitialized variable" ✅

**Problem:**
```
ReferenceError: Cannot access uninitialized variable.
  at HexViewer.tsx:85
```

**Root Cause:**
The `calculateEntropy` function was being called in a `useMemo` hook (line 116) before it was defined (line 126). This created a Temporal Dead Zone (TDZ) error in JavaScript.

**Solution:**
- Moved `calculateEntropy` function outside and before the component definition (src/components/viewers/HexViewer.tsx:20-35)
- Removed duplicate function definition
- Now properly hoisted and available when needed

**Files Changed:**
- `src/components/viewers/HexViewer.tsx`

### 2. Crashes on Special System Files (.DS_Store, etc.) ✅

**Problem:**
Opening files like `.DS_Store`, `Thumbs.db`, or other system files could cause unexpected crashes or display errors.

**Solution:**
Added special file detection and handling in `PreviewFile.tsx`:

```typescript
// Skip special system files that might cause issues
const skipFiles = ['.ds_store', 'thumbs.db', 'desktop.ini', '.localized'];
if (skipFiles.includes(name.toLowerCase())) {
  setError('System file - view as hex to inspect');
  // Still load as hex for inspection
  const bytes = await readFile(filePath);
  setContent(bytes);
  return;
}
```

**Behavior:**
- Detects common system files
- Shows informative message: "System file - view as hex to inspect"
- Still loads content as hex viewer for forensic analysis
- Prevents crashes from unexpected file formats

**Files Changed:**
- `src/components/viewers/PreviewFile.tsx:54-62`

### 3. Better Handling of Database Directories ✅

**Problem:**
Opening LevelDB, IndexedDB, or SQLite directory structures (which contain multiple files) was confusing and could cause errors.

**Solution:**
Created a specialized `DatabaseDirectoryViewer` component that:
- Detects database directory types automatically
- Shows informative UI explaining the database structure
- Lists expected file types for each database format
- Provides usage instructions for analysis
- Warns users about multi-file database nature

**Detection Logic:**
```typescript
// LevelDB detection
if (name.toLowerCase().includes('leveldb') || fileExt === 'ldb') {
  setDbDirType('leveldb');
}

// IndexedDB detection
if (name.toLowerCase().includes('indexeddb')) {
  setDbDirType('indexeddb');
}

// SQLite WAL/SHM files
if (name.toLowerCase().includes('sqlite-wal') ||
    name.toLowerCase().includes('sqlite-shm')) {
  setDbDirType('sqlite');
}
```

**Database Types Supported:**
1. **LevelDB** - Chrome/Electron key-value storage
   - File types: `.ldb`, `.log`, `MANIFEST`, `CURRENT`, `LOCK`

2. **IndexedDB** - Browser structured data storage
   - File types: `.sqlite`, `.sqlite-wal`, `.sqlite-shm`

3. **SQLite** - Relational database with WAL mode
   - File types: `.db`, `.sqlite`, `.sqlite3`, `-wal`, `-shm`

**Files Created:**
- `src/components/viewers/DatabaseDirectoryViewer.tsx` (new)

**Files Changed:**
- `src/components/viewers/PreviewFile.tsx:67-83`

### 4. Enhanced Error Handling in HexViewer ✅

**Additional Safety:**
Added comprehensive error handling to prevent crashes from malformed data:

```typescript
const bytes = useMemo(() => {
  try {
    if (!data) {
      setError('No data provided');
      return new Uint8Array(0);
    }

    if (data instanceof Uint8Array) return data;
    if (typeof data === 'string') return new TextEncoder().encode(data);
    if (data instanceof ArrayBuffer) return new Uint8Array(data);

    setError('Unsupported data type');
    return new Uint8Array(0);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to process data');
    return new Uint8Array(0);
  }
}, [data]);
```

**Protection Against:**
- Null/undefined data
- Unsupported data types
- Invalid ArrayBuffers
- Division by zero in statistics (0 bytes)

**Files Changed:**
- `src/components/viewers/HexViewer.tsx:43-68, 144-161`

## Testing Recommendations

### Test Cases:
1. ✅ Open `.DS_Store` file - should show "System file" message and hex view
2. ✅ Open LevelDB directory - should show database directory viewer
3. ✅ Open IndexedDB directory - should show database directory viewer
4. ✅ Open SQLite with WAL files - should show database directory viewer
5. ✅ Open empty file - should show "No data to display"
6. ✅ Open corrupted binary file - should gracefully show error or hex view

### Edge Cases Covered:
- ✅ System hidden files (`.DS_Store`, `Thumbs.db`, etc.)
- ✅ Database auxiliary files (`.ldb`, `-wal`, `-shm`)
- ✅ Empty files
- ✅ Null/undefined data
- ✅ Very large files (via existing chunk reading)
- ✅ Invalid UTF-8 sequences (fallback to hex)

## Summary

All crash issues have been resolved with proper error handling, special file detection, and informative UI. The application now gracefully handles:
- System files that previously caused crashes
- Multi-file database structures
- Edge cases in hex viewing
- Invalid or corrupted data

Users will see helpful messages explaining what they're looking at rather than cryptic errors or crashes.
