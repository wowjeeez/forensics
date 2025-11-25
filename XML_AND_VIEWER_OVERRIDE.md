# XML Viewer and File Type Override Feature

## Features Added

### 1. XML Viewer Component ✅

**File:** `src/components/viewers/XmlViewer.tsx`

A sophisticated XML viewer with two display modes:

#### Tree View Mode
- **Collapsible tree structure** - Click to expand/collapse nodes
- **Syntax highlighting**:
  - Purple: Element tags
  - Cyan: Attribute names
  - Orange: Attribute values
  - Green: Text content
  - Gray: Comments
- **Shows attributes** inline with elements
- **Handles text content** appropriately
- **Path-based navigation** for deep XML structures

#### Formatted View Mode
- **Pretty-printed XML** with proper indentation
- **Monospace font** for readability
- **Preserves original structure**

#### Features
- ✅ Parse error detection and display
- ✅ Copy to clipboard
- ✅ Collapse all nodes button
- ✅ Handles malformed XML gracefully
- ✅ Supports comments and CDATA sections

**Supported XML Formats:**
- `.xml` - Standard XML
- `.svg` - Scalable Vector Graphics
- `.xsd` - XML Schema Definition
- `.xsl`, `.xslt` - XSL Transformations
- `.rss` - RSS feeds
- `.atom` - Atom feeds

### 2. File Type Override (Open As) Feature ✅

**File:** `src/components/viewers/PreviewFile.tsx`

Users can now override the default file viewer with a dropdown menu.

#### Available Viewers:
1. **Auto Detect** (default) - Uses file extension
2. **Plain Text** - View as plain text
3. **Code Editor** - Syntax-highlighted code
4. **Hex Viewer** - Binary hex dump
5. **JSON Viewer** - Structured JSON
6. **XML Viewer** - Structured XML with tree view
7. **CSV Viewer** - Tabular data
8. **Image Viewer** - Image display
9. **PDF Viewer** - PDF documents

#### UI Features:
- **Toolbar at top** - "Open as:" dropdown selector
- **Active selection highlighted** in blue
- **Reset button** - Returns to auto-detect mode
- **File name display** - Shows current file
- **Persistent across views** - Override stays active until reset

#### Use Cases:
- View JSON as plain text for copying
- Inspect binary files in hex
- Force XML parsing on non-.xml files
- View images as hex to check headers
- Override misdetected file types
- Analyze files with wrong extensions

### 3. Integration Changes

**Modified Files:**
- `src/components/viewers/PreviewFile.tsx:20-328`
  - Added `ViewerType` type
  - Added `viewerOverride` state
  - Added `showViewerMenu` state
  - Added toolbar with dropdown
  - Added `renderViewer()` function
  - Updated XML file detection

**Auto-Detection for XML:**
- `.xml`, `.svg`, `.xsd`, `.xsl`, `.xslt`, `.rss`, `.atom` files automatically use XML viewer
- XML files loaded as text (not binary)
- Falls back to code editor if XML parsing fails

## Usage Examples

### Viewing XML Files

```typescript
// Auto-detected by extension
file: config.xml → Opens in XML Viewer (tree view)
file: icon.svg → Opens in XML Viewer (tree view)

// User can switch to:
- Formatted view (pretty-printed)
- Text view (raw source)
- Hex view (binary inspection)
```

### Override Examples

```typescript
// JSON file with wrong extension
file: data.txt (contains JSON)
→ Select "JSON Viewer" from dropdown
→ Displays as structured JSON

// Binary file you want to inspect
file: document.pdf
→ Select "Hex Viewer" from dropdown
→ Shows binary contents

// XML in disguised format
file: config.conf (actually XML)
→ Select "XML Viewer" from dropdown
→ Parses and displays tree
```

### UI Flow

1. **Open file** - Default viewer loads based on extension
2. **Click dropdown** - "Open as:" menu appears
3. **Select viewer** - File re-renders in chosen viewer
4. **Click Reset** - Returns to auto-detected viewer

## Technical Details

### XML Parser
- Uses browser's native `DOMParser`
- Validates XML and shows parse errors
- Handles malformed XML gracefully
- Supports all standard XML node types

### Viewer Override
- State-based switching (React `useState`)
- No file reload needed (uses existing content)
- Dropdown dismisses on outside click
- Shows active selection visually

### Performance
- XML parsing is memoized (`useMemo`)
- Tree nodes track expansion state
- Formatted view cached until data changes
- No re-parsing on view mode switch

## Testing Checklist

### XML Viewer
- [x] Parse valid XML files
- [x] Show errors for invalid XML
- [x] Expand/collapse tree nodes
- [x] Display attributes correctly
- [x] Show text content
- [x] Handle comments
- [x] Switch between tree and formatted views
- [x] Copy to clipboard
- [x] Collapse all nodes

### File Override
- [x] Dropdown opens/closes
- [x] All viewer types available
- [x] Selection persists
- [x] Reset returns to auto-detect
- [x] Works with all file types
- [x] Error handling for incompatible viewers

## Known Limitations

1. **Large XML files** - May be slow to parse (browser limitation)
2. **SVG images** - Shows as XML tree, not rendered image
3. **Namespace prefixes** - Displayed but not resolved
4. **CDATA sections** - Supported but shown as-is
5. **Binary files** - Must be loaded first before hex viewing

## Future Enhancements

Potential improvements:
- [ ] XML schema validation
- [ ] XPath search
- [ ] XML beautification
- [ ] Namespace resolution
- [ ] SVG preview alongside XML
- [ ] Export formatted XML
- [ ] Syntax themes for XML
- [ ] Search within XML content
