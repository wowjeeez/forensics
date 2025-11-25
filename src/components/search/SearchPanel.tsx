import { useState } from 'react';
import { Search, X, ChevronRight, ChevronDown, FileText, Image, FileCode, Database, File, Filter, Sparkles } from 'lucide-react';
import { SearchResult } from '../../types';
import { invoke } from '@tauri-apps/api/core';

interface SearchPanelProps {
  onSearch?: (query: string, options: SearchOptions) => Promise<SearchResult[]>;
}

interface SearchOptions {
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
  includePattern?: string;
  excludePattern?: string;
  fileTypes?: FileTypeFilter[];
}

export enum FileTypeFilter {
  ALL = 'all',
  DOCUMENTS = 'documents',
  IMAGES = 'images',
  VIDEO = 'video',
  AUDIO = 'audio',
  CODE = 'code',
  ARCHIVES = 'archives',
  DATABASES = 'databases',
  EXECUTABLES = 'executables',
}

const FILE_TYPE_EXTENSIONS: Record<FileTypeFilter, string[]> = {
  [FileTypeFilter.ALL]: [],
  [FileTypeFilter.DOCUMENTS]: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'md'],
  [FileTypeFilter.IMAGES]: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'heic', 'heif', 'avif', 'ico', 'tiff'],
  [FileTypeFilter.VIDEO]: ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm', 'm4v'],
  [FileTypeFilter.AUDIO]: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'],
  [FileTypeFilter.CODE]: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'rb', 'php', 'html', 'css', 'json', 'xml', 'yaml', 'yml'],
  [FileTypeFilter.ARCHIVES]: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'],
  [FileTypeFilter.DATABASES]: ['db', 'sqlite', 'sqlite3', 'mdb', 'accdb', 'sql'],
  [FileTypeFilter.EXECUTABLES]: ['exe', 'dll', 'so', 'dylib', 'app', 'dmg', 'pkg', 'deb', 'rpm', 'apk', 'jar'],
};

const FILE_TYPE_LABELS: Record<FileTypeFilter, string> = {
  [FileTypeFilter.ALL]: 'All Files',
  [FileTypeFilter.DOCUMENTS]: 'Documents',
  [FileTypeFilter.IMAGES]: 'Images',
  [FileTypeFilter.VIDEO]: 'Video',
  [FileTypeFilter.AUDIO]: 'Audio',
  [FileTypeFilter.CODE]: 'Code',
  [FileTypeFilter.ARCHIVES]: 'Archives',
  [FileTypeFilter.DATABASES]: 'Databases',
  [FileTypeFilter.EXECUTABLES]: 'Executables',
};

const FILE_TYPE_ICONS: Record<FileTypeFilter, React.ReactNode> = {
  [FileTypeFilter.ALL]: <File className="w-4 h-4" />,
  [FileTypeFilter.DOCUMENTS]: <FileText className="w-4 h-4" />,
  [FileTypeFilter.IMAGES]: <Image className="w-4 h-4" />,
  [FileTypeFilter.VIDEO]: <FileCode className="w-4 h-4" />,
  [FileTypeFilter.AUDIO]: <FileCode className="w-4 h-4" />,
  [FileTypeFilter.CODE]: <FileCode className="w-4 h-4" />,
  [FileTypeFilter.ARCHIVES]: <File className="w-4 h-4" />,
  [FileTypeFilter.DATABASES]: <Database className="w-4 h-4" />,
  [FileTypeFilter.EXECUTABLES]: <File className="w-4 h-4" />,
};

