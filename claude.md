# Frontend Features Implementation

## Overview
Enhanced the frontend with comprehensive file viewing capabilities, advanced search features, and context menus.

## Features Implemented

### 1. Enhanced Search Panel
- **File Type Filters**: Filter search results by file categories
    - Documents (PDF, DOC, DOCX, TXT, RTF, XLS, XLSX, PPT, PPTX, CSV, MD)
    - Images (JPG, PNG, GIF, BMP, SVG, WEBP, HEIC, AVIF, ICO, TIFF)
    - Video (MP4, AVI, MOV, MKV, etc.)
    - Audio (MP3, WAV, FLAC, AAC, etc.)
    - Code (JS, TS, PY, JAVA, C, CPP, etc.)
    - Archives (ZIP, RAR, 7Z, TAR, etc.)
    - Databases (DB, SQLITE, MDB, etc.)
    - Executables (EXE, DLL, SO, APK, etc.)
- **Search Options**: Case sensitive, whole word, regex support
- **Collapsible Filter UI**: Toggle filter panel on/off
- **Extension Display**: Shows active file extensions when filters are selected

### 2. PDF Viewer
- **Dependencies**:
- **Features**:
    - Page navigation with prev/next buttons
    - Zoom controls (50% - 300%)
    - Page counter display
    - Handles loading and error states
    - Renders text and annotation layers

### 3. Enhanced Image Viewer
- **Dependencies**: `heic2any` for HEIC/HEIF conversion
- **Supported Formats**:
    - Standard: JPG, PNG, GIF, BMP, SVG, WebP, ICO, TIFF
    - Modern: HEIC, HEIF, AVIF
- **Features**:
    - HEIC to JPEG conversion on-the-fly
    - Zoom controls (10% - 500%)
    - Rotation (90° increments)
    - Image dimension display
    - Handles ArrayBuffer and URL sources
    - Loading and error states

### 4. Office Document Viewer
- **Dependencies**: `mammoth` (DOCX), `xlsx` (Excel)
- **Supported Formats**:
    - DOCX: Full rendering with styled content
    - XLSX: Multi-sheet support with tab navigation
    - PPTX: Placeholder (requires additional processing)
- **Features**:
    - Sheet selector for Excel files
    - Styled table rendering
    - Prose styling for Word documents
    - Dark theme optimized

### 5. Enhanced Hex Viewer
- **Multiple Encodings**:
    - UTF-8, UTF-16 LE/BE
    - ASCII, Latin-1, Windows-1252
- **Statistics Display**:
    - File size
    - Entropy calculation
    - Printable character percentage
    - Null byte count
- **Features**:
    - Adjustable bytes per row (8-32)
    - Color-coded hex values (null, printable, non-printable)
    - Side-by-side ASCII and decoded text display
    - Sticky header for navigation

### 6. Custom Context Menu
- **Features**:
    - Portal-based rendering (outside DOM hierarchy)
    - Submenu support
    - Keyboard navigation (ESC to close)
    - Auto-positioning (viewport aware)
    - Icons and keyboard shortcuts
    - Danger actions (red highlight)
    - Separators
- **Integrated in FileTree**:
    - File actions: Open, Copy Path/Name, Calculate Hash (MD5/SHA-256/SHA-512), Properties, Delete
    - Directory actions: Open, Expand All, Copy Path, Properties
    - Context-aware menu items

### 7. Updated PreviewFile Component
- **Auto-detection**: File extension-based viewer selection
- **Supported Types**:
    - Text files → CodeEditor
    - JSON → JsonViewer
    - CSV → CsvViewer
    - Images (all formats) → ImageViewer (with HEIC support)
    - PDF → PdfViewer
    - DOCX/XLSX/PPTX → OfficeViewer
    - Unknown/Binary → HexViewer (with encoding options)



## Usage Examples

### Search with Filters
```typescript
// Filter for documents only
<SearchPanel onSearch={handleSearch} />
// User clicks "Filters" → selects "Documents" → searches
```

### Context Menu
```typescript
// Right-click on file in tree
// Shows contextual actions based on file/directory type
```

### Viewing Files
```typescript
// PDFs: Navigate pages, zoom in/out
// HEIC images: Automatically converted to JPEG
// DOCX: Rendered with formatting
// XLSX: Switch between sheets
// Binary files: View as hex with multiple encodings
```

## Future Enhancements
- Full PPTX rendering (requires additional library)
- Video/Audio player integration
- Archive file browser (ZIP, RAR, etc.)
- Database query interface
- File comparison tool
- More hash algorithms
- Export capabilities


