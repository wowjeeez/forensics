import { useEffect, useState } from 'react';
import { Database, File, FolderTree, Info, HardDrive } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface LevelDbViewerProps {
  path: string;
}

interface LevelDbInfo {
  keyCount: number;
  approximateSize: number;
  files: string[];
}

export function LevelDbViewer({ path }: LevelDbViewerProps) {
  const [dbInfo, setDbInfo] = useState<LevelDbInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabaseInfo();
  }, [path]);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await invoke<LevelDbInfo>('query_leveldb_info', {
        dbPath: path,
      });
      setDbInfo(info);
    } catch (err) {
      console.error('Error loading LevelDB:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileTypeInfo = (filename: string) => {
    if (filename === 'CURRENT') {
      return {
        description: 'Points to the current MANIFEST file',
        color: 'text-green-400',
      };
    }
    if (filename.startsWith('MANIFEST')) {
      return {
        description: 'Database manifest - tracks all database files',
        color: 'text-blue-400',
      };
    }
    if (filename === 'LOCK') {
      return {
        description: 'Lock file to prevent concurrent access',
        color: 'text-yellow-400',
      };
    }
    if (filename.endsWith('.log')) {
      return {
        description: 'Write-ahead log - recent uncommitted changes',
        color: 'text-purple-400',
      };
    }
    if (filename.endsWith('.ldb') || filename.endsWith('.sst')) {
      return {
        description: 'Sorted String Table - contains key-value data',
        color: 'text-cyan-400',
      };
    }
    if (filename === 'LOG' || filename.startsWith('LOG.old')) {
      return {
        description: 'LevelDB operation log',
        color: 'text-gray-400',
      };
    }
    return {
      description: 'Database file',
      color: 'text-gray-400',
    };
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg">
        <div className="text-gray-400">Loading LevelDB...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg">
        <div className="text-center">
          <p className="text-ide-red mb-2">Error loading database</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!dbInfo) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg">
        <div className="text-gray-400">No database loaded</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-editor-bg">
      {/* Header */}
      <div className="p-6 border-b border-editor-border">
        <div className="flex items-start gap-4">
          <div className="text-cyan-400">
            <Database className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-200 mb-2">
              LevelDB Directory
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Key-value storage database used by Chrome, Electron apps, and other applications
            </p>
            <div className="text-xs text-gray-500">
              <strong>Path:</strong> {path}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b border-editor-border bg-editor-toolbar">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-editor-bg rounded-lg border border-editor-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-500">Estimated Keys</span>
            </div>
            <div className="text-2xl font-semibold text-gray-200">
              ~{dbInfo.keyCount.toLocaleString()}
            </div>
          </div>

          <div className="bg-editor-bg rounded-lg border border-editor-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-500">Database Size</span>
            </div>
            <div className="text-2xl font-semibold text-gray-200">
              {formatFileSize(dbInfo.approximateSize)}
            </div>
          </div>

          <div className="bg-editor-bg rounded-lg border border-editor-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <File className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-500">Files</span>
            </div>
            <div className="text-2xl font-semibold text-gray-200">
              {dbInfo.files.length}
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            <File className="w-4 h-4" />
            Database Files
          </h3>

          <div className="space-y-2">
            {dbInfo.files.map((filename, idx) => {
              const fileInfo = getFileTypeInfo(filename);
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-editor-toolbar rounded border border-editor-border hover:bg-editor-selection transition-colors"
                >
                  <File className={`w-4 h-4 flex-shrink-0 mt-0.5 ${fileInfo.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 font-mono break-all">
                      {filename}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {fileInfo.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Information Panel */}
          <div className="mt-6 bg-editor-toolbar rounded-lg border border-editor-border p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              About LevelDB
            </h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>
                LevelDB is a key-value storage library that provides an ordered mapping
                from string keys to string values.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Common use cases:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-500 ml-2">
                <li>Chrome/Chromium browser data (cookies, cache, etc.)</li>
                <li>Electron application storage</li>
                <li>IndexedDB backend storage</li>
                <li>Application configuration and state</li>
              </ul>
              <div className="mt-4 p-3 bg-ide-yellow bg-opacity-10 border border-ide-yellow border-opacity-30 rounded">
                <p className="text-xs text-gray-400">
                  <strong className="text-ide-yellow">Note:</strong> This is a binary database
                  format. To extract and view the actual key-value pairs, you would need
                  specialized tools or libraries that can parse the LevelDB format.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
