/**
 * Utility functions for handling file paths across different platforms
 */

/**
 * Normalizes a file path for use with Tauri commands
 * Handles Windows paths, UNC paths, and paths with spaces
 */
export function normalizePath(path: string): string {
  // Remove file:// protocol if present
  let normalized = path.replace(/^file:\/\//, '');

  // On Windows, handle special cases
  if (navigator.platform.toLowerCase().includes('win')) {
    // Remove leading slash from Windows paths (e.g., /C:/Users -> C:/Users)
    normalized = normalized.replace(/^\/([A-Za-z]:)/, '$1');

    // Convert forward slashes to backslashes for Windows
    normalized = normalized.replace(/\//g, '\\');
  }

  // Decode URI components (handles %20 for spaces, etc.)
  try {
    normalized = decodeURIComponent(normalized);
  } catch (e) {
    // If decoding fails, use the path as-is
    console.warn('Failed to decode path:', normalized, e);
  }

  return normalized;
}

/**
 * Converts a file system path to a URL that can be used with convertFileSrc
 * Ensures proper escaping for spaces and special characters
 */
export function pathToFileUrl(path: string): string {
  // Normalize the path first
  let normalized = normalizePath(path);
  console.log(normalized)

  // On Windows, convert backslashes to forward slashes for URLs
  if (navigator.platform.toLowerCase().includes('win')) {
    normalized = normalized.replace(/\\/g, '/');
    // Ensure drive letter format (C:/ not C:\)
    normalized = normalized.replace(/^([A-Za-z]):/, '/$1:');
  }

  // Encode special characters but keep path separators
  const parts = normalized.split('/');
  const encoded = parts.map(part => encodeURIComponent(part)).join('/');
  parts.shift()
  console.log(parts, encoded)
  return encoded;
}

/**
 * Checks if a path appears to be a Windows path
 */
export function isWindowsPath(path: string): boolean {
  return /^[A-Za-z]:[\\\/]/.test(path) || path.startsWith('\\\\');
}

/**
 * Extracts the filename from a path
 */
export function getFileName(path: string): string {
  const normalized = normalizePath(path);
  const separator = navigator.platform.toLowerCase().includes('win') ? '\\' : '/';
  const parts = normalized.split(separator);
  return parts[parts.length - 1] || '';
}

/**
 * Gets the file extension from a path
 */
export function getFileExtension(path: string): string {
  const fileName = getFileName(path);
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
}