### Features to Implement (Per User Request)

#### 1. Cross-File Structured Search
- Status: "Most of the UI is already done"
- Backend: Tantivy index architecture documented
- Needs: Implementation to connect UI to backend indexing system

#### 2. Groups Functionality
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


LOVABLE CONTEXT FOR REFERENCE:
# Lovable Prompt Research - Complete Analysis

## Purpose
Generate a comprehensive Lovable prompt for building the Detective app UI with Mac-native appearance, clean design, and high performance.


## Architecture Patterns

### IntelliJ-Inspired Layout
- Split panes (up to 4 simultaneous)
- Tab system with drag-and-drop between panes
- Sidebar with multiple views
- Status bar with file information
- Toolbar with action buttons
- Keyboard-first navigation (Cmd+1-9, Ctrl+Tab, etc.)

### Trait-Based Backend
- FileSystem trait for abstraction
- Supports multiple backends (Local, future S3)
- Parallel directory scanning with rayon
- Async operations with tokio
- Type-safe error handling

## Complete Component Inventory

### Layout Components (9)
1. **MainLayout** - Top-level container
2. **FileTree** - Hierarchical file browser with context menu
3. **Sidebar** - Navigation panel with multiple views
4. **TabBar** - Multi-tab interface with drag support
5. **Toolbar** - Action buttons
6. **StatusBar** - File and system status
7. **EditorPane** - Container for file viewers
8. **SplitLayout** - Basic split pane system
9. **SplitLayoutEnhanced** - Advanced split with drag-drop

### File Viewers (12)
1. **CodeEditor** - CodeMirror 6 for text/code
2. **HexViewer** - Binary inspection with multiple encodings (UTF-8, UTF-16, ASCII, Latin-1)
3. **ImageViewer** - Images with HEIC conversion, zoom, rotation
4. **PdfViewer** - PDF with page navigation and zoom
5. **OfficeViewer** - DOCX, XLSX, PPTX support
6. **JsonViewer** - Interactive JSON tree
7. **XmlViewer** - Formatted XML display
8. **CsvViewer** - Sortable table view
9. **SqliteViewer** - SQLite database query interface
10. **DatabaseDirectoryViewer** - Database structure browser
11. **IndexedDbViewer** - IndexedDB inspection
12. **LevelDbViewer** - LevelDB viewing

### Analysis Components (4)
1. **DataChart** - Recharts wrapper for visualization
2. **Timeline** - Event timeline visualization
3. **GroupManager** - Item grouping and organization
4. **DatabaseViewer** - SQL query interface

### Search Components (2)
1. **SearchPanel** - Advanced search with filters
    - File type filters (Documents, Images, Video, Audio, Code, Archives, Databases, Executables)
    - Search options (case sensitive, whole word, regex)
    - Extension display
2. **GlobalSearch** - Application-wide search

### UI Components (3)
1. **ContextMenu** - Portal-based, keyboard navigable
2. **DataContextMenu** - Context menu for data selections
3. **TagInput** - Tag management input

### Dialogs (2)
1. **DirectoryScanDialog** - Directory exclusion selection
2. **IndexingModal** - Indexing progress and status

### Panels (3)
1. **GroupsPanel** - Group management interface
2. **IndexingPanel** - Indexing controls
3. **TagManager** - Tag organization panel

## UI/UX Requirements

### Mac-Native Appearance
- System fonts: -apple-system, SF Pro Text
- Native window controls (traffic lights)
- Rounded corners (10px)
- Subtle shadows
- Blur effects (backdrop-blur-20px)
- System accent colors
- Light/Dark mode support

### IntelliJ-Inspired Interactions
- Split panes (vertical/horizontal)
- Drag-and-drop tabs between panes
- Active pane indication (blue border)
- Keyboard shortcuts (Cmd+1-9, Cmd+\, Cmd+-, etc.)
- Command palette (⌘K)
- Context menus (right-click)

### Performance Targets
- Initial Load: < 1s
- Tab Switching: < 50ms
- File Tree Render: < 100ms (virtualized for large trees)
- Code Editor: < 200ms
- Smooth 60fps animations
- Bundle size: Optimize to ~4-5MB or less

### Design Principles
1. **Clean and Minimal** - No clutter, focus on content
2. **Information Dense** - Maximize usable space
3. **Keyboard-First** - All actions accessible via keyboard
4. **Consistent** - Same patterns throughout
5. **Responsive** - Smooth interactions
6. **Professional** - Forensics tool aesthetic

