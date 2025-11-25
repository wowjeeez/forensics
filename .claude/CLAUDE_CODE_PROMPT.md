# Claude Code Task: Detective Forensics Application Feature Implementation

## Project Context

You are working on **Detective**, a forensics file analysis application built with:
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **Backend**: Rust (Tauri) with trait-based file system abstraction
- **Architecture**: IntelliJ-inspired UI with parallel backend processing

**Project Location**: `/Users/levander/coding/detective/`

## Critical Instructions

1. **Read Documentation First**: Before starting, read these files in order:
   - `/Users/levander/coding/detective/.claude/ARCHITECTURE.md`
   - `/Users/levander/coding/detective/.claude/INDEX_ARCHITECTURE.md`
   - `/Users/levander/coding/detective/.claude/FRONTEND_FEATURES.md`
   - `/Users/levander/coding/detective/.claude/CONTEXT_EXPLORATION.md`

2. **Document Your Work**: Create/update files in `.claude/` directory:
   - Document discoveries in `.claude/IMPLEMENTATION_NOTES.md`
   - Track issues and solutions in `.claude/ISSUES_AND_SOLUTIONS.md`
   - Keep context up to date as you proceed

3. **Explore Before Implementing**:
   - Map existing code structure
   - Identify what's already implemented
   - Document current state before making changes

4. **No Hallucinations**: If you're unsure about implementation details, explore the codebase first

## Tasks to Implement

### Task 1: Cross-File Structured Search

**Goal**: Implement full cross-file structured search functionality connecting UI to the Tantivy-based indexing backend.

**Current State**:
- SearchPanel UI exists with file type filters (`src/components/search/SearchPanel.tsx`)
- GlobalSearch component exists (`src/components/search/GlobalSearch.tsx`)
- Backend architecture documented in `INDEX_ARCHITECTURE.md`
- Need to verify if Rust indexing code actually exists in `src-tauri/`

**Implementation Steps**:
1. **Audit Existing Code**:
   - Check `src-tauri/src/index/` for existing Rust implementation
   - Verify if Tantivy dependencies are in `src-tauri/Cargo.toml`
   - Check if Tauri commands for indexing exist

2. **Backend Implementation** (if missing):
   - Implement Tantivy-based inverted index (`src-tauri/src/index/inverted.rs`)
   - Create type-specific extractors:
     - SQLite extractor (`src-tauri/src/index/extractors/sqlite.rs`)
     - JSON extractor (`src-tauri/src/index/extractors/json.rs`)
     - CSV extractor (`src-tauri/src/index/extractors/csv_extractor.rs`)
     - Excel extractor (`src-tauri/src/index/extractors/excel.rs`)
     - XML extractor (`src-tauri/src/index/extractors/xml.rs`)
     - Text extractor (`src-tauri/src/index/extractors/text.rs`)
   - Implement file type detector (`src-tauri/src/index/detector.rs`)
   - Create master indexer orchestrator (`src-tauri/src/index/indexer.rs`)
   - Implement query planner (`src-tauri/src/index/query.rs`)
   - Add incremental indexing with change detection (`src-tauri/src/index/watcher.rs`)

3. **Tauri Commands**:
   ```rust
   #[tauri::command]
   async fn index_directory(path: String, options: IndexOptions) -> Result<IndexStats>;
   
   #[tauri::command]
   async fn search_index(query: SearchQuery) -> Result<Vec<SearchResult>>;
   
   #[tauri::command]
   async fn get_index_status(path: String) -> Result<IndexStatus>;
   
   #[tauri::command]
   async fn extract_deep(path: String, category: String) -> Result<String>;
   ```

4. **Frontend Integration**:
   - Update SearchPanel to call backend indexing/search commands
   - Add structured query builder UI for SQLite tables, JSON paths, CSV columns
   - Display search results with file type icons and previews
   - Add "Deep Extract" button for detailed file inspection
   - Handle search result pagination for large result sets

5. **Features to Include**:
   - Full-text search across all indexed content
   - Metadata filtering (category, size, date, mime type)
   - Structured queries:
     - Search SQLite table names
     - Search JSON paths
     - Search CSV/Excel column names
     - Search XML element names
   - Combined queries (metadata + full-text + structured)
   - Real-time search suggestions
   - Search history

