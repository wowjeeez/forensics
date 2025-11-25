# Detective Split View Guide

## Overview

Detective features an advanced split-view system inspired by IntelliJ IDEA, allowing forensics analysts to view and compare multiple files simultaneously with intuitive drag-and-drop mechanics.

## Key Features

### 🎯 Automatic Split-on-Drag
- Drag tabs to screen edges to automatically create new splits
- Visual drop zones show exactly where your tab will land
- Smart detection of user intent (edge split vs. pane merge)

### 🎨 Visual Feedback
- **Drop Zone Overlays**: Translucent blue zones show split destinations
- **Tab Highlighting**: Dragged tabs scale up and glow on hover
- **Custom Drag Preview**: Tilted ghost element follows your cursor
- **Active Pane Indicator**: Blue border shows which pane has focus

### ⚡ Smooth Animations
- Fluid transitions for all drag operations
- Scale and shadow effects on hover
- Smooth pane appearance/disappearance

## How to Use

### Creating Splits

#### Method 1: Drag to Edge (Automatic Split)
```
1. Click and hold a tab
2. Drag toward edge of pane:
   - Left edge → Split vertically (new pane on left)
   - Right edge → Split vertically (new pane on right)
   - Top edge → Split horizontally (new pane on top)
   - Bottom edge → Split horizontally (new pane on bottom)
3. Release when you see the drop zone overlay
4. Tab opens in new pane automatically
```

#### Method 2: Keyboard Shortcuts
- `Cmd+\` - Split vertically
- `Cmd+-` - Split horizontally

#### Method 3: UI Buttons
- Click split icons (⧉ or ⧉) in tab bar
- Creates empty pane for new files

### Moving Tabs Between Panes

#### Drag to Center
```
1. Drag tab over center of target pane
2. See "Add to this pane" overlay
3. Release to move tab
4. Tab joins existing pane
```

#### Drag to Reorder
```
1. Drag tab over another tab
2. Tab scales up with glow effect
3. Release to reorder tabs
```

### Closing Panes
- Click X button on pane (right side of tab bar)
- All tabs in pane are moved to remaining pane
- Minimum 1 pane always remains

## Drop Zone Detection

The system uses intelligent edge detection:

```
┌─────────────────────────────┐
│  TOP (25%)                  │
├────┬────────────────────┬───┤
│ L  │                    │ R │
│ E  │    CENTER (40%)    │ I │
│ F  │                    │ G │
│ T  │                    │ H │
│    │                    │ T │
│(25%)                  (25%)│
├────┴────────────────────┴───┤
│  BOTTOM (25%)               │
└─────────────────────────────┘
```

- **Edge Zones (25%)**: Trigger automatic split
- **Center Zone (40%)**: Merge with existing pane
- **Dynamic Detection**: Closest edge wins if ambiguous

## Visual Indicators

### Drop Zone Overlays

| Zone | Color | Message | Action |
|------|-------|---------|--------|
| Left/Right | Blue 30% | "Split left/right" | Creates vertical split |
| Top/Bottom | Blue 30% | "Split top/bottom" | Creates horizontal split |
| Center | Blue 30% | "Add to this pane" | Merges into pane |

### Tab States

| State | Visual | Cursor |
|-------|--------|--------|
| Normal | Gray text | Pointer |
| Active | White text, dark bg | Pointer |
| Hover | Lighter bg | Pointer |
| Drag Over | Blue bg, scale 105%, shadow | Move |
| Dragging | 80% opacity, rotated 2° | Grabbing |

### Pane States

| State | Border | Background |
|-------|--------|------------|
| Inactive | Gray 1px | Default |
| Active | Blue 2px | Default |
| Drop Target | Blue overlay | Highlighted |

## Use Cases

### 1. File Comparison
```
Scenario: Compare two JSON configurations
Steps:
  1. Open config-old.json
  2. Drag tab to right edge
  3. Automatic vertical split created
  4. Open config-new.json in left pane
  5. Compare side-by-side
