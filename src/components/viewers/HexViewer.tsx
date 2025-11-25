import {useEffect, useMemo, useState} from 'react';
import { Settings } from 'lucide-react';
import { DataContextMenu } from '../ui/DataContextMenu';

interface HexViewerProps {
  data: string;
  bytesPerRow?: number;
}

type Encoding = 'utf-8' | 'utf-16le' | 'utf-16be' | 'ascii' | 'latin1' | 'windows-1252';

const ENCODINGS: { value: Encoding; label: string }[] = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'utf-16le', label: 'UTF-16 LE' },
  { value: 'utf-16be', label: 'UTF-16 BE' },
  { value: 'ascii', label: 'ASCII' },
  { value: 'latin1', label: 'Latin-1' },
  { value: 'windows-1252', label: 'Windows-1252' },
];

const calculateEntropy = (data: Uint8Array): number => {
  const frequencies = new Map<number, number>();
  data.forEach(byte => {
    frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
  });

  let entropy = 0;
  const len = data.length;

  frequencies.forEach(count => {
    const p = count / len;
    entropy -= p * Math.log2(p);
  });

  return entropy;
};

export function HexViewer({ data, bytesPerRow = 16 }: HexViewerProps) {
  const [encoding, setEncoding] = useState<Encoding>('utf-8');
  const [showSettings, setShowSettings] = useState(false);
  const [bytesPerRowSetting, setBytesPerRowSetting] = useState(bytesPerRow);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    value: any;
    position: { x: number; y: number };
  } | null>(null);

    const [bytes, setBytes] = useState<Uint8Array>(new Uint8Array(0))
  useEffect(() => {
      try {
          fetch(data).then(r => r.bytes()).then(r => setBytes(r))
      } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process data');
    }
  }, [data]);

  const decodeText = (bytes: Uint8Array): string => {
    try {
      switch (encoding) {
        case 'utf-8':
          return new TextDecoder('utf-8').decode(bytes);
        case 'utf-16le':
          return new TextDecoder('utf-16le').decode(bytes);
        case 'utf-16be':
          return new TextDecoder('utf-16be').decode(bytes);
        case 'ascii':
        case 'latin1':
        case 'windows-1252':
          return Array.from(bytes)
            .map(b => String.fromCharCode(b))
            .join('');
        default:
          return new TextDecoder('utf-8').decode(bytes);
      }
    } catch (err) {
      console.error('Decoding error:', err);
      return Array.from(bytes)
        .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
        .join('');
    }
  };

  const rows = useMemo(() => {
    const result: Array<{
      offset: string;
      hex: string[];
      ascii: string;
      decoded: string;
    }> = [];

    for (let i = 0; i < bytes.length; i += bytesPerRowSetting) {
      const rowBytes = bytes.slice(i, i + bytesPerRowSetting);
      const hex = Array.from(rowBytes).map(b => b.toString(16).padStart(2, '0'));

      const ascii = Array.from(rowBytes)
        .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
        .join('');

      const decoded = decodeText(rowBytes)
        .split('')
        .map(c => {
          const code = c.charCodeAt(0);
          return code >= 32 && code <= 126 ? c : '.';
        })
        .join('');

      result.push({
        offset: i.toString(16).padStart(8, '0'),
        hex,
        ascii,
        decoded,
      });
    }

    return result;
  }, [bytes, bytesPerRowSetting, encoding]);

  const stats = useMemo(() => {
    const nullBytes = Array.from(bytes).filter(b => b === 0).length;
    const printable = Array.from(bytes).filter(b => b >= 32 && b <= 126).length;
    const entropy = calculateEntropy(bytes);

    return {
      size: bytes.length,
      nullBytes,
      printable,
      entropy: entropy.toFixed(2),
    };
  }, [bytes]);

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg">
        <div className="text-center">
          <p className="text-ide-red mb-2">Hex Viewer Error</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (bytes.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-editor-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-editor-border bg-editor-toolbar">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Size: <span className="text-gray-300">{stats.size.toLocaleString()}</span> bytes</span>
          <span>Entropy: <span className="text-gray-300">{stats.entropy}</span></span>
          <span>Printable: <span className="text-gray-300">{stats.size > 0 ? ((stats.printable / stats.size) * 100).toFixed(1) : 0}%</span></span>
          <span>Null bytes: <span className="text-gray-300">{stats.nullBytes}</span></span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={encoding}
            onChange={(e) => setEncoding(e.target.value as Encoding)}
            className="px-2 py-1 text-xs bg-editor-bg border border-editor-border rounded text-gray-300 focus:outline-none focus:border-ide-blue"
          >
            {ENCODINGS.map(enc => (
              <option key={enc.value} value={enc.value}>
                {enc.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${
              showSettings ? 'bg-ide-blue text-white' : 'hover:bg-editor-selection'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-editor-border bg-editor-toolbar">
          <div className="flex items-center gap-4">
            <label className="text-xs text-gray-400">
              Bytes per row:
              <input
                type="number"
                min="8"
                max="32"
                step="8"
                value={bytesPerRowSetting}
                onChange={(e) => setBytesPerRowSetting(Number(e.target.value))}
                className="ml-2 px-2 py-1 w-16 bg-editor-bg border border-editor-border rounded text-gray-300 text-xs focus:outline-none focus:border-ide-blue"
              />
            </label>
          </div>
        </div>
      )}

      {/* Hex content */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs scrollbar-thin">
        <div className="flex gap-6 text-gray-500 mb-2 sticky top-0 bg-editor-bg pb-2 border-b border-editor-border z-10">
          <div className="w-20">Offset</div>
          <div style={{ width: `${bytesPerRowSetting * 2.5}ch` }}>Hex</div>
          <div style={{ width: `${bytesPerRowSetting}ch` }}>ASCII</div>
          {encoding !== 'ascii' && (
            <div style={{ width: `${bytesPerRowSetting}ch` }}>
              Decoded ({encoding})
            </div>
          )}
        </div>

        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-6 hover:bg-editor-toolbar transition-colors py-0.5">
            <div className="w-20 text-ide-cyan">{row.offset}</div>
            <div style={{ width: `${bytesPerRowSetting * 2.5}ch` }} className="flex gap-1 flex-wrap">
              {row.hex.map((byte, i) => (
                <span
                  key={i}
                  className={`cursor-pointer hover:bg-editor-selection ${
                    parseInt(byte, 16) === 0
                      ? 'text-gray-600'
                      : parseInt(byte, 16) >= 32 && parseInt(byte, 16) <= 126
                      ? 'text-gray-300'
                      : 'text-ide-orange'
                  }`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      value: byte,
                      position: { x: e.clientX, y: e.clientY },
                    });
                  }}
                >
                  {byte}
                </span>
              ))}
            </div>
            <div
              style={{ width: `${bytesPerRowSetting}ch` }}
              className="text-ide-green cursor-pointer hover:bg-editor-selection"
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                  value: row.ascii,
                  position: { x: e.clientX, y: e.clientY },
                });
              }}
            >
              {row.ascii}
            </div>
            {encoding !== 'ascii' && (
              <div
                style={{ width: `${bytesPerRowSetting}ch` }}
                className="text-ide-purple cursor-pointer hover:bg-editor-selection"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    value: row.decoded,
                    position: { x: e.clientX, y: e.clientY },
                  });
                }}
              >
                {row.decoded}
              </div>
            )}
          </div>
        ))}
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