**Dependencies to Add** (if missing):
```toml
# src-tauri/Cargo.toml
tantivy = "0.22"
rusqlite = "0.32"
csv = "1.3"
calamine = "0.26"
quick-xml = "0.37"
```

---

### Task 2: Fix and Enhance Groups Functionality

**Goal**: Fix bugs in existing GroupManager and add context menu integration for creating groups from any data selection.

**Current State**:
- GroupManager component exists at `src/components/analysis/GroupManager.tsx`
- Context menu system exists at `src/components/ui/ContextMenu.tsx`
- FileTree has context menu integration

**Implementation Steps**:

1. **Audit Current GroupManager**:
   - Read `src/components/analysis/GroupManager.tsx`
   - Identify and document existing bugs
   - Check data structure used for storing groups

2. **Fix Existing Bugs**:
   - Document each bug and its fix in `.claude/ISSUES_AND_SOLUTIONS.md`
   - Ensure groups persist across sessions
   - Fix any state management issues
   - Ensure group operations (add, remove, rename, delete) work correctly

3. **Backend Support**:
   - Create Tauri commands for group persistence:
     ```rust
     #[tauri::command]
     async fn save_group(group: Group) -> Result<()>;
     
     #[tauri::command]
     async fn load_groups() -> Result<Vec<Group>>;
     
     #[tauri::command]
     async fn delete_group(group_id: String) -> Result<()>;
     
     #[tauri::command]
     async fn add_to_group(group_id: String, item: GroupItem) -> Result<()>;
     ```

4. **Data Structure**:
   ```typescript
   interface Group {
     id: string;
     name: string;
     description?: string;
     created: Date;
     modified: Date;
     items: GroupItem[];
     color?: string;  // For visual distinction
   }
   
   interface GroupItem {
     id: string;
     type: 'file' | 'selection' | 'search_result';
     path: string;           // Full file path
     content?: string;       // Selected text or extracted content
     metadata: {
       offset?: number;      // Byte offset for selections
       length?: number;      // Length of selection
       lineStart?: number;   // Line number for text selections
       lineEnd?: number;
       timestamp: Date;      // When added to group
       hash?: string;        // File hash at time of addition
     };
   }
   ```

5. **Context Menu Integration**:
   - Add "Add to Group" menu item to:
     - File tree context menu
     - Text selection in viewers (CodeEditor, HexViewer, TextView)
     - Search results
     - Database query results
   - Show submenu with existing groups + "Create New Group"
   - Allow drag-and-drop to groups in sidebar

6. **Group Operations**:
   - **Combine**: Union multiple groups into a new group
   - **Isolate**: Filter to show only items from specific group(s)
   - **Intersect**: Find common items across groups
   - **Diff**: Show items unique to each group
   - **Export**: Export group as JSON, CSV, or report

7. **UI Enhancements**:
   - Visual badges showing which files are in groups
   - Group color coding in file tree
   - Group panel in sidebar showing all groups
   - Drag-and-drop reordering of items within groups
   - Bulk operations (add multiple files to group)

8. **Persistence**:
   - Store groups in SQLite database or JSON file
   - Auto-save on changes
   - Import/export group definitions

---

### Task 3: Implement Tags System

**Goal**: Create a flexible tagging system where any file can have unlimited tags, similar to groups but more lightweight.

**Implementation Steps**:

1. **Backend Support**:
   - Create Tauri commands:
     ```rust
     #[tauri::command]
     async fn add_tag(path: String, tag: String) -> Result<()>;
     
     #[tauri::command]
     async fn remove_tag(path: String, tag: String) -> Result<()>;
     
     #[tauri::command]
     async fn get_tags(path: String) -> Result<Vec<String>>;
     
     #[tauri::command]
     async fn get_all_tags() -> Result<Vec<TagInfo>>;
     
     #[tauri::command]
     async fn search_by_tag(tags: Vec<String>, match_all: bool) -> Result<Vec<String>>;
     ```

