import { useState, useEffect } from 'react';
import { Search, X, File, Database, FileText } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface SearchResult {
  id: string;
  path: string;
  category: string;
  snippet: string;
  score: number;
}

interface GlobalSearchProps {
  initialQuery?: string;
  onClose: () => void;
}

export function GlobalSearch({ initialQuery = '', onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryTime, setQueryTime] = useState(0);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const result = await invoke<{ hits: SearchResult[]; total: number; queryTimeMs: number }>(
        'search_database',
        {
          query: {
            type: 'fulltext',
            query: searchQuery,
            limit: 100,
          },
        }
      );

      setResults(result.hits);
      setQueryTime(result.queryTimeMs);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'structureddata':
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50" onClick={onClose} />

      {/* Search Modal */}
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 w-full max-w-3xl bg-editor-toolbar border border-editor-border rounded-lg shadow-2xl z-50 max-h-[80vh] flex flex-col">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="p-4 border-b border-editor-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all indexed files..."
              className="w-full pl-12 pr-12 py-3 bg-editor-bg border border-editor-border rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-ide-blue"
              autoFocus
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-editor-selection rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {queryTime > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              Found {results.length} result{results.length !== 1 ? 's' : ''} in {queryTime}ms
            </div>
          )}
        </form>

        {/* Results */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="p-3 bg-editor-bg border border-editor-border rounded hover:bg-editor-selection transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="text-ide-blue mt-1">
                      {getCategoryIcon(result.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-300 font-medium truncate mb-1">
                        {result.path}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {result.category}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {(result.score * 100).toFixed(0)}%
                    </div>
                  </div>

                  {result.snippet && (
                    <div className="text-sm text-gray-400 font-mono bg-editor-toolbar p-2 rounded mt-2">
                      {result.snippet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="text-center py-12 text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>Enter a search query to find data across all indexed files</p>
              <p className="text-xs mt-2 text-gray-600">
                Supports full-text search across SQLite, JSON, CSV, XML, and text files
              </p>
            </div>
          )}
        </div>

        {/* Help Footer */}
        <div className="p-3 border-t border-editor-border bg-editor-bg">
          <div className="text-xs text-gray-600">
            <span className="font-semibold">Tips:</span> Use quotes for exact matches, category:database
            for filtering
          </div>
        </div>
      </div>
    </>
  );
}