```

### 2. Multi-Source Analysis
```
Scenario: Analyze logs while viewing database
Steps:
  1. Open application.log
  2. Cmd+\ to split vertically
  3. Open database.sqlite in new pane
  4. Cmd+- to split new pane horizontally
  5. Open user-activity.csv in bottom pane
  6. Three files visible simultaneously
```

### 3. Reference + Work
```
Scenario: Keep API docs open while coding
Steps:
  1. Open api-reference.md
  2. Open source-code.js
  3. Drag api-reference to left edge
  4. Reference stays visible while working
```

### 4. Hex Dump Comparison
```
Scenario: Compare binary files
Steps:
  1. Open file1.bin (hex view)
  2. Drag to left edge
  3. Open file2.bin in right pane (hex view)
  4. Scroll both to compare bytes
```

## Advanced Techniques

### Quick Split Pattern
```
Workflow: Open 4 files in quadrant layout
1. Open file1.txt
2. Cmd+\ (split vertical)
3. Open file2.txt in right
4. Click left pane
5. Cmd+- (split horizontal)
6. Open file3.txt in bottom-left
7. Click right pane
8. Cmd+- (split horizontal)
9. Open file4.txt in bottom-right
Result: 4-pane grid layout
```

### Drag-Based Layout
```
Workflow: Natural quadrant creation via drag
1. Open file1.txt
2. Drag to right edge → vertical split
3. Drag file1 to bottom of right pane → horizontal split right
4. Drag file1 to bottom of left pane → horizontal split left
Result: 4-pane grid (more intuitive!)
```

### Pane Consolidation
```
Workflow: Merge split panes
1. Have 3 panes open with various tabs
2. Drag all tabs from pane A to center of pane B
3. Close pane A with X button
4. All tabs now in pane B
```

## Keyboard Shortcuts

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Cmd+\` | Split vertically | Current pane |
| `Cmd+-` | Split horizontally | Current pane |
| `Cmd+W` | Close tab | Active pane |
| `Cmd+1-9` | Jump to tab N | Active pane |
| `Ctrl+Tab` | Next tab | Active pane |
| `Ctrl+Shift+Tab` | Previous tab | Active pane |

## Limitations

- **Maximum Panes**: 4 panes total
- **No Nested Splits**: One level of splitting only
- **No Resize**: Panes are equal-sized (50/50 split)
- **No Persistence**: Layout resets on restart

## Tips & Tricks

### Tip 1: Preview Before Drop
Hold tab over edge for 1 second to see exactly where it will land before releasing.

### Tip 2: Quick Undo
If you accidentally create a split, immediately close the new pane with X button.

### Tip 3: Single-File Focus
Close all but one pane to return to single-file mode.

### Tip 4: Drag from File Tree
Drag files directly from file tree to drop zones for instant split + open.

### Tip 5: Visual Cues
- Blue border = active pane (receives keyboard input)
- Blue overlay = valid drop zone
- Tab glow = valid drop target

## Troubleshooting

### Tab Won't Split
- **Cause**: Already at 4 pane limit
- **Solution**: Close a pane first

### Tab Goes to Wrong Pane
- **Cause**: Dragged to center instead of edge
- **Solution**: Aim for outer 25% of pane area

### Lost Tab After Drag
- **Cause**: Tab was in pane that closed
- **Solution**: Check all panes, tab moved to another pane

### Can't Activate Pane
- **Cause**: Clicked on tab bar, not content area
- **Solution**: Click in content area or on a tab

## Performance Notes

- Smooth 60fps animations
- Minimal re-renders (optimized React)
- No performance impact with 4 panes
- Tested with 50+ tabs across panes

## Accessibility

- Full keyboard navigation support
- Clear visual feedback for all states
- Screen reader compatible (drag states announced)
- High contrast drop zone indicators

## Future Enhancements

Planned features:
- Resizable pane dividers
- Layout presets (save/load)
- Nested splits (unlimited depth)
- Layout persistence
- Drag to create new split automatically
- Tab groups within panes
- Synchronized scrolling option

---

**Happy Analyzing! 🔍**