2. **Data Structure**:
   ```typescript
   interface TagInfo {
     name: string;
     color?: string;
     count: number;        // Number of files with this tag
     created: Date;
   }
   
   interface FileTag {
     path: string;
     tags: string[];
     updated: Date;
   }
   ```

3. **Storage**:
   - Store tags in sled tree similarly to tags

4. **Context Menu Integration**:
   - Add "Manage Tags" menu item to file tree context menu
   - Add "Add Tag" quick action
   - Show submenu with recent/frequent tags + "Create New Tag"
   - Allow tagging selections within files (similar to groups)
   - (NATIVE CONTEXT MENU https://v2.tauri.app/reference/javascript/api/namespacemenu/)

5. **UI Components**:
   - Create `TagManager.tsx` component:
     - Tag cloud showing all tags with size based on usage
     - Filter view showing files by tag
     - Tag editing (rename, delete, change color)
   - Create `TagInput.tsx` component:
     - Auto-complete dropdown
     - Create new tags inline
     - Multi-tag selection
   - Add tag badges to file tree items
   - Add tag filter to search panel

6. **Tag Operations**:
   - **Bulk Tagging**: Tag multiple files at once
   - **Tag Hierarchies**: Support "category:subcategory" format
   - **Smart Tags**: Auto-tag based on rules (file type, size, location)
   - **Tag Suggestions**: ML-based tag recommendations
   - **Tag Search**: Find files by tag combinations (AND/OR logic)

7. **Visual Indicators**:
   - Show tag badges in file tree (small colored dots)
   - Tag chips in file properties panel
   - Tag count in status bar
   - Tag cloud in sidebar

8. **Export/Import**:
   - Export tags as JSON
   - Import tags from other tools (macOS Finder tags, etc.)
   - Sync tags with file system extended attributes (optional)

---

### Task 4: Implement Index Indicator

**Goal**: Create visual indicators showing at-a-glance whether files/directories are indexed.

**Implementation Steps**:

1. **Backend Support**:
   - Create Tauri commands:
     ```rust
     #[tauri::command]
     async fn get_index_status(path: String) -> Result<IndexStatus>;
     
     #[tauri::command]
     async fn get_indexing_progress() -> Result<IndexingProgress>;
     
     #[tauri::command]
     async fn is_indexed(path: String) -> Result<bool>;
     ```

2. **Data Structures**:
   ```typescript
   interface IndexStatus {
     path: string;
     indexed: boolean;
     indexedAt?: Date;
     status: 'not_indexed' | 'indexing' | 'indexed' | 'error' | 'outdated';
     error?: string;
     fileCount?: number;
     indexedFileCount?: number;
   }
   
   interface IndexingProgress {
     active: boolean;
     currentPath?: string;
     filesProcessed: number;
     totalFiles: number;
     startTime?: Date;
     estimatedCompletion?: Date;
     errors: Array<{path: string, error: string}>;
   }
   ```

3. **File Tree Integration**:
   - Add index status icon next to each file/folder:
     - ✅ Green checkmark: Indexed and up-to-date
     - 🔄 Blue spinner: Currently indexing
     - ⚠️ Yellow warning: Outdated (file modified since indexing)
     - ❌ Red X: Not indexed
     - 🔴 Red dot: Indexing error
   - Show status as badge or prefix icon
   - Add tooltip showing index details (last indexed time, file count)

4. **Status Bar Integration**:
   - Global indexing status in status bar:
     - "Indexed: 1,234 / 5,678 files (21%)"
     - Show progress bar during active indexing
     - Click to open indexing panel
   - Show errors count (click to view details)

5. **Indexing Panel**:
   - Create `IndexingPanel.tsx` in `src/components/panels/`:
     - Overview section:
       - Total files indexed
       - Total index size
       - Last full index time
       - Index health status
     - Active indexing section:
       - Current file being processed
       - Progress bar
       - Files per second metric
       - Estimated time remaining
     - Error section:
       - List of files that failed to index
       - Error messages
       - "Retry" button for failed files
     - Actions:
       - "Rebuild Index" button
       - "Clear Index" button
       - "Index This Directory" button
       - "Pause/Resume Indexing" button

6. **Context Menu Integration**:
   - Add "Index Now" option to file/folder context menu
   - Add "View Index Status" option
   - Add "Remove from Index" option

7. **Indicators File** (optional):
   - Create `.detective-index` file in each indexed directory
   - Contains metadata: index version, file count, last updated
   - Can be used for quick status check without querying database

8. **Performance Considerations**:
   - Cache index status in frontend state
   - Update status asynchronously
   - Don't query status for every file in large trees
   - Show status only for visible files (virtualization)
   - Batch status queries for efficiency

9. **Visual Design**:
   - Use subtle icons that don't clutter the tree
   - Color-code by status (green/blue/yellow/red)
   - Show detailed status on hover
   - Make icons clickable to trigger actions
   - Consider using file tree row highlighting for indexed files

---

## General Implementation Guidelines

### Code Quality
- Follow existing code style in the project
- Use TypeScript strict mode
- Implement proper error handling
- Add loading states for async operations
- Include comprehensive comments for complex logic

### Testing
- Test each feature thoroughly before moving to next
- Test edge cases (empty directories, huge files, permission errors)
- Test performance with large datasets
- Test cross-platform compatibility (if applicable)

### User Experience
- Provide clear feedback for all operations
- Show progress for long-running operations
- Make features discoverable (tooltips, help text)
- Ensure keyboard shortcuts work
- Follow existing UI patterns in the application

### Performance
- Optimize for large file sets (1M+ files)
- Use virtualization for large lists
- Implement pagination for search results
- Use lazy loading where appropriate
- Profile and optimize bottlenecks

### Documentation
- Update `.claude/IMPLEMENTATION_NOTES.md` as you go
- Document new Tauri commands
- Update README with new features
- Create user guide for new features in `.claude/USAGE.md`

## Order of Implementation

**Recommended order**:
1. **Index Indicator** (simplest, helps with testing other features)
2. **Tags System** (standalone, doesn't depend on others)
3. **Fix Groups** (depends on existing code)
4. **Cross-File Search** (most complex, benefits from other features)

However, adjust based on what you discover in the codebase.

## Success Criteria

### Cross-File Structured Search
- [ ] User can search across all indexed files
- [ ] Structured queries work (SQLite tables, JSON paths, CSV columns)
- [ ] Search results display correctly with previews
- [ ] Search is fast (<100ms for most queries)
- [ ] Incremental indexing updates index when files change

### Groups
- [ ] All existing bugs are fixed and documented
- [ ] User can right-click and add any data to a group
- [ ] Groups persist across sessions
- [ ] Groups store both content and path information
- [ ] User can combine, isolate, and export groups
- [ ] Groups display correctly in UI with visual indicators

### Tags
- [ ] User can tag any file from context menu
- [ ] Tags persist and sync properly
- [ ] Tag auto-complete works
- [ ] Can filter files by tags
- [ ] Tag indicators show in file tree
- [ ] Tag manager panel works correctly

### Index Indicator
- [ ] Visual indicators show index status in file tree
- [ ] Status bar shows global indexing progress
- [ ] Indexing panel shows detailed status and errors
- [ ] Indicators update in real-time during indexing
- [ ] User can trigger indexing from context menu

## Critical Notes

1. **Read the existing documentation first** - Don't implement until you understand the architecture
2. **Explore before coding** - Map what exists before creating new code
3. **Document your findings** - Keep `.claude/` files updated
4. **Ask for clarification** - If requirements are unclear, document assumptions
5. **Test incrementally** - Don't build everything at once
6. **Follow existing patterns** - Match the style of existing components
7. **Performance matters** - This is a forensics tool that deals with large datasets

## Getting Started

1. Read all documentation in `.claude/` directory
2. Explore `src/` and `src-tauri/` to understand current state
3. Create `.claude/IMPLEMENTATION_NOTES.md` to track progress
4. Start with the simplest task (Index Indicator) to understand workflow
5. Document issues and solutions as you encounter them

Good luck! This is a substantial undertaking but the architecture is solid and the documentation is thorough.
