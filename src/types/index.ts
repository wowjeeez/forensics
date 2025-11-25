export interface FileTab {
  id: string;
  name: string;
  path: string;
  type: FileType;
  content?: any;
  modified?: boolean;
}

export enum FileType {
  TEXT = 'text',
  HEX = 'hex',
  IMAGE = 'image',
  JSON = 'json',
  CSV = 'csv',
  DATABASE = 'database',
  UNKNOWN = 'unknown',
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modified?: Date;
}

export interface SearchResult {
  path: string;
  line: number;
  column: number;
  content: string;
  match: string;
}

export interface AnalysisGroup {
  id: string;
  name: string;
  items: string[];
  color: string;
}

// Backend types (matching Rust structures)
export interface FileInfo {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink' | 'unknown';
  size?: number;
  modified?: string; // ISO date string
  created?: string;
  accessed?: string;
  permissions?: FilePermissions;
  children?: FileInfo[];
}

export interface FilePermissions {
  readonly: boolean;
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
}

export interface FileMetadata {
  path: string;
  size: number;
  modified: string;
  created?: string;
  accessed?: string;
  isFile: boolean;
  isDir: boolean;
  isSymlink: boolean;
  permissions: FilePermissions;
  mimeType?: string;
  extension?: string;
}

export interface FileHash {
  path: string;
  md5: string;
  sha256: string;
}

export interface SearchOptions {
  pattern: string;
  caseSensitive: boolean;
  regex: boolean;
  includeHidden: boolean;
  fileExtensions?: string[];
  maxDepth?: number;
  maxResults?: number;
}

export interface DirectoryScanOptions {
  maxDepth?: number;
  includeHidden: boolean;
  followSymlinks: boolean;
  parallel: boolean;
}

// Database types
export interface ProjectMetadata {
  evidencePath: string;
  createdAt: string;
  lastOpened: string;
  fileCount: number;
  totalSize: number;
  indexed: boolean;
}

export interface FileRecord {
  path: string;
  size: number;
  modified: string;
  created?: string;
  md5?: string;
  sha256?: string;
  mimeType?: string;
  indexed: boolean;
  notes?: string;
  tags: string[];
}

export interface IndexStats {
  totalFiles: number;
  totalSize: number;
  indexedFiles: number;
  durationMs: number;
}

export interface DatabaseStats {
  dbPath: string;
  casePath: string;
  sizeOnDisk: number;
  fileCount: number;
  indexed: boolean;
}
