import { invoke } from '@tauri-apps/api/core';
import type {
    FileInfo,
    FileMetadata,
    FileHash,
    SearchOptions,
    SearchResult,
    DirectoryScanOptions,
    ProjectMetadata,
    FileRecord,
    IndexStats,
    DatabaseStats, AnalysisGroup,
} from '../types';

/**
 * Tauri API bindings for file system operations
 */

export async function readFile(path: string): Promise<Uint8Array> {
  return await invoke<number[]>('read_file', { path }).then(arr => new Uint8Array(arr));
}

export async function readFileAsString(path: string): Promise<string> {
  return await invoke<string>('read_file_as_string', { path });
}

export async function writeFile(path: string, data: Uint8Array): Promise<void> {
  await invoke('write_file', { path, data: Array.from(data) });
}

export async function exists(path: string): Promise<boolean> {
  return await invoke<boolean>('exists', { path });
}

export async function isFile(path: string): Promise<boolean> {
  return await invoke<boolean>('is_file', { path });
}

export async function isDir(path: string): Promise<boolean> {
  return await invoke<boolean>('is_dir', { path });
}

export async function getMetadata(path: string): Promise<FileMetadata> {
  return await invoke<FileMetadata>('get_metadata', { path });
}

export async function listDirectory(path: string): Promise<FileInfo[]> {
  return await invoke<FileInfo[]>('list_directory', { path });
}

export async function scanDirectory(
  path: string,
  options: DirectoryScanOptions
): Promise<FileInfo> {
  return await invoke<FileInfo>('scan_directory', { path, options });
}

export async function deleteFile(path: string): Promise<void> {
  await invoke('delete_file', { path });
}

export async function deleteDirectory(path: string): Promise<void> {
  await invoke('delete_directory', { path });
}

export async function createDirectory(path: string): Promise<void> {
  await invoke('create_directory', { path });
}

export async function copyFile(from: string, to: string): Promise<void> {
  await invoke('copy_file', { from, to });
}

export async function movePath(from: string, to: string): Promise<void> {
  await invoke('move_path', { from, to });
}

export async function calculateHash(path: string): Promise<FileHash> {
  return await invoke<FileHash>('calculate_hash', { path });
}

export async function createGroup(name: string, color: string) {
    return await invoke<void>("create_group", {name, color})
}



export async function deleteGroup(name: string, color: string) {
    return await invoke<void>("delete_group", {name, color})
}

export async function getGroups(): Promise<AnalysisGroup[]> {
    return await invoke<AnalysisGroup[]>('get_groups')
}



export async function searchFiles(
  basePath: string,
  options: SearchOptions
): Promise<string[]> {
  return await invoke<string[]>('search_files', { basePath, options });
}

export async function searchContent(
  basePath: string,
  options: SearchOptions
): Promise<SearchResult[]> {
  return await invoke<SearchResult[]>('search_content', { basePath, options });
}

export async function readFileChunked(
  path: string,
  chunkSize: number
): Promise<Uint8Array[]> {
  const chunks = await invoke<number[][]>('read_file_chunked', { path, chunkSize });
  return chunks.map(chunk => new Uint8Array(chunk));
}

export async function getFileSize(path: string): Promise<number> {
  return await invoke<number>('get_file_size', { path });
}

/**
 * Database API bindings
 */

export async function createProjectDatabase(evidencePath: string): Promise<string> {
  return await invoke<string>('create_project_database', { evidencePath });
}

export async function getProjectMetadata(): Promise<ProjectMetadata | null> {
  return await invoke<ProjectMetadata | null>('get_project_metadata');
}

export async function indexDirectory(fileTree: FileInfo): Promise<IndexStats> {
  return await invoke<IndexStats>('index_directory', { fileTree });
}

export async function searchDatabase(query: string): Promise<Array<[string, string]>> {
  return await invoke<Array<[string, string]>>('search_database', { query });
}

export async function getFileRecord(filePath: string): Promise<FileRecord | null> {
  return await invoke<FileRecord | null>('get_file_record', { filePath });
}

export async function storeFileNote(filePath: string, note: string): Promise<void> {
  await invoke('store_file_note', { filePath, note });
}

export async function addFileTag(filePath: string, tag: string): Promise<void> {
  await invoke('add_file_tag', { filePath, tag });
}

export async function getAllTags(): Promise<string[]> {
  return await invoke<string[]>('get_all_tags');
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  return await invoke<DatabaseStats>('get_database_stats');
}
