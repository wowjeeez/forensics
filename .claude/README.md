# Detective - Forensics Analysis & Data Visualization Tool

A modern forensics-focused application with an IntelliJ-inspired interface, built with Tauri, React, TypeScript, and Tailwind CSS.

## Features

### File Analysis
- **Multiple File Type Support**: Text, Hex, Image, JSON, CSV, and Database files
- **Specialized Viewers**:
  - **CodeMirror Editor**: Syntax highlighting for JavaScript, Python, JSON, HTML, CSS
  - **Hex Viewer**: Binary file inspection with offset, hex, and ASCII views
  - **Image Viewer**: Image viewing with zoom, rotation controls
  - **JSON Viewer**: Interactive JSON tree viewer with copy functionality
  - **CSV Viewer**: Sortable table with search and filter capabilities

### Navigation & Organization
- **File Tree Explorer**: Hierarchical file browser with file size display
- **Tab System**: Multi-tab interface for viewing multiple files simultaneously
- **Sidebar Navigation**: Quick access to Files, Search, Databases, Analysis, Groups, and Timeline

### Search & Analysis
- **Advanced Search**: Full-text search with regex support, case sensitivity, and whole-word matching
- **Group Management**: Create color-coded groups to organize and categorize findings
- **Timeline View**: Chronological event visualization for forensic investigations

### Data Visualization
- **Charts**: Bar, line, and pie charts using Recharts
- **Database Viewer**: SQL query execution and table browsing
- **Custom Visualizations**: Ready for forensic-specific data representations

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Desktop Framework**: Tauri 2.x
- **Styling**: Tailwind CSS v4
- **Code Editor**: CodeMirror 6
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite 7

## Project Structure

```
detective/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TabBar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── FileTree.tsx
│   │   ├── editor/          # Code editor
│   │   │   └── CodeEditor.tsx
│   │   ├── viewers/         # File viewers
│   │   │   ├── HexViewer.tsx
│   │   │   ├── ImageViewer.tsx
│   │   │   ├── JsonViewer.tsx
│   │   │   └── CsvViewer.tsx
│   │   ├── search/          # Search functionality
│   │   │   └── SearchPanel.tsx
│   │   └── analysis/        # Analysis tools
│   │       ├── DataChart.tsx
│   │       ├── Timeline.tsx
│   │       ├── DatabaseViewer.tsx
│   │       └── GroupManager.tsx
│   ├── hooks/               # React hooks
│   │   └── useFileSystem.ts
│   ├── lib/                 # Utilities
│   │   └── utils.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/               # Tauri backend (Rust)
└── public/                  # Static assets
```

## Development

### Prerequisites
- Node.js 18+
- pnpm
- Rust (for Tauri)

### Setup
```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build

# Run Tauri app
pnpm tauri dev
```

## Design Philosophy

The interface is inspired by JetBrains IntelliJ IDEA, featuring:
- Dark theme optimized for extended analysis sessions
- Resizable panels for flexible workspace organization
- Keyboard-friendly navigation
- Clear visual hierarchy with consistent color coding

## Color Palette

### Editor Colors
- Background: `#1E1E1E`
- Sidebar: `#2B2B2B`
- Toolbar: `#3C3F41`
- Border: `#323232`
- Selection: `#214283`

### Syntax Colors
- Blue: `#589DF6` (Keywords, functions)
- Green: `#6AAF50` (Strings)
- Yellow: `#FFC66D` (Numbers)
- Orange: `#CC7832` (Constants)
- Red: `#E06C75` (Errors)
- Purple: `#9876AA` (Types)
- Cyan: `#56B6C2` (Operators)

## Next Steps

To enhance the forensics capabilities, consider implementing:

1. **File System Integration**:
   - Tauri file dialogs for opening folders/files
   - File watcher for real-time updates
   - Recursive directory scanning

2. **Advanced Analysis**:
   - EXIF data extraction for images
   - Binary pattern matching
   - File signature detection
   - Hash calculation (MD5, SHA-256)

3. **Database Support**:
   - SQLite integration
   - Query history
   - Export query results

4. **Search Enhancements**:
   - Multi-file search
   - Regular expression builder
   - Search history

5. **Export Capabilities**:
   - PDF report generation
   - CSV/JSON export
   - Timeline export

6. **Collaboration**:
   - Session saving/loading
   - Annotation system
   - Bookmarks

## License

MIT
