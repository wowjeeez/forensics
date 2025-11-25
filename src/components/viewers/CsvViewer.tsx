import {useEffect, useMemo, useState} from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { DataContextMenu } from '../ui/DataContextMenu';

interface CsvViewerProps {
  data: string;
  delimiter?: string;
}

export function CsvViewer({ data, delimiter = ',' }: CsvViewerProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    value: any;
    position: { x: number; y: number };
  } | null>(null);

    const [csvStructure, setCsvStructure] = useState<string | null>(null)
    useEffect(() => {
        fetch(data).then(r => r.text()).then(r => setCsvStructure(r))
    }, [data])

  const { headers, rows } = useMemo(() => {
      if (!csvStructure) return { headers: [], rows: [] };
    const lines = csvStructure!.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(delimiter).map(h => h.trim());
    const rows = lines.slice(1).map(line =>
      line.split(delimiter).map(cell => cell.trim())
    );

    return { headers, rows };
  }, [csvStructure, delimiter]);

  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Filter
    if (filter) {
      result = result.filter(row =>
        row.some(cell => cell.toLowerCase().includes(filter.toLowerCase()))
      );
    }

    // Sort
    if (sortColumn !== null) {
      result.sort((a, b) => {
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';

        const numA = parseFloat(aVal);
        const numB = parseFloat(bVal);

        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    return result;
  }, [rows, filter, sortColumn, sortDirection]);

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-editor-bg">
      {/* Toolbar */}
      <div className="h-10 border-b border-editor-border flex items-center gap-4 px-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter rows..."
            className="flex-1 bg-editor-toolbar border border-editor-border rounded px-2 py-1 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-ide-blue"
          />
        </div>
        <span className="text-sm text-gray-400">
          {filteredAndSortedRows.length} / {rows.length} rows
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-editor-toolbar border-b border-editor-border">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(idx)}
                  className="px-4 py-2 text-left text-gray-300 font-medium cursor-pointer hover:bg-editor-bg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {header}
                    <ArrowUpDown className="w-3 h-3 text-gray-500" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-editor-border hover:bg-editor-toolbar transition-colors"
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-2 text-gray-300 cursor-pointer hover:bg-editor-bg"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        value: cell,
                        position: { x: e.clientX, y: e.clientY },
                      });
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <DataContextMenu
          value={contextMenu.value}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onGlobalSearch={(value) => {
            console.log('Global search for:', value);
            alert(`Global search for: ${value}\n\n(Search functionality to be implemented)`);
          }}
          onAddToGroup={(value) => {
            console.log('Add to group:', value);
            alert(`Add to group: ${value}\n\n(Group management to be implemented)`);
          }}
        />
      )}
    </div>
  );
}
