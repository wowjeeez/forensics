# IntelliJ IDEA-Style Components

Professional Angular components and Material Design theming inspired by IntelliJ IDEA's Darcula theme for your forensic analysis project.

## 🎨 Features

- **Custom Components**: 6 IDEA-inspired standalone components
- **Material Theming**: Complete Angular Material theme matching IDEA's Darcula
- **Dark Theme**: Professional low-contrast color scheme
- **Monospace Typography**: JetBrains Mono font throughout
- **Fully Typed**: TypeScript interfaces for all components
- **Standalone**: Modern Angular standalone components
- **Responsive**: Works on all screen sizes

## Components

### 1. Toolbar Component
Top navigation bar with title and action buttons.

```typescript
import { ToolbarComponent, ToolbarAction } from './components';

actions: ToolbarAction[] = [
  { icon: '⚙', label: 'Settings', tooltip: 'Open Settings', action: () => {} }
];
```

```html
<app-toolbar [title]="'App Title'" [actions]="actions"></app-toolbar>
```

### 2. Sidebar Component
Vertical navigation bar with icons, labels, and badges.

```typescript
import { SidebarComponent, SidebarItem } from './components';

items: SidebarItem[] = [
  { id: 'project', icon: '📁', label: 'Project', badge: 3 }
];
```

```html
<app-sidebar
  [items]="items"
  [selectedId]="selectedId"
  (itemSelected)="onItemSelected($event)">
</app-sidebar>
```

### 3. Tab Panel Component
Editor-style tabs with close buttons and modified indicators.

```typescript
import { TabPanelComponent, Tab } from './components';

tabs: Tab[] = [
  { id: '1', title: 'file.ts', closable: true, modified: true }
];
```

```html
<app-tab-panel
  [tabs]="tabs"
  [activeTabId]="activeTabId"
  (tabSelected)="onTabSelected($event)"
  (tabClosed)="onTabClosed($event)">
</app-tab-panel>
```

### 4. Tool Window Component
Collapsible panel with header and content area.

```html
<app-tool-window
  [title]="'Project'"
  [collapsible]="true"
  [showSettings]="true">
  <!-- Your content here -->
</app-tool-window>
```

### 5. Tree View Component
Hierarchical file/folder tree structure.

```typescript
import { TreeViewComponent, TreeNode } from './components';

nodes: TreeNode[] = [
  {
    id: '1',
    label: 'folder',
    icon: '📁',
    expanded: true,
    children: [
      { id: '1-1', label: 'file.ts', icon: '📄' }
    ]
  }
];
```

```html
<app-tree-view
  [nodes]="nodes"
  (nodeSelected)="onNodeSelected($event)"
  (nodeExpanded)="onNodeExpanded($event)">
</app-tree-view>
```

### 6. Status Bar Component
Bottom bar with left and right status items.

```typescript
import { StatusBarComponent, StatusBarItem } from './components';

leftItems: StatusBarItem[] = [
  { id: 'branch', icon: '🌿', text: 'main', clickable: true, action: () => {} }
];
```

```html
<app-status-bar
  [leftItems]="leftItems"
  [rightItems]="rightItems">
</app-status-bar>
```

## Theme

The components use CSS variables defined in `src/app/styles/idea-theme.scss`. You can customize the theme by modifying these variables:

```scss
:root {
  --idea-editor-bg: #2b2b2b;
  --idea-accent: #4a9eff;
  --idea-text: #bbbbbb;
  // ... more variables
}
```

### Light Theme

To switch to light theme, add `data-theme="light"` to any container:

```html
<div data-theme="light">
  <!-- Components will use light theme -->
</div>
```

## Angular Material Theming

All Angular Material components have been themed to match the IDEA Darcula style:

### Themed Material Components

- ✅ Buttons (raised, text, outlined, icon)
- ✅ Form Fields (input, select, textarea)
- ✅ Checkboxes, Radio Buttons, Slide Toggles
- ✅ Sliders
- ✅ Cards
- ✅ Dialogs
- ✅ Menus & Lists
- ✅ Tabs
- ✅ Tables with Paginator
- ✅ Progress Bars & Spinners
- ✅ Expansion Panels
- ✅ Chips & Badges
- ✅ Tooltips
- ✅ Snackbars

