import { X, Database, Check, Loader2, AlertTriangle } from 'lucide-react';

export interface IndexStats {
  totalFiles: number;
  totalSize: number;
  indexedFiles: number;
  durationMs: number;
}

interface IndexingModalProps {
  isIndexing: boolean;
  stats: IndexStats | null;
  error: string | null;
  onClose: () => void;
}

export function IndexingModal({
  isIndexing,
  stats,
  error,
  onClose,
}: IndexingModalProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const progress = stats
    ? (stats.indexedFiles / stats.totalFiles) * 100
    : 0;

  const isComplete = !isIndexing && stats;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-toolbar border border-editor-border rounded-lg w-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-editor-border">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-ide-blue" />
            <h2 className="text-lg font-medium text-gray-200">
              {isIndexing
                ? 'Indexing Files...'
                : isComplete
                  ? 'Indexing Complete'
                  : error
                    ? 'Indexing Failed'
                    : 'Database Created'}
            </h2>
          </div>
          {!isIndexing && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-editor-bg rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {error ? (
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="w-16 h-16 text-ide-red" />
              <p className="text-sm text-gray-300 text-center">{error}</p>
            </div>
          ) : isIndexing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="w-12 h-12 text-ide-blue animate-spin" />
              </div>

              {stats && (
                <>
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-300">
                        {stats.indexedFiles.toLocaleString()} / {stats.totalFiles.toLocaleString()} files
                      </span>
                    </div>
                    <div className="h-2 bg-editor-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ide-blue transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {progress.toFixed(1)}%
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-editor-border">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Total Size</div>
                      <div className="text-sm text-gray-300">{formatBytes(stats.totalSize)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Duration</div>
                      <div className="text-sm text-gray-300">{formatDuration(stats.durationMs)}</div>
                    </div>
                  </div>
                </>
              )}

              <p className="text-xs text-gray-500 text-center pt-4">
                Indexing file metadata and content for search...
              </p>
            </div>
          ) : isComplete && stats ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-ide-green/20 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-ide-green" />
                </div>
              </div>

              {/* Completion Stats */}
              <div className="space-y-3">
                <div className="p-3 bg-editor-bg rounded border border-editor-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Files Indexed</div>
                      <div className="text-lg text-gray-200 font-medium">
                        {stats.indexedFiles.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Total Size</div>
                      <div className="text-lg text-gray-200 font-medium">
                        {formatBytes(stats.totalSize)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-editor-bg rounded border border-editor-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Duration</span>
                    <span className="text-sm text-gray-300">{formatDuration(stats.durationMs)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2">
                Files have been indexed and are ready for search and analysis.
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {isComplete && (
          <div className="p-4 border-t border-editor-border flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-ide-blue text-white rounded text-sm hover:bg-opacity-80 transition-opacity flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
