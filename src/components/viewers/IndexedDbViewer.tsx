import { useEffect, useState } from 'react';
import { Database, Folder, Chrome, Info, Layers } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface IndexedDbViewerProps {
  path: string;
}

interface IndexedDbInfo {
  databases: string[];
  totalKeys: number;
  subdirectories: string[];
}

export function IndexedDbViewer({ path }: IndexedDbViewerProps) {
  const [dbInfo, setDbInfo] = useState<IndexedDbInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabaseInfo();
  }, [path]);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await invoke<IndexedDbInfo>('query_indexeddb_info', {
        dbPath: path,
      });
      setDbInfo(info);
    } catch (err) {
      console.error('Error loading IndexedDB:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg">
        <div className="text-gray-400">Loading IndexedDB...</div>
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
          <div className="text-blue-400">
            <Chrome className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-200 mb-2">
              IndexedDB Directory
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Browser database for storing large amounts of structured data from web applications
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
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-500">Databases Found</span>
            </div>
            <div className="text-2xl font-semibold text-gray-200">
              {dbInfo.databases.length}
            </div>
          </div>

          <div className="bg-editor-bg rounded-lg border border-editor-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-500">Estimated Records</span>
            </div>
            <div className="text-2xl font-semibold text-gray-200">
              ~{dbInfo.totalKeys.toLocaleString()}
            </div>
          </div>

          <div className="bg-editor-bg rounded-lg border border-editor-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-500">Subdirectories</span>
            </div>
            <div className="text-2xl font-semibold text-gray-200">
              {dbInfo.subdirectories.length}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Databases */}
          {dbInfo.databases.length > 0 && (
            <div className="bg-editor-toolbar rounded-lg border border-editor-border p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                IndexedDB Databases
              </h3>
              <div className="space-y-2">
                {dbInfo.databases.map((dbName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-editor-bg rounded border border-editor-border hover:bg-editor-selection transition-colors"
                  >
                    <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 truncate">{dbName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Web application database
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subdirectories */}
          {dbInfo.subdirectories.length > 0 && (
            <div className="bg-editor-toolbar rounded-lg border border-editor-border p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Directory Structure
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {dbInfo.subdirectories.map((dir, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs px-3 py-2 bg-editor-bg rounded border border-editor-border"
                  >
                    <Folder className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-400 font-mono truncate">{dir}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information Panel */}
          <div className="bg-editor-toolbar rounded-lg border border-editor-border p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              About IndexedDB
            </h3>
            <div className="space-y-3 text-sm text-gray-400">
              <p>
                IndexedDB is a low-level API for client-side storage of significant amounts
                of structured data, including files/blobs. It uses indexes to enable
                high-performance searches.
              </p>

              <div className="text-xs space-y-2">
                <p className="text-gray-500">
                  <strong>Storage Structure:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-500 ml-2">
                  <li>
                    <strong className="text-gray-400">.indexeddb folders:</strong> Individual database directories
                  </li>
                  <li>
                    <strong className="text-gray-400">LevelDB backend:</strong> Chrome stores IndexedDB data using LevelDB
                  </li>
                  <li>
                    <strong className="text-gray-400">Blob storage:</strong> Large files stored separately
                  </li>
                </ul>
              </div>

              <div className="text-xs space-y-2 mt-4">
                <p className="text-gray-500">
                  <strong>Common Sources:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-500 ml-2">
                  <li>Web application offline data</li>
                  <li>Progressive Web App (PWA) storage</li>
                  <li>Browser extension data</li>
                  <li>Cached content from websites</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-ide-blue bg-opacity-10 border border-ide-blue border-opacity-30 rounded">
                <p className="text-xs text-gray-400">
                  <strong className="text-ide-blue">Forensics Tip:</strong> IndexedDB can
                  contain valuable artifacts including chat messages, cached API responses,
                  form data, and application state. Use specialized browser forensics tools
                  to extract and analyze the data within these databases.
                </p>
              </div>

              <div className="mt-3 p-3 bg-ide-yellow bg-opacity-10 border border-ide-yellow border-opacity-30 rounded">
                <p className="text-xs text-gray-400">
                  <strong className="text-ide-yellow">Note:</strong> To view the actual
                  database contents, you'll need to use browser developer tools or
                  specialized IndexedDB parsing tools. The underlying storage uses LevelDB
                  format with Chrome-specific encoding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