### Material Theme Files

- `src/custom-theme.scss` - Material 3 theme definition with custom palettes
- `src/app/styles/material-overrides.scss` - Component-specific styling
- `src/app/styles/MATERIAL_THEMING.md` - Complete theming documentation

### Using Material Components

```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  imports: [MatButtonModule, MatCardModule]
})
```

```html
<mat-card>
  <mat-card-header>
    <mat-card-title>Evidence Analysis</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <button mat-raised-button color="primary">Analyze</button>
  </mat-card-content>
</mat-card>
```

## Demos

### Custom Components Demo
See `src/app/components/demo/demo.component.ts` for all custom IDEA components working together in a full IDE layout.

### Material Components Demo
See `src/app/components/material-demo/material-demo.component.ts` for all themed Material components.

## Quick Start

### 1. Use Custom Components

```typescript
import { ToolbarComponent, SidebarComponent } from './components';

@Component({
  imports: [ToolbarComponent, SidebarComponent]
})
export class MyComponent {
  toolbarActions = [
    { icon: '⚙', label: 'Settings', action: () => {} }
  ];
}
```

### 2. Use Material Components

```typescript
import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [MatButtonModule]
})
```

All Material components are automatically themed!

## Project Structure

```
src/
├── custom-theme.scss                    # Material theme definition
├── styles.css                           # Global styles
└── app/
    ├── components/
    │   ├── toolbar/                     # Custom toolbar
    │   ├── sidebar/                     # Custom sidebar
    │   ├── tab-panel/                   # Custom tabs
    │   ├── tool-window/                 # Custom panels
    │   ├── tree-view/                   # Custom tree
    │   ├── status-bar/                  # Custom status bar
    │   ├── demo/                        # Custom components demo
    │   ├── material-demo/               # Material components demo
    │   ├── index.ts                     # Component exports
    │   └── README.md                    # This file
    └── styles/
        ├── idea-theme.scss              # CSS variables
        ├── material-overrides.scss      # Material customizations
        └── MATERIAL_THEMING.md          # Material theme docs
```

## Color Palette

```scss
--idea-editor-bg: #2b2b2b          // Editor background
--idea-toolbar-bg: #3c3f41         // Toolbars, panels
--idea-hover-bg: #4c5052           // Hover state
--idea-selected-bg: #4e5254        // Selected items
--idea-accent: #4a9eff             // Primary blue
--idea-text: #bbbbbb               // Main text
--idea-text-secondary: #999999     // Secondary text
--idea-border: #2b2b2b             // Borders
--idea-success: #6a8759            // Success green
--idea-error: #ff6b68              // Error red
--idea-warning: #cc7832            // Warning orange
```

## Best Practices

1. **Mixing Components**: Custom and Material components work seamlessly together
2. **Consistency**: Use CSS variables for all colors
3. **Typography**: Monospace font for technical content
4. **Spacing**: Follow 4px/8px grid
5. **Accessibility**: All components maintain proper contrast
6. **Performance**: Standalone components with minimal overhead

## Usage in Your App

### Full IDE Layout

```typescript
import { DemoComponent } from './components/demo/demo.component';

@Component({
  imports: [DemoComponent]
})
```

### Individual Components

```typescript
import { ToolbarComponent, StatusBarComponent } from './components';

@Component({
  selector: 'app-root',
  imports: [ToolbarComponent, StatusBarComponent],
  template: `
    <app-toolbar [title]="'Forensic Tool'"></app-toolbar>
    <main>Your content</main>
    <app-status-bar></app-status-bar>
  `
})
```

### Material + Custom Mix

```typescript
import { MatButtonModule } from '@angular/material/button';
import { ToolWindowComponent } from './components';

@Component({
  imports: [MatButtonModule, ToolWindowComponent],
  template: `
    <app-tool-window [title]="'Actions'">
      <button mat-raised-button color="primary">Analyze</button>
    </app-tool-window>
  `
})
```
