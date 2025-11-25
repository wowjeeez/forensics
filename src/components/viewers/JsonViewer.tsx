import {useEffect, useState} from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { DataContextMenu } from '../ui/DataContextMenu';

interface JsonViewerProps {
  data: any;
}

export function JsonViewer({ data }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [jsonStructure, setJsonStructure] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{
    value: any;
    position: { x: number; y: number };
    structuralPath: string;
  } | null>(null);
  useEffect(() => {
  fetch(data).then(r => r.text()).then(r => JSON.parse(r)).then(r => setJsonStructure(r))
  }, [data])

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonStructure, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-editor-bg">
      <div className="h-10 border-b border-editor-border flex items-center justify-between px-4">
        <span className="text-sm text-gray-400">JSON Viewer</span>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-editor-toolbar rounded transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-ide-green" />
              <span className="text-xs text-ide-green">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-gray-300" />
              <span className="text-xs text-gray-300">Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-4 font-mono text-sm">
          {jsonStructure ? <JsonNode data={jsonStructure} name="root" depth={0} path="$" onContextMenu={setContextMenu}/> : "Loading..."}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <DataContextMenu
          value={contextMenu.value}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          filePath={data}
          structuralPath={contextMenu.structuralPath}
          sourceType="json"
          onGlobalSearch={(value) => {
            console.log('Global search for:', value);
          }}
        />
      )}
    </div>
  );
}

interface JsonNodeProps {
  data: any;
  name: string;
  depth: number;
  path: string;
  onContextMenu: (menu: { value: any; position: { x: number; y: number }; structuralPath: string }) => void;
}

function JsonNode({ data, name, depth, path, onContextMenu }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);

  const handleContextMenu = (e: React.MouseEvent, value: any) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu({
      value,
      position: { x: e.clientX, y: e.clientY },
      structuralPath: path,
    });
  };

  if (data === null) {
    return (
      <div
        style={{ paddingLeft: `${depth * 16}px` }}
        onContextMenu={(e) => handleContextMenu(e, data)}
        className="cursor-pointer hover:bg-editor-toolbar"
      >
        <span className="text-ide-purple">null</span>
      </div>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <div
        style={{ paddingLeft: `${depth * 16}px` }}
        onContextMenu={(e) => handleContextMenu(e, data)}
        className="cursor-pointer hover:bg-editor-toolbar"
      >
        <span className="text-gray-400">{name}: </span>
        <span className="text-ide-purple">{data.toString()}</span>
      </div>
    );
  }

  if (typeof data === 'number') {
    return (
      <div
        style={{ paddingLeft: `${depth * 16}px` }}
        onContextMenu={(e) => handleContextMenu(e, data)}
        className="cursor-pointer hover:bg-editor-toolbar"
      >
        <span className="text-gray-400">{name}: </span>
        <span className="text-ide-blue">{data}</span>
      </div>
    );
  }

  if (typeof data === 'string') {
    return (
      <div
        style={{ paddingLeft: `${depth * 16}px` }}
        onContextMenu={(e) => handleContextMenu(e, data)}
        className="cursor-pointer hover:bg-editor-toolbar"
      >
        <span className="text-gray-400">{name}: </span>
        <span className="text-ide-green">"{data}"</span>
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div>
        <div
          style={{ paddingLeft: `${depth * 16}px` }}
          className="cursor-pointer hover:bg-editor-toolbar transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="inline w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="inline w-4 h-4 text-gray-400" />
          )}
          <span className="text-gray-400">{name}: </span>
          <span className="text-gray-500">[{data.length}]</span>
        </div>
        {expanded && (
          <div>
            {data.map((item, idx) => (
              <JsonNode key={idx} data={item} name={`[${idx}]`} depth={depth + 1} path={`${path}[${idx}]`} onContextMenu={onContextMenu} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return (
      <div>
        <div
          style={{ paddingLeft: `${depth * 16}px` }}
          className="cursor-pointer hover:bg-editor-toolbar transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="inline w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="inline w-4 h-4 text-gray-400" />
          )}
          <span className="text-gray-400">{name}: </span>
          <span className="text-gray-500">{'{'}{keys.length}{'}'}</span>
        </div>
        {expanded && (
          <div>
            {keys.map((key) => (
              <JsonNode key={key} data={data[key]} name={key} depth={depth + 1} path={`${path}.${key}`} onContextMenu={onContextMenu} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
