import {
  FileText,
  FileCode,
  Database,
  File,
  FileArchive,
  FileSpreadsheet,
  FileImage,
  Binary,
  FileKey,
  Folder,
  FolderOpen,
  FileType2,
  Braces,
  Table,
  Code2,
  Music,
  Film,
  Layout,
  Package,
  type LucideIcon,
} from 'lucide-react';

export interface FileIconInfo {
  icon: LucideIcon;
  color: string;
  category: string;
}

const iconMap: Record<string, FileIconInfo> = {
  // Programming Languages
  js: { icon: FileCode, color: 'text-yellow-400', category: 'code' },
  jsx: { icon: FileCode, color: 'text-yellow-400', category: 'code' },
  ts: { icon: FileCode, color: 'text-blue-400', category: 'code' },
  tsx: { icon: FileCode, color: 'text-blue-400', category: 'code' },
  py: { icon: FileCode, color: 'text-green-400', category: 'code' },
  java: { icon: FileCode, color: 'text-red-400', category: 'code' },
  cpp: { icon: FileCode, color: 'text-blue-300', category: 'code' },
  c: { icon: FileCode, color: 'text-blue-300', category: 'code' },
  h: { icon: FileCode, color: 'text-blue-300', category: 'code' },
  hpp: { icon: FileCode, color: 'text-blue-300', category: 'code' },
  cs: { icon: FileCode, color: 'text-purple-400', category: 'code' },
  rs: { icon: FileCode, color: 'text-orange-400', category: 'code' },
  go: { icon: FileCode, color: 'text-cyan-400', category: 'code' },
  rb: { icon: FileCode, color: 'text-red-400', category: 'code' },
  php: { icon: FileCode, color: 'text-purple-300', category: 'code' },
  swift: { icon: FileCode, color: 'text-orange-400', category: 'code' },
  kt: { icon: FileCode, color: 'text-purple-400', category: 'code' },
  scala: { icon: FileCode, color: 'text-red-400', category: 'code' },

  // Web
  html: { icon: Code2, color: 'text-orange-400', category: 'web' },
  htm: { icon: Code2, color: 'text-orange-400', category: 'web' },
  css: { icon: Code2, color: 'text-blue-400', category: 'web' },
  scss: { icon: Code2, color: 'text-pink-400', category: 'web' },
  sass: { icon: Code2, color: 'text-pink-400', category: 'web' },
  less: { icon: Code2, color: 'text-blue-300', category: 'web' },

  // Data Formats
  json: { icon: Braces, color: 'text-yellow-400', category: 'data' },
  jsonb: { icon: Braces, color: 'text-yellow-400', category: 'data' },
  json5: { icon: Braces, color: 'text-yellow-400', category: 'data' },
  xml: { icon: FileType2, color: 'text-orange-400', category: 'data' },
  yaml: { icon: FileType2, color: 'text-red-400', category: 'data' },
  yml: { icon: FileType2, color: 'text-red-400', category: 'data' },
  toml: { icon: FileType2, color: 'text-orange-300', category: 'data' },
  csv: { icon: Table, color: 'text-green-400', category: 'data' },
  tsv: { icon: Table, color: 'text-green-400', category: 'data' },

  // Documents
  txt: { icon: FileText, color: 'text-gray-400', category: 'document' },
  md: { icon: FileText, color: 'text-blue-400', category: 'document' },
  markdown: { icon: FileText, color: 'text-blue-400', category: 'document' },
  pdf: { icon: FileText, color: 'text-red-400', category: 'document' },
  doc: { icon: FileText, color: 'text-blue-500', category: 'document' },
  docx: { icon: FileText, color: 'text-blue-500', category: 'document' },
  odt: { icon: FileText, color: 'text-blue-400', category: 'document' },
  rtf: { icon: FileText, color: 'text-blue-400', category: 'document' },

  // Spreadsheets
  xls: { icon: FileSpreadsheet, color: 'text-green-500', category: 'spreadsheet' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-500', category: 'spreadsheet' },
  ods: { icon: FileSpreadsheet, color: 'text-green-400', category: 'spreadsheet' },

  // Presentations
  ppt: { icon: Layout, color: 'text-orange-500', category: 'presentation' },
  pptx: { icon: Layout, color: 'text-orange-500', category: 'presentation' },
  odp: { icon: Layout, color: 'text-orange-400', category: 'presentation' },

  // Databases
  db: { icon: Database, color: 'text-purple-400', category: 'database' },
  sqlite: { icon: Database, color: 'text-purple-400', category: 'database' },
  sqlite3: { icon: Database, color: 'text-purple-400', category: 'database' },
  sql: { icon: Database, color: 'text-orange-400', category: 'database' },
  ldb: { icon: Database, color: 'text-cyan-400', category: 'database' },
  leveldb: { icon: Database, color: 'text-cyan-400', category: 'database' },

  // Images
  png: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  jpg: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  jpeg: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  gif: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  svg: { icon: FileImage, color: 'text-orange-400', category: 'image' },
  webp: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  bmp: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  ico: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  tiff: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  tif: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  heic: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  heif: { icon: FileImage, color: 'text-purple-400', category: 'image' },
  avif: { icon: FileImage, color: 'text-purple-400', category: 'image' },

  // Video
  mp4: { icon: Film, color: 'text-pink-400', category: 'video' },
  mkv: { icon: Film, color: 'text-pink-400', category: 'video' },
  avi: { icon: Film, color: 'text-pink-400', category: 'video' },
  mov: { icon: Film, color: 'text-pink-400', category: 'video' },
  wmv: { icon: Film, color: 'text-pink-400', category: 'video' },
  flv: { icon: Film, color: 'text-pink-400', category: 'video' },
  webm: { icon: Film, color: 'text-pink-400', category: 'video' },
  m4v: { icon: Film, color: 'text-pink-400', category: 'video' },

  // Audio
  mp3: { icon: Music, color: 'text-green-400', category: 'audio' },
  wav: { icon: Music, color: 'text-green-400', category: 'audio' },
  flac: { icon: Music, color: 'text-green-400', category: 'audio' },
  aac: { icon: Music, color: 'text-green-400', category: 'audio' },
  ogg: { icon: Music, color: 'text-green-400', category: 'audio' },
  m4a: { icon: Music, color: 'text-green-400', category: 'audio' },
  wma: { icon: Music, color: 'text-green-400', category: 'audio' },

  // Archives
  zip: { icon: FileArchive, color: 'text-yellow-400', category: 'archive' },
  rar: { icon: FileArchive, color: 'text-yellow-400', category: 'archive' },
  '7z': { icon: FileArchive, color: 'text-yellow-400', category: 'archive' },
  tar: { icon: FileArchive, color: 'text-yellow-400', category: 'archive' },
  gz: { icon: FileArchive, color: 'text-yellow-400', category: 'archive' },
  bz2: { icon: FileArchive, color: 'text-yellow-400', category: 'archive' },
  xz: { icon: FileArchive, color: 'text-yellow-400', category: 'archive' },
  tgz: { icon: FileArchive, color: 'text-yellow-400', category: 'archive' },
  tbz2: { icon: FileArchive, color: 'text-yellow-400', category: 'archive' },

  // Binaries
  exe: { icon: Binary, color: 'text-red-400', category: 'binary' },
  dll: { icon: Binary, color: 'text-red-400', category: 'binary' },
  so: { icon: Binary, color: 'text-red-400', category: 'binary' },
  dylib: { icon: Binary, color: 'text-red-400', category: 'binary' },
  bin: { icon: Binary, color: 'text-red-400', category: 'binary' },

  // Config
  ini: { icon: FileType2, color: 'text-gray-400', category: 'config' },
  conf: { icon: FileType2, color: 'text-gray-400', category: 'config' },
  config: { icon: FileType2, color: 'text-gray-400', category: 'config' },
  env: { icon: FileKey, color: 'text-yellow-400', category: 'config' },

  // Logs
  log: { icon: FileText, color: 'text-gray-500', category: 'log' },

  // Package managers
  'package.json': { icon: Package, color: 'text-green-400', category: 'package' },
  'package-lock.json': { icon: Package, color: 'text-green-400', category: 'package' },
  'yarn.lock': { icon: Package, color: 'text-blue-400', category: 'package' },
  'pnpm-lock.yaml': { icon: Package, color: 'text-orange-400', category: 'package' },
  'Cargo.toml': { icon: Package, color: 'text-orange-400', category: 'package' },
  'Cargo.lock': { icon: Package, color: 'text-orange-400', category: 'package' },
  'go.mod': { icon: Package, color: 'text-cyan-400', category: 'package' },
  'go.sum': { icon: Package, color: 'text-cyan-400', category: 'package' },
};

const defaultIcon: FileIconInfo = {
  icon: File,
  color: 'text-gray-400',
  category: 'unknown',
};

export function getFileIcon(fileName: string, isDirectory: boolean = false, isOpen: boolean = false): FileIconInfo {
  if (isDirectory) {
    return {
      icon: isOpen ? FolderOpen : Folder,
      color: 'text-ide-blue',
      category: 'directory',
    };
  }

  // Check for exact filename matches first
  const lowerFileName = fileName.toLowerCase();
  if (iconMap[lowerFileName]) {
    return iconMap[lowerFileName];
  }

  // Then check extensions
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return iconMap[ext] || defaultIcon;
}

export function getFileIconByExtension(extension: string): FileIconInfo {
  const ext = extension.toLowerCase().replace(/^\./, '');
  return iconMap[ext] || defaultIcon;
}

export function getFileCategory(fileName: string): string {
  const info = getFileIcon(fileName, false);
  return info.category;
}
