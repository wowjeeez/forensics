export type PaneOrientation = 'horizontal' | 'vertical';

export interface PaneConfig {
  id: string;
  size: number; // percentage
  minSize?: number; // pixels
  maxSize?: number; // pixels
}

export interface SplitPaneConfig {
  orientation: PaneOrientation;
  panes: PaneConfig[];
}

export interface Tab {
  id: string;
  title: string;
  icon?: string;
  filePath?: string;
  viewerType: ViewerType;
  data?: any;
  isDirty?: boolean;
  isActive?: boolean;
}

export type ViewerType =
  | 'code-editor'
  | 'hex-viewer'
  | 'image-viewer'
  | 'pdf-viewer'
  | 'office-viewer'
  | 'json-viewer'
  | 'xml-viewer'
  | 'csv-viewer'
  | 'sqlite-viewer'
  | 'database-viewer'
  | 'welcome';

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modified?: Date;
  children?: FileTreeNode[];
  isExpanded?: boolean;
  isIndexed?: boolean;
  icon?: string;
}

export interface SearchFilter {
  fileTypes: string[];
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

export interface Group {
  id: string;
  name: string;
  color?: string;
  items: GroupItem[];
  created: Date;
  modified: Date;
}

export interface GroupItem {
  id: string;
  filePath: string;
  content?: string;
  metadata?: any;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  count: number;
}