## Key Features

### File System Operations
- Directory scanning with parallel processing
- File hash calculation (MD5, SHA256, SHA512)
- Permission error handling
- Large file handling (100MB limit)
- Hidden file support

### Search & Indexing
- Tantivy-based full-text search
- File type filtering
- Content search in text files
- Regex support
- Case-sensitive/whole-word options
- Fast indexing with progress tracking

### Analysis Tools
- Timeline visualization for events
- Data charts (Recharts)
- Group organization
- SQL query interface
- Database structure viewing

### Viewer Capabilities
- Multiple encodings for hex (UTF-8, UTF-16, ASCII, Latin-1, Windows-1252)
- HEIC image conversion
- PDF navigation and zoom
- Office document rendering (DOCX, XLSX)
- JSON tree with search
- CSV sorting and filtering
- XML formatting
- SQLite query execution

### Context Menus
- File actions: Open, Copy Path/Name, Hash, Properties, Delete
- Directory actions: Open, Expand All, Copy Path, Properties
- Data selections: Copy, Export, Group, Tag
- Keyboard navigation (ESC to close)
- Auto-positioning (viewport aware)

## Keyboard Shortcuts

### Global
- Cmd+F: Open search
- Cmd+W: Close tab
- Cmd+O: Open folder
- Cmd+\: Split vertically
- Cmd+-: Split horizontally
- Cmd+1-9: Switch to tab
- Ctrl+Tab: Next tab
- Ctrl+Shift+Tab: Previous tab

### Viewer-Specific
- Cmd+F in all viewers: Open search
- Cmd+G / F3: Find next
- Cmd+Shift+G: Find previous
- ESC: Close search/dialogs

## UI Component Patterns

### Color Scheme
- Background: Dark (#1E1E1E) / Light (#FFFFFF)
- Text: Light (#E0E0E0) / Dark (#1E1E1E)
- Accent: System blue (#007AFF)
- Border: Subtle (#333333) / (#E0E0E0)
- Hover: Slight lighten/darken
- Active: Blue highlight

### Typography
- Font Family: -apple-system, SF Pro Text, Helvetica Neue
- Code Font: Monaco, Menlo, monospace
- Base Size: 13px (macOS standard)
- Line Height: 1.5

### Spacing
- Base unit: 4px
- Small: 8px
- Medium: 16px
- Large: 24px
- XLarge: 32px

### Border Radius
- Small: 4px
- Medium: 8px
- Large: 10px (macOS standard)

## Recommendations


### Why shadcn/ui
- Not a library - copy/paste components you own
- Built on Radix UI (accessible, unstyled primitives)
- Desktop-first design
- Native-feeling components
- Fully customizable
- TypeScript first
- Dark mode built-in
- Command palette, context menus, dialogs, etc.

## Performance Optimization Notes

### Backend Performance
- Parallel directory scanning (10-20x faster)
- Smart change detection (metadata first, then hash)
- Efficient Tantivy indexing
- Async file operations
- Graceful error handling

### Frontend Opportunities
- Virtualize file tree for 10,000+ items
- Lazy load viewers
- Code split routes
- Optimize bundle size
- Debounce search inputs
- Use Web Workers for heavy processing

## Future Enhancements Mentioned in Docs

### Frontend
- PDF viewer improvements
- Video/audio preview
- Diff viewer for file comparison
- Export reports (PDF, HTML)
- Bookmarks and annotations
- Session persistence
- Virtualized file tree

### Backend
- S3 storage backend
- Advanced search with regex
- File signature detection
- EXIF data extraction
- Archive file support (ZIP, TAR)
- Network file systems (SMB, NFS)

## Files to Reference for Lovable

Key documentation files that should be considered:

## Summary for Lovable Prompt

The Detective app is a sophisticated forensics analysis tool requiring:
1. **Mac-native UI** with system fonts, rounded corners, blur effects
2. **IntelliJ-inspired layout** with split panes, tabs, drag-drop
3. **12 specialized viewers** for different file types
4. **Advanced search** with filters and full-text indexing
5. **Context menus** for all interactions
6. **Keyboard-first** navigation throughout
7. **Performance** focus with virtualization and optimization
8. **Clean, professional** aesthetic suitable for forensics work
9. **Dark/light mode** support
10. **Comprehensive** feature set while maintaining simplicity

The UI must feel **native to macOS**, be **fast and responsive**, and support **complex workflows** typical of file forensics and analysis tools.