export function SearchPanel({ onSearch }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [useIndexer, setUseIndexer] = useState(true);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    regex: false,
    wholeWord: false,
    fileTypes: [FileTypeFilter.ALL],
  });
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [indexerResults, setIndexerResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!query) return;

    setIsSearching(true);
    try {
      if (useIndexer) {
        // Use indexer database search - pass Query object directly
        const searchQuery = {
          type: 'fulltext',
          query: query,
          limit: 100,
        };

        const result = await invoke<any>('search_database', {
          query: searchQuery,
        });

        setIndexerResults(result.hits || []);
        setResults([]);
      } else if (onSearch) {
        // Use legacy search
        const results = await onSearch(query, options);
        setResults(results);
        setIndexerResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFileType = (type: FileTypeFilter) => {
    setOptions(prev => {
      let newTypes = [...(prev.fileTypes || [])];

      if (type === FileTypeFilter.ALL) {
        newTypes = [FileTypeFilter.ALL];
      } else {
        newTypes = newTypes.filter(t => t !== FileTypeFilter.ALL);

        if (newTypes.includes(type)) {
          newTypes = newTypes.filter(t => t !== type);
          if (newTypes.length === 0) {
            newTypes = [FileTypeFilter.ALL];
          }
        } else {
          newTypes.push(type);
        }
      }

      return { ...prev, fileTypes: newTypes };
    });
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.path]) {
      acc[result.path] = [];
    }
    acc[result.path].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const toggleFile = (path: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFiles(newExpanded);
  };

  const isFileTypeActive = (type: FileTypeFilter) => {
    return options.fileTypes?.includes(type);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search input */}
      <div className="p-3 border-b border-editor-border">
        <div className="flex items-center gap-2 bg-editor-toolbar border border-editor-border rounded px-2 py-1.5">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-0.5 hover:bg-editor-bg rounded">
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Search Options */}
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          <button
            onClick={() => setUseIndexer(!useIndexer)}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              useIndexer
                ? 'bg-ide-blue text-white'
                : 'bg-editor-toolbar text-gray-400 hover:text-gray-300'
            }`}
            title="Use AI Indexer Database"
          >
            <Sparkles className="w-3 h-3" />
            Indexer
          </button>

          {!useIndexer && (
            <>
              <button
                onClick={() => setOptions({ ...options, caseSensitive: !options.caseSensitive })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  options.caseSensitive
                    ? 'bg-ide-blue text-white'
                    : 'bg-editor-toolbar text-gray-400 hover:text-gray-300'
                }`}
                title="Case Sensitive"
              >
                Aa
              </button>
              <button
                onClick={() => setOptions({ ...options, wholeWord: !options.wholeWord })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  options.wholeWord
                    ? 'bg-ide-blue text-white'
                    : 'bg-editor-toolbar text-gray-400 hover:text-gray-300'
                }`}
                title="Match Whole Word"
              >
                Word
              </button>
              <button
                onClick={() => setOptions({ ...options, regex: !options.regex })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  options.regex
                    ? 'bg-ide-blue text-white'
                    : 'bg-editor-toolbar text-gray-400 hover:text-gray-300'
                }`}
                title="Use Regular Expression"
              >
                .*
              </button>
            </>
          )}

          <div className="flex-1" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              showFilters
                ? 'bg-ide-blue text-white'
                : 'bg-editor-toolbar text-gray-400 hover:text-gray-300'
            }`}
            title="File Type Filters"
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>
        </div>

        {/* File Type Filters */}
        {showFilters && (
          <div className="mt-3 p-2 bg-editor-toolbar rounded border border-editor-border">
            <div className="text-xs text-gray-400 mb-2 font-medium">File Types</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(FILE_TYPE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => toggleFileType(type as FileTypeFilter)}
                  className={`px-2 py-1.5 text-xs rounded transition-colors flex items-center gap-2 ${
                    isFileTypeActive(type as FileTypeFilter)
                      ? 'bg-ide-blue text-white'
                      : 'bg-editor-bg text-gray-400 hover:text-gray-300 hover:bg-editor-selection'
                  }`}
                >
                  {FILE_TYPE_ICONS[type as FileTypeFilter]}
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Show active extensions */}
            {!isFileTypeActive(FileTypeFilter.ALL) && (
              <div className="mt-2 pt-2 border-t border-editor-border">
                <div className="text-xs text-gray-500">
                  Extensions: {
                    options.fileTypes
                      ?.filter(t => t !== FileTypeFilter.ALL)
                      .flatMap(t => FILE_TYPE_EXTENSIONS[t])
                      .join(', ')
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {isSearching ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            Searching...
          </div>
        ) : useIndexer && indexerResults.length > 0 ? (
          /* Indexer Results */
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2 px-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              {indexerResults.length} indexed results (score-ranked)
            </div>
            {indexerResults.map((hit, idx) => (
              <div
                key={idx}
                className="mb-2 p-3 bg-editor-toolbar border border-editor-border rounded hover:bg-editor-selection transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-ide-blue flex-shrink-0" />
                  <span className="text-sm text-gray-300 truncate flex-1">
                    {hit.path}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(hit.score * 100).toFixed(0)}%
                  </span>
                </div>

                {hit.category && (
                  <div className="text-xs text-ide-cyan mb-1 uppercase">
                    {hit.category}
                  </div>
                )}

                {hit.snippet && (
                  <div className="text-xs text-gray-400 font-mono bg-editor-bg p-2 rounded">
                    {hit.snippet}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            {query ? 'No results found' : 'Enter search query'}
          </div>
        ) : (
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2 px-2">
              {results.length} results in {Object.keys(groupedResults).length} files
            </div>

            {Object.entries(groupedResults).map(([path, fileResults]) => (
              <div key={path} className="mb-2">
                <div
                  onClick={() => toggleFile(path)}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-editor-toolbar rounded cursor-pointer"
                >
                  {expandedFiles.has(path) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <FileText className="w-4 h-4 text-ide-blue" />
                  <span className="text-sm text-gray-300 truncate flex-1">{path}</span>
                  <span className="text-xs text-gray-500">{fileResults.length}</span>
                </div>

                {expandedFiles.has(path) && (
                  <div className="ml-8 mt-1">
                    {fileResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-1 hover:bg-editor-selection rounded cursor-pointer text-xs"
                      >
                        <div className="text-gray-500">
                          Line {result.line}:{result.column}
                        </div>
                        <div className="text-gray-300 truncate font-mono">
                          {result.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
