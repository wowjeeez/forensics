# Detective Project Context Exploration

## Date: 2025-11-25

## Project Overview
- **Name**: Detective
- **Type**: Forensics file analysis application
- **Tech Stack**: React 19 + TypeScript + Tauri (Rust backend)
- **Architecture**: IntelliJ-inspired UI with trait-based backend

## Current Implementation Status

### Completed Features
1. **File System Abstraction**
   - Trait-based architecture for multiple storage backends
   - LocalFileSystem with async I/O (tokio)
   - Parallel directory scanning (rayon)
   - Hash calculation (MD5, SHA256)

2. **Viewers**
   - PdfViewer
   - ImageViewer (with HEIC support)
   - OfficeViewer (DOCX, XLSX, PPTX)
   - HexViewer (with multiple encodings)
   - JsonViewer
   - CsvViewer
   - CodeEditor (CodeMirror 6)

3. **Search System**
   - SearchPanel with file type filters
   - GlobalSearch component
   - Tantivy-based inverted index (documented, implementation status unknown)
   - Type-specific extractors (SQLite, JSON, CSV, Excel, XML, text)

4. **UI Components**
   - MainLayout with panels
   - FileTree with context menu
   - TabBar for multi-tab viewing
   - Toolbar, Sidebar, StatusBar

5. **Analysis Tools**
   - DataChart
   - Timeline
   - DatabaseViewer
   - GroupManager (exists, but reported to have bugs)

### Features to Implement (Per User Request)

#### 1. Cross-File Structured Search
- Status: "Most of the UI is already done"
- Backend: Tantivy index architecture documented
- Needs: Implementation to connect UI to backend indexing system

#### 2. Groups Functionality
- Status: GroupManager.tsx exists but has bugs
- Needs:
  - Fix existing bugs
  - Add context menu integration
  - Allow "Add to Group" from any file/data selection
  - Store both text content AND path to data
  - Support combining and isolating group results

#### 3. Tags System
- Status: Not implemented
- Needs:
  - Similar to groups functionality
  - Any file can have unlimited tags
  - Likely needs context menu integration

#### 4. Index Indicator
- Status: Not implemented
- Needs:
  - Visual indicator to show if file/directory is indexed
  - At-a-glance status view
  - Possibly a file or UI component showing indexing status

## Directory Structure
```
/Users/levander/coding/detective/
├── .claude/                 # Documentation and context
│   ├── ARCHITECTURE.md
│   ├── INDEX_ARCHITECTURE.md
│   ├── FRONTEND_FEATURES.md
│   └── ...
├── src/                     # React frontend
│   ├── components/
│   │   ├── search/          # Search UI components
│   │   ├── analysis/        # Analysis tools (includes GroupManager)
│   │   ├── viewers/         # File type viewers
│   │   └── ...
│   └── ...
└── src-tauri/              # Rust backend
    └── ...
```

## Indexing Architecture Summary
- **Core**: Tantivy inverted index
- **Extractors**: Type-specific for SQLite, JSON, CSV, Excel, XML, text
- **Strategy**: Multi-stage with lazy deep extraction
- **Change Detection**: SHA256 hash + mtime for incremental indexing
- **Query Types**: Full-text, metadata, structured, combined

## Questions to Ask User
1. Cross-file structured search: What specific functionality is missing? Is it connecting the UI to the backend index?
2. Groups: What are the specific bugs you're encountering?
3. Groups: What data structures should be stored (just paths, or text + metadata)?
4. Tags: Should tags be stored per file, or can they apply to selections within files?
5. Index indicator: Where should this appear? File tree? Status bar? Separate panel?
6. Do you have existing backend Rust code for the indexing system, or does that need to be implemented too?
