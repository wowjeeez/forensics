# Frontend Features Implementation

## Overview
Enhanced the React frontend with comprehensive file viewing capabilities, advanced search features, and context menus.

## Features Implemented

### 1. Enhanced Search Panel (`src/components/search/SearchPanel.tsx`)
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

### 2. PDF Viewer (`src/components/viewers/PdfViewer.tsx`)
- **Dependencies**: `react-pdf`, `pdfjs-dist`
- **Features**:
  - Page navigation with prev/next buttons
  - Zoom controls (50% - 300%)
  - Page counter display
  - Handles loading and error states
  - Renders text and annotation layers

### 3. Enhanced Image Viewer (`src/components/viewers/ImageViewer.tsx`)
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

### 4. Office Document Viewer (`src/components/viewers/OfficeViewer.tsx`)
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

### 5. Enhanced Hex Viewer (`src/components/viewers/HexViewer.tsx`)
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

### 6. Custom Context Menu (`src/components/ui/ContextMenu.tsx`)
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

## Dependencies Added
```json
{
  "react-pdf": "10.2.0",
  "pdfjs-dist": "5.4.394",
  "heic2any": "0.0.4",
  "mammoth": "1.11.0",
  "xlsx": "0.18.5"
}
```

## File Structure
```
src/
├── components/
│   ├── search/
│   │   └── SearchPanel.tsx          (Enhanced with filters)
│   ├── viewers/
│   │   ├── PdfViewer.tsx           (New)
│   │   ├── OfficeViewer.tsx        (New)
│   │   ├── ImageViewer.tsx         (Enhanced with HEIC)
│   │   ├── HexViewer.tsx           (Enhanced with encodings)
│   │   └── PreviewFile.tsx         (Updated)
│   ├── ui/
│   │   └── ContextMenu.tsx         (New)
│   └── layout/
│       └── FileTree.tsx            (Enhanced with context menu)
```

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
