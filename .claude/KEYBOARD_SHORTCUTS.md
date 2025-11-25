# Detective - Keyboard Shortcuts

This document lists all keyboard shortcuts available in the Detective forensics analysis tool.

## Global Application Shortcuts

These shortcuts work throughout the application when the Detective window is focused.

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+F` (macOS) / `Ctrl+F` (Win/Linux) | Open Search | Opens search functionality in the active viewer |
| `Cmd+W` | Close Tab | Closes the currently active tab in the active pane |
| `Cmd+O` | Open Folder | Opens the folder selection dialog |
| `Cmd+\` | Split Vertically | Splits the current pane vertically |
| `Cmd+-` | Split Horizontally | Splits the current pane horizontally |
| `Cmd+1` through `Cmd+9` | Switch to Tab | Jumps to tab 1-8 in active pane, or last tab (Cmd+9) |
| `Ctrl+Tab` | Next Tab | Switches to the next tab in active pane (cycles) |
| `Ctrl+Shift+Tab` | Previous Tab | Switches to the previous tab in active pane (cycles) |

## Dialog & Modal Shortcuts

### Directory Scan Dialog
| Shortcut | Action |
|----------|--------|
| `Enter` | Confirm and continue with selected exclusions |
| `Escape` | Cancel scanning |

### Indexing Modal
| Shortcut | Action |
|----------|--------|
| `Enter` | Continue (when indexing is complete) |
| `Escape` | Close modal (when not actively indexing) |

## Viewer-Specific Shortcuts

### Code Editor (Text/Code Files)
The code editor uses CodeMirror's built-in search functionality:

| Shortcut | Action |
|----------|--------|
| `Cmd+F` | Open search panel |
| `Cmd+G` / `F3` | Find next |
| `Cmd+Shift+G` / `Shift+F3` | Find previous |
| `Cmd+Option+F` | Replace |
| `Escape` | Close search panel |

### JSON Viewer
| Shortcut | Action |
|----------|--------|
| `Cmd+F` | Toggle search bar |
| Type in search | Filter and highlight matches |

### Hex Viewer
| Shortcut | Action |
|----------|--------|
| `Cmd+F` | Toggle search bar |
| Toggle Text/Hex mode | Search in ASCII or hexadecimal |

### XML Viewer
| Shortcut | Action |
|----------|--------|
| `Cmd+F` | Toggle search bar |
| Search in formatted view | Highlights matching lines |

### CSV Viewer
| Shortcut | Action |
|----------|--------|
| `Cmd+F` | Focus search/filter input |
| Type to filter | Filters rows in real-time |

### SQLite Viewer
| Shortcut | Action |
|----------|--------|
| `Cmd+F` | Focus table search |
| Type to search | Filters table list |

## Split View & Panes

Detective supports IntelliJ-style split views, allowing you to view multiple files side-by-side.

### Creating Splits
- `Cmd+\` - Split vertically (left/right)
- `Cmd+-` - Split horizontally (top/bottom)
- Click the split icons in the tab bar
- Maximum 4 panes at once

### Dragging Tabs Between Panes
- Click and hold the grip icon (⋮⋮) on any tab
- Drag to another pane
- Drop to move the tab
- Tab will open in target pane

### Pane Management
- Click anywhere in a pane to make it active
- Active pane has a blue border
- Keyboard shortcuts affect the active pane
- Click X button to close a pane (min 1 pane)

### Use Cases
- **Compare files**: Open two JSON files side-by-side
- **Multi-task**: View logs while analyzing database
- **Reference**: Keep documentation open while coding
- **Diff view**: Compare hex dumps or text files

## Navigation Best Practices

### Tab Management
- Use `Cmd+1` through `Cmd+9` for direct access to tabs **in active pane**
- `Cmd+9` always jumps to the last tab in the active pane
- Use `Ctrl+Tab` / `Ctrl+Shift+Tab` for sequential navigation in active pane
- Close tabs with `Cmd+W`
- Drag tabs between panes for flexible layouts

### Search Workflow
1. Open a file in any viewer
2. Press `Cmd+F` to activate search
3. Search interface adapts to the file type:
   - Text files: Full CodeMirror search with regex
   - JSON: Tree filtering and highlighting
   - Hex: ASCII or hex byte search
   - CSV: Row filtering
   - SQLite: Table name filtering

### Dialog Navigation
- `Enter` to confirm/continue in most dialogs
- `Escape` to cancel or close
- Dialogs block other shortcuts while open

## Platform Differences

### macOS
- Uses `Cmd` (⌘) for primary shortcuts
- `Cmd+W`, `Cmd+F`, `Cmd+O`, etc.

### Windows/Linux
- Uses `Ctrl` for primary shortcuts in search
- `Meta` key (Windows key) for app-level shortcuts
- Tab navigation uses `Ctrl+Tab`

## Accessibility Notes

- All shortcuts are window-focused only - they don't trap system-wide keys
- When Detective loses focus, shortcuts don't interfere with other applications
- Tab order follows logical UI flow
- Search inputs auto-focus when opened
- Keyboard navigation works in file tree and lists

## Implementation Details

Keyboard shortcuts are implemented using:
- **Frontend**: React hooks with DOM event listeners (`useKeyboardShortcuts`)
- **No OS-level trapping**: All shortcuts use standard web events
- **Focus-aware**: Automatically disabled when window loses focus
- **Declarative**: Easy to add new shortcuts in configuration

## Adding Custom Shortcuts

Developers can add new shortcuts by modifying `src/App.tsx`:

```typescript
useKeyboardShortcuts([
  {
    key: 'k',
    meta: true,
    action: () => {
      // Your custom action
    },
  },
])
```

See `src/hooks/useKeyboardShortcuts.ts` for implementation details.
