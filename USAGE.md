# Detective - Usage Guide

## Getting Started

### Running the Application

```bash
# Development mode (with hot reload)
pnpm tauri dev

# Production build
pnpm tauri build
```

## Workflow

### 1. Opening a Directory for Analysis

1. **Click "Open Folder"** button in the toolbar (or in the sidebar if no files are loaded)
2. **Select Evidence Directory** - Choose the root directory containing files to analyze
3. **Wait for Scanning** - The app scans the directory structure using parallel processing
4. **Review & Exclude** - A dialog appears showing the directory tree:
   - Review all discovered files and folders
   - **Exclude large/unnecessary folders** to prevent performance issues
   - Click "Included/Excluded" buttons to toggle folders
   - See real-time file count updates
5. **Confirm & Index** - Click "Index X Files" to load the directory

### 2. Browsing Files

- **File Tree**: Navigate the directory structure in the left sidebar
- **Click Files**: Click any file to open it in a new tab
- **Multiple Tabs**: Open multiple files simultaneously with tab management
- **Close Tabs**: Click the X icon on each tab to close

### 3. File Viewing

The app automatically detects file types and uses the appropriate viewer:

#### Text Files
- **Supported**: `.txt`, `.log`, `.md`, `.js`, `.ts`, `.py`, `.html`, `.css`, `.xml`, etc.
- **Viewer**: CodeMirror editor with syntax highlighting
- **Features**: Line numbers, read-only view

#### JSON Files
- **Supported**: `.json`
- **Viewer**: Interactive JSON tree
- **Features**:
  - Expand/collapse nodes
  - Copy to clipboard
  - Syntax highlighting
  - Automatic parsing with fallback to text view

#### CSV Files
- **Supported**: `.csv`
- **Viewer**: Sortable table
- **Features**:
  - Sort by column (click headers)
  - Search/filter rows
  - Row count display

#### Images
- **Supported**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.bmp`, `.webp`
- **Viewer**: Image viewer with controls
- **Features**:
  - Zoom in/out
  - Rotate
  - Actual size view

#### Binary/Unknown Files
- **Supported**: `.bin`, `.exe`, `.dll`, or any unknown extension
- **Viewer**: Hexadecimal viewer
- **Features**:
  - Hex dump with offset, hex bytes, and ASCII representation
  - Scrollable for large files
  - Hover highlighting

### 4. Search

1. Click **Search** icon in toolbar or switch to Search sidebar tab
2. Enter search query
3. Configure options:
   - **Case sensitive** (Aa button)
   - **Whole word** (Word button)
   - **Regex** (.* button)
4. View results grouped by file
5. Click results to jump to file

### 5. Analysis & Grouping

#### Groups
- **Create groups** to organize findings
- **Color-coded** for visual organization
- **Add/remove items** from groups
- Use for: suspicious files, evidence categories, findings organization

#### Timeline
- View events chronologically
- Filter by category
- Export timeline data

### 6. Database Analysis (Coming Soon)
- Query SQLite databases
- Browse tables
- Execute custom queries
- Export results

## Performance Tips

### For Large Directories

1. **Exclude Unnecessary Folders**
   - System folders (node_modules, .git, etc.)
   - Large binary directories
   - Backup folders

2. **Use Parallel Scanning**
   - Enabled by default
   - Leverages multi-core CPUs
   - 3-5x faster on large directories

3. **Limit Depth**
   - For extremely deep hierarchies
   - Set max depth in scan options

### File Size Considerations

- Files > 100MB: Use chunked reading automatically
- Very large files may take time to load
- Consider viewing hex dump for large binaries

## Keyboard Shortcuts (Planned)

- `Cmd/Ctrl + O` - Open folder
- `Cmd/Ctrl + F` - Search
- `Cmd/Ctrl + W` - Close tab
- `Cmd/Ctrl + Tab` - Next tab
- `Cmd/Ctrl + Shift + Tab` - Previous tab

## Best Practices

### Evidence Preservation

1. **Read-Only Mode**: All file viewing is read-only by default
2. **No Modifications**: The app never modifies source files
3. **Hash Verification**: Use hash calculation to verify integrity
4. **Document Findings**: Use groups and timeline to organize evidence

### Analysis Workflow

```
1. Open Directory → 2. Review Structure → 3. Exclude Irrelevant
      ↓
4. Browse Files → 5. Document Findings → 6. Group Evidence
      ↓
7. Search Content → 8. Analyze Patterns → 9. Export Report
```

### Organizing Investigations

- **Create Groups**: For different evidence types
- **Use Timeline**: Track file access patterns
- **Search Strategically**: Use filters to narrow results
- **Document**: Keep notes in separate files

## Troubleshooting

### App Won't Start
- Ensure Rust toolchain is installed
- Run `pnpm install` to install dependencies
- Check console for errors

### Directory Won't Scan
- **Permission Denied**: Ensure read permissions
- **Path Too Long**: Some OS have path length limits
- **Symlink Loops**: Disable "Follow Symlinks" in options

### File Won't Open
- **Large Files**: May take time to load
- **Unsupported Format**: Falls back to hex viewer
- **Corrupted Files**: Will show error message

### Performance Issues
- **Exclude large folders** before indexing
- **Close unused tabs**
- **Restart app** to clear memory
- **Disable parallel scanning** if CPU-limited

## Data Privacy

- All processing happens **locally** on your machine
- **No cloud uploads** or external network requests
- **No telemetry** or tracking
- Evidence never leaves your system

## Limitations

### Current Version
- No write/edit capabilities (intentional for forensics)
- No automatic file type detection for all formats
- Search is file content only (no metadata search yet)
- No PDF viewer (planned)
- No video/audio preview (planned)

### Future Enhancements
- Advanced database analysis
- EXIF data extraction
- File signature detection
- Export reports (PDF/HTML)
- Session saving/loading
- Bookmarks and annotations

## Support

For issues or feature requests:
- GitHub: [Your repo URL]
- Documentation: See README.md and ARCHITECTURE.md

## Safety

This tool is designed for **authorized forensic analysis** only:
- ✅ Incident response
- ✅ E-discovery
- ✅ Security research
- ✅ Malware analysis (in isolated environment)
- ❌ Unauthorized system access
- ❌ Privacy violations

Always ensure proper authorization before analyzing any system or data.
