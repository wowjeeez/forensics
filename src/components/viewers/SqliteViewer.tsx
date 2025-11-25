import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Database, Table, ChevronRight, ChevronDown, Key, Hash, Info, Search } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { DataContextMenu } from '../ui/DataContextMenu';

export interface SqliteViewerHandle {
  openSearch: () => void;
}

interface SqliteViewerProps {
  path: string;
}

interface SqliteColumnInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  primaryKey: boolean;
}

interface SqliteTableInfo {
  name: string;
  columns: SqliteColumnInfo[];
  rowCount: number;
  indexes: string[];
}

interface SqliteDatabaseInfo {
  version: string;
  pageSize: number;
  tables: SqliteTableInfo[];
  totalRows: number;
}

interface QueryResultRow {
  values: any[];
}

export const SqliteViewer = forwardRef<SqliteViewerHandle, SqliteViewerProps>(function SqliteViewer({ path }, ref) {
  const [dbInfo, setDbInfo] = useState<SqliteDatabaseInfo | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<QueryResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    value: any;
    position: { x: number; y: number };
    structuralPath: string;
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    openSearch: () => {
      searchInputRef.current?.focus();
    },
  }));

  const ROWS_PER_PAGE = 100;

  useEffect(() => {
    loadDatabaseInfo();
  }, [path]);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable, currentPage);
    }
  }, [selectedTable, currentPage]);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading SQLite database from path:', path);

      const info = await invoke<SqliteDatabaseInfo>('query_sqlite_info', {
        dbPath: path,
      });

      console.log('Database loaded successfully:', info);
      setDbInfo(info);

      if (info.tables.length > 0) {
        setSelectedTable(info.tables[0].name);
        setExpandedTables(new Set([info.tables[0].name]));
      }
    } catch (err) {
      console.error('Error loading database:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Full error details:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string, page: number) => {
    try {
      const data = await invoke<QueryResultRow[]>('query_sqlite_table', {
        dbPath: path,
        tableName,
        limit: ROWS_PER_PAGE,
        offset: page * ROWS_PER_PAGE,
      });
      setTableData(data);
    } catch (err) {
      console.error('Error loading table data:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const toggleTableExpanded = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const getSelectedTableInfo = (): SqliteTableInfo | null => {
    if (!dbInfo || !selectedTable) return null;
    return dbInfo.tables.find((t) => t.name === selectedTable) || null;
  };

  const filteredTables = dbInfo?.tables.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg">
        <div className="text-gray-400">Loading database...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg p-6">
        <div className="max-w-2xl">
          <div className="bg-ide-red bg-opacity-10 border border-ide-red rounded-lg p-6">
            <h3 className="text-lg font-semibold text-ide-red mb-3 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Error Loading SQLite Database
            </h3>
            <div className="space-y-3">
              <div className="bg-editor-bg rounded p-3 border border-editor-border">
                <p className="text-sm text-gray-300 font-mono break-all">{error}</p>
              </div>

              <div className="text-xs text-gray-400 space-y-2">
                <p><strong>Path:</strong> <span className="font-mono">{path}</span></p>

                <p className="pt-2"><strong>Common Issues:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>File is locked by another application (close any other programs using it)</li>
                  <li>File is corrupted or not a valid SQLite3 database</li>
                  <li>Path contains special characters that aren't properly escaped</li>
                  <li>Insufficient permissions to read the file</li>
                  <li>File might be a SQLite journal/wal file instead of the main database</li>
                </ul>

                <p className="pt-2"><strong>Troubleshooting:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Try using the "Open as" dropdown and select a different viewer</li>
                  <li>Check if the file is actually a SQLite database (should start with "SQLite format 3")</li>
                  <li>If the file has no extension, try manually selecting "SQLite Database" from the dropdown</li>
                </ul>
              </div>
            </div>
          </div>
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

  const selectedTableInfo = getSelectedTableInfo();
  const totalPages = selectedTableInfo
    ? Math.ceil(selectedTableInfo.rowCount / ROWS_PER_PAGE)
    : 0;

  return (
    <div className="h-full w-full flex bg-editor-bg">
      {/* Left Sidebar - Table List */}
      <div className="w-64 border-r border-editor-border flex flex-col">
        {/* Database Header */}
        <div className="p-4 border-b border-editor-border">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-ide-blue" />
            <h2 className="text-sm font-semibold text-gray-200">SQLite Database</h2>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Version: {dbInfo.version}</div>
            <div>Tables: {dbInfo.tables.length}</div>
            <div>Total Rows: {dbInfo.totalRows.toLocaleString()}</div>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-editor-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-ide-blue"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-auto">
          {filteredTables.map((table) => {
            const isExpanded = expandedTables.has(table.name);
            const isSelected = selectedTable === table.name;

            return (
              <div key={table.name} className="border-b border-editor-border">
                <button
                  onClick={() => {
                    setSelectedTable(table.name);
                    setCurrentPage(0);
                  }}
                  className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-editor-selection transition-colors ${
                    isSelected ? 'bg-editor-selection' : ''
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTableExpanded(table.name);
                    }}
                    className="flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  <Table className="w-4 h-4 text-ide-blue flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="text-sm text-gray-200 truncate">{table.name}</div>
                    <div className="text-xs text-gray-500">
                      {table.rowCount.toLocaleString()} rows
                    </div>
                  </div>
                </button>

                {/* Column Details */}
                {isExpanded && (
                  <div className="pl-8 py-1 bg-editor-toolbar">
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        className="py-1 px-2 flex items-center gap-2 text-xs"
                      >
                        {col.primaryKey ? (
                          <Key className="w-3 h-3 text-yellow-400" />
                        ) : (
                          <Hash className="w-3 h-3 text-gray-500" />
                        )}
                        <span className="text-gray-300">{col.name}</span>
                        <span className="text-gray-500 text-[10px]">{col.dataType}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Table Data */}
      <div className="flex-1 flex flex-col">
        {selectedTableInfo ? (
          <>
            {/* Table Header */}
            <div className="p-4 border-b border-editor-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-1">
                    {selectedTableInfo.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{selectedTableInfo.columns.length} columns</span>
                    <span>{selectedTableInfo.rowCount.toLocaleString()} rows</span>
                    {selectedTableInfo.indexes.length > 0 && (
                      <span>{selectedTableInfo.indexes.length} indexes</span>
                    )}
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-2 py-1 text-xs bg-editor-toolbar border border-editor-border rounded text-gray-300 hover:bg-editor-selection disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-400">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                      }
                      disabled={currentPage >= totalPages - 1}
                      className="px-2 py-1 text-xs bg-editor-toolbar border border-editor-border rounded text-gray-300 hover:bg-editor-selection disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Table Data */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-editor-toolbar border-b border-editor-border">
                  <tr>
                    {selectedTableInfo.columns.map((col) => (
                      <th
                        key={col.name}
                        className="px-3 py-2 text-left font-medium text-gray-300"
                      >
                        <div className="flex items-center gap-1">
                          {col.primaryKey && <Key className="w-3 h-3 text-yellow-400" />}
                          {col.name}
                          <span className="text-gray-500 font-normal ml-1">
                            ({col.dataType})
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-editor-border hover:bg-editor-selection"
                    >
                      {row.values.map((value, colIdx) => {
                        const columnName = selectedTableInfo?.columns[colIdx]?.name || `col_${colIdx}`;
                        return (
                        <td
                          key={colIdx}
                          className="px-3 py-2 text-gray-400 cursor-pointer hover:bg-editor-bg"
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              value,
                              position: { x: e.clientX, y: e.clientY },
                              structuralPath: `${selectedTable}.${columnName}[row:${currentPage * ROWS_PER_PAGE + rowIdx}]`,
                            });
                          }}
                        >
                          {value === null ? (
                            <span className="italic text-gray-600">NULL</span>
                          ) : typeof value === 'object' ? (
                            <span className="text-ide-blue">
                              {JSON.stringify(value)}
                            </span>
                          ) : typeof value === 'boolean' ? (
                            <span className="text-ide-green">
                              {value.toString()}
                            </span>
                          ) : typeof value === 'number' ? (
                            <span className="text-ide-yellow">{value}</span>
                          ) : (
                            <span className="truncate max-w-xs block">
                              {String(value)}
                            </span>
                          )}
                        </td>
                      );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {tableData.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  No data in this table
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Info className="w-12 h-12 mx-auto mb-2 text-gray-600" />
              <p>Select a table to view its contents</p>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <DataContextMenu
          value={contextMenu.value}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          filePath={path}
          structuralPath={contextMenu.structuralPath}
          sourceType="sqlite"
          onGlobalSearch={(value) => {
            console.log('Global search for:', value);
          }}
        />
      )}
    </div>
  );
});
