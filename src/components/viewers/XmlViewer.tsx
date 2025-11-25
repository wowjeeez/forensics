import {useState, useMemo, useEffect} from 'react';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { DataContextMenu } from '../ui/DataContextMenu';

interface XmlViewerProps {
  data: string;
}

export function XmlViewer({ data }: XmlViewerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'formatted'>('tree');
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    value: any;
    position: { x: number; y: number };
  } | null>(null);
    const [xmlStructure, setXmlStructure] = useState<any>(null)
    useEffect(() => {
        fetch(data).then(r => r.text()).then(r => setXmlStructure(r))
    }, [data])


    const parsedXml = useMemo(() => {
        if (!xmlStructure) return new Document();
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStructure, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        setError(parserError.textContent || 'XML parsing error');
        return null;
      }

      setError(null);
      return xmlDoc;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse XML');
      return null;
    }
  }, [xmlStructure]);

  const formattedXml = useMemo(() => {
    if (!xmlStructure) return '';

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStructure, 'text/xml');
      const serializer = new XMLSerializer();
      let formatted = serializer.serializeToString(xmlDoc);

      // Simple formatting
      formatted = formatted.replace(/></g, '>\n<');

      // Indent
      const lines = formatted.split('\n');
      let indent = 0;
      const indented = lines.map(line => {
        const trimmed = line.trim();

        if (trimmed.startsWith('</')) {
          indent = Math.max(0, indent - 1);
        }

        const indentedLine = '  '.repeat(indent) + trimmed;

        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
          indent++;
        }

        return indentedLine;
      });

      return indented.join('\n');
    } catch (err) {
      return xmlStructure;
    }
  }, [xmlStructure]);

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(xmlStructure);
  };

  const handleContextMenu = (e: React.MouseEvent, value: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      value,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const renderDomNode = (node: Element, path: string = '', depth: number = 0): React.ReactElement | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (!text) return null;

      return (
        <div
          key={path}
          className="ml-6 text-ide-green text-sm font-mono cursor-pointer hover:bg-editor-toolbar"
          onContextMenu={(e) => handleContextMenu(e, text)}
        >
          "{text}"
        </div>
      );
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      return (
        <div key={path} className="ml-6 text-gray-500 text-sm font-mono">
          &lt;!-- {node.textContent} --&gt;
        </div>
      );
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const nodePath = `${path}/${node.nodeName}`;
    const isExpanded = expandedNodes.has(nodePath);
    const hasChildren = node.children.length > 0 || node.childNodes.length > 0;

    // Get attributes
    const attributes: Record<string, string> = {};
    if (node.attributes) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        attributes[attr.name] = attr.value;
      }
    }

    // Get text content (only direct text, not from children)
    let textContent = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) textContent = text;
      }
    }

    return (
      <div key={nodePath} className="select-text">
        <div
          className="flex items-start gap-2 py-0.5 hover:bg-editor-toolbar rounded px-2 cursor-pointer group"
          onClick={() => hasChildren && toggleNode(nodePath)}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            )
          ) : (
            <div className="w-4" />
          )}

          <div className="flex-1 text-sm font-mono">
            <span className="text-ide-purple">&lt;{node.nodeName}</span>
            {Object.entries(attributes).length > 0 && (
              <span>
                {Object.entries(attributes).map(([key, value]) => (
                  <span key={key}>
                    {' '}
                    <span className="text-ide-cyan">{key}</span>
                    <span className="text-gray-400">=</span>
                    <span
                      className="text-ide-orange cursor-pointer hover:bg-editor-selection"
                      onContextMenu={(e) => handleContextMenu(e, value)}
                    >
                      "{value}"
                    </span>
                  </span>
                ))}
              </span>
            )}
            {!hasChildren && textContent && (
              <>
                <span className="text-ide-purple">&gt;</span>
                <span
                  className="text-ide-green cursor-pointer hover:bg-editor-selection"
                  onContextMenu={(e) => handleContextMenu(e, textContent)}
                >
                  {textContent}
                </span>
                <span className="text-ide-purple">&lt;/{node.nodeName}&gt;</span>
              </>
            )}
            {!hasChildren && !textContent && (
              <span className="text-ide-purple">/&gt;</span>
            )}
            {hasChildren && <span className="text-ide-purple">&gt;</span>}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {Array.from(node.childNodes).map((child) => {
              if (child.nodeType === Node.ELEMENT_NODE) {
                const childElement = child as Element;
                const childPath = `${nodePath}/${childElement.nodeName}/${Math.random()}`;
                return renderDomNode(childElement, childPath, depth + 1);
              }
              return null;
            })}
            <div
              className="text-sm font-mono text-ide-purple px-2"
              style={{ marginLeft: `${depth * 16}px` }}
            >
              &lt;/{node.nodeName}&gt;
            </div>
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg">
        <div className="text-center max-w-md">
          <p className="text-ide-red mb-2">XML Parse Error</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <p className="text-xs text-gray-600">The file may not be valid XML or could be corrupted.</p>
        </div>
      </div>
    );
  }

  if (!parsedXml) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-editor-bg">
        <p className="text-gray-500">No XML data</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-editor-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-editor-border bg-editor-toolbar">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === 'tree'
                ? 'bg-ide-blue text-white'
                : 'bg-editor-bg text-gray-400 hover:text-gray-300'
            }`}
          >
            Tree View
          </button>
          <button
            onClick={() => setViewMode('formatted')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === 'formatted'
                ? 'bg-ide-blue text-white'
                : 'bg-editor-bg text-gray-400 hover:text-gray-300'
            }`}
          >
            Formatted
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandedNodes(new Set())}
            className="px-2 py-1 text-xs bg-editor-bg text-gray-400 hover:text-gray-300 rounded"
            title="Collapse All"
          >
            Collapse All
          </button>
          <button
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-editor-selection rounded transition-colors"
            title="Copy to Clipboard"
          >
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'tree' ? (
          <div className="font-mono text-sm">
            {parsedXml.documentElement && renderDomNode(parsedXml.documentElement)}
          </div>
        ) : (
          <pre className="font-mono text-sm text-gray-300 whitespace-pre">
            {formattedXml}
          </pre>
        )}
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
