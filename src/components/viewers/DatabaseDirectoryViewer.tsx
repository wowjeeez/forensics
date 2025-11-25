import { Database, Folder, File, HardDrive } from 'lucide-react';

interface DatabaseDirectoryViewerProps {
  path: string;
  type: 'leveldb' | 'indexeddb' | 'sqlite';
}

export function DatabaseDirectoryViewer({ path, type }: DatabaseDirectoryViewerProps) {

  const getDbTypeInfo = () => {
    switch (type) {
      case 'leveldb':
        return {
          name: 'LevelDB',
          icon: <Database className="w-12 h-12" />,
          description: 'Key-value storage used by Chrome, Electron apps, and other applications',
          extensions: ['.ldb', '.log', 'MANIFEST', 'CURRENT', 'LOCK'],
        };
      case 'indexeddb':
        return {
          name: 'IndexedDB',
          icon: <Database className="w-12 h-12" />,
          description: 'Browser database for storing large amounts of structured data',
          extensions: ['.sqlite', '.sqlite-wal', '.sqlite-shm'],
        };
      case 'sqlite':
        return {
          name: 'SQLite',
          icon: <HardDrive className="w-12 h-12" />,
          description: 'Lightweight relational database',
          extensions: ['.db', '.sqlite', '.sqlite3', '-wal', '-shm'],
        };
    }
  };

  const dbInfo = getDbTypeInfo();

  return (
    <div className="h-full w-full flex flex-col bg-editor-bg">
      {/* Header */}
      <div className="p-6 border-b border-editor-border">
        <div className="flex items-start gap-4">
          <div className="text-ide-blue">
            {dbInfo.icon}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-200 mb-2">
              {dbInfo.name} Directory
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {dbInfo.description}
            </p>
            <div className="text-xs text-gray-500">
              <strong>Path:</strong> {path}
            </div>
          </div>
        </div>
      </div>

      {/* Info sections */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Expected Files */}
          <div className="bg-editor-toolbar rounded-lg border border-editor-border p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Expected File Types
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dbInfo.extensions.map((ext, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs px-3 py-2 bg-editor-bg rounded border border-editor-border"
                >
                  <File className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-400 font-mono">{ext}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-editor-toolbar rounded-lg border border-editor-border p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              How to Analyze
            </h3>
            <div className="space-y-2 text-sm text-gray-400">
              {type === 'leveldb' && (
                <>
                  <p>• Expand the directory in the file tree to view individual files</p>
                  <p>• .ldb files contain the actual data (sorted string tables)</p>
                  <p>• .log files contain recent changes not yet compacted</p>
                  <p>• MANIFEST file tracks which files are part of the database</p>
                  <p>• Use specialized tools to extract key-value pairs</p>
                </>
              )}
              {type === 'indexeddb' && (
                <>
                  <p>• This is a browser IndexedDB storage directory</p>
                  <p>• Contains SQLite databases for each IndexedDB database</p>
                  <p>• -wal files are Write-Ahead Log files</p>
                  <p>• -shm files are shared memory files</p>
                  <p>• Open individual .sqlite files to view database contents</p>
                </>
              )}
              {type === 'sqlite' && (
                <>
                  <p>• Main .db/.sqlite file contains the database</p>
                  <p>• -wal file contains uncommitted changes (Write-Ahead Log)</p>
                  <p>• -shm file is shared memory index</p>
                  <p>• Open the main database file to query tables</p>
                </>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-ide-red bg-opacity-10 border border-ide-red border-opacity-30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-ide-red mb-2">
              Important
            </h3>
            <p className="text-xs text-gray-400">
              This is a multi-file database directory. Opening individual files may not provide
              meaningful data. Use the file tree to explore the directory structure, or use
              specialized database tools to properly analyze the contents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
