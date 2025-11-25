import { useState } from 'react';
import { Database, Table, Play } from 'lucide-react';

interface TableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

interface DatabaseViewerProps {
  tables?: TableInfo[];
  onExecuteQuery?: (query: string) => Promise<any[]>;
}

export function DatabaseViewer({ tables = [], onExecuteQuery }: DatabaseViewerProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecuteQuery = async () => {
    if (!query || !onExecuteQuery) return;

    setIsExecuting(true);
    try {
      const data = await onExecuteQuery(query);
      setResults(data);
    } catch (error) {
      console.error('Query execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-full w-full flex bg-editor-bg">
      {/* Tables sidebar */}
      <div className="w-64 border-r border-editor-border flex flex-col">
        <div className="h-10 border-b border-editor-border flex items-center px-3">
          <Database className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-300">Tables</span>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin p-2">
          {tables.map((table) => (
            <div
              key={table.name}
              onClick={() => setSelectedTable(table.name)}
              className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                selectedTable === table.name
                  ? 'bg-editor-selection text-gray-200'
                  : 'text-gray-400 hover:bg-editor-toolbar hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                <span className="text-sm">{table.name}</span>
              </div>
              <div className="text-xs text-gray-500 ml-6">
                {table.rowCount} rows
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Query editor */}
        <div className="border-b border-editor-border">
          <div className="h-10 border-b border-editor-border flex items-center justify-between px-3">
            <span className="text-sm text-gray-300">Query</span>
            <button
              onClick={handleExecuteQuery}
              disabled={!query || isExecuting}
              className="flex items-center gap-1 px-3 py-1 bg-ide-blue text-white rounded text-sm hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <Play className="w-3 h-3" />
              Execute
            </button>
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM table_name WHERE ..."
            className="w-full h-32 px-3 py-2 bg-editor-bg text-gray-300 font-mono text-sm resize-none focus:outline-none scrollbar-thin"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {isExecuting ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Executing query...
            </div>
          ) : results === null ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              {selectedTable ? (
                <div className="text-center">
                  <p className="text-sm mb-2">Table: {selectedTable}</p>
                  <p className="text-xs">Execute a query to see results</p>
                </div>
              ) : (
                <p className="text-sm">Select a table or execute a query</p>
              )}
            </div>
          ) : (
            <div className="p-4">
              <div className="text-xs text-gray-400 mb-2">
                {results.length} rows returned
              </div>

              {results.length > 0 && (
                <table className="w-full text-sm border border-editor-border">
                  <thead className="bg-editor-toolbar">
                    <tr>
                      {Object.keys(results[0]).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left text-gray-300 font-medium border-b border-editor-border"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-editor-border hover:bg-editor-toolbar transition-colors"
                      >
                        {Object.values(row).map((value: any, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 text-gray-300">
                            {value === null ? (
                              <span className="text-gray-500 italic">NULL</span>
                            ) : (
                              String(value)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
