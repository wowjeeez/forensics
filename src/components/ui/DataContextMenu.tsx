import { useState, useEffect } from 'react';
import {
  Copy,
  Search,
  Key,
  Lock,
  Calendar,
  Braces,
  Layers,
  Sparkles,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import {
  base64Encode,
  base64Decode,
  hexEncode,
  hexDecode,
  urlEncode,
  urlDecode,
  copyToClipboard,
  detectEncoding,
  tryParseJSON,
  detectTimestamp,
} from '../../lib/dataUtils';

interface DataContextMenuProps {
  value: any;
  onClose: () => void;
  position: { x: number; y: number };
  onAddToGroup?: (value: string) => void;
  onGlobalSearch?: (value: string) => void;
  filePath?: string;
  structuralPath?: string;
  sourceType?: 'json' | 'sqlite' | 'csv' | 'xml' | 'hex' | 'text';
}

export function DataContextMenu({
  value,
  onClose,
  position,
  onAddToGroup,
  onGlobalSearch,
  filePath,
  structuralPath,
  sourceType,
}: DataContextMenuProps) {
  const [showEncodeMenu, setShowEncodeMenu] = useState(false);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  const stringValue = String(value);
  const isNull = value === null || value === undefined;
  const isEmpty = stringValue.trim() === '';

  useEffect(() => {
    // Load groups when menu opens
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const result = await invoke('list_groups');
      setGroups(result as any[]);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setGroups([]);
    }
  };

  const handleAddToGroup = async (groupId: string) => {
    if (!filePath || !structuralPath || !sourceType) {
      alert('Missing context information. This data cannot be added to a group.');
      return;
    }

    try {
      await invoke('add_element_to_group', {
        groupId,
        filePath,
        structuralPath,
        value: stringValue,
        sourceType,
        note: null,
      });

      if (onAddToGroup) {
        onAddToGroup(stringValue);
      }

      onClose();
    } catch (err) {
      console.error('Failed to add to group:', err);
      alert('Failed to add to group: ' + err);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(stringValue);
    onClose();
  };

  const handleCopyAsJSON = async () => {
    await copyToClipboard(JSON.stringify(value, null, 2));
    onClose();
  };

  const handleEncode = async (type: 'base64' | 'hex' | 'url') => {
    let encoded = '';
    switch (type) {
      case 'base64':
        encoded = base64Encode(stringValue);
        break;
      case 'hex':
        encoded = hexEncode(stringValue);
        break;
      case 'url':
        encoded = urlEncode(stringValue);
        break;
    }
    await copyToClipboard(encoded);
    onClose();
  };

  const handleDecode = async (type: 'base64' | 'hex' | 'url') => {
    let decoded = '';
    try {
      switch (type) {
        case 'base64':
          decoded = base64Decode(stringValue);
          break;
        case 'hex':
          decoded = hexDecode(stringValue);
          break;
        case 'url':
          decoded = urlDecode(stringValue);
          break;
      }
      await copyToClipboard(decoded);
    } catch (e) {
      alert('Failed to decode: ' + (e instanceof Error ? e.message : 'Invalid format'));
    }
    onClose();
  };

  const handleAnalyze = () => {
    const encoding = detectEncoding(stringValue);
    const jsonResult = tryParseJSON(stringValue);
    const timestamp = detectTimestamp(stringValue);

    setAnalysisResults({
      encoding,
      jsonResult,
      timestamp,
      length: stringValue.length,
      type: typeof value,
    });
    setShowAnalysisResults(true);
  };

  const handleGlobalSearch = () => {
    if (onGlobalSearch) {
      onGlobalSearch(stringValue);
    }
    onClose();
  };


  if (showAnalysisResults && analysisResults) {
    return (
      <div
        className="fixed bg-editor-toolbar border border-editor-border rounded-lg shadow-xl p-4 z-50 max-w-md"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ide-blue" />
              Data Analysis
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-editor-bg rounded p-2 border border-editor-border">
              <div className="text-gray-500 mb-1">Type: <span className="text-gray-300">{analysisResults.type}</span></div>
              <div className="text-gray-500">Length: <span className="text-gray-300">{analysisResults.length} characters</span></div>
            </div>

            {analysisResults.timestamp.isTimestamp && (
              <div className="bg-ide-blue bg-opacity-10 border border-ide-blue rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3 h-3 text-ide-blue" />
                  <span className="text-ide-blue font-semibold">Timestamp Detected</span>
                </div>
                <div className="text-gray-300">{analysisResults.timestamp.date?.toLocaleString()}</div>
                <div className="text-gray-500 text-[10px] mt-1">Format: {analysisResults.timestamp.format}</div>
              </div>
            )}

            {analysisResults.jsonResult.success && (
              <div className="bg-ide-green bg-opacity-10 border border-ide-green rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Braces className="w-3 h-3 text-ide-green" />
                  <span className="text-ide-green font-semibold">Valid JSON</span>
                </div>
                <pre className="text-gray-300 text-[10px] overflow-x-auto">
                  {JSON.stringify(analysisResults.jsonResult.data, null, 2)}
                </pre>
              </div>
            )}

            {analysisResults.encoding.length > 0 && (
              <div className="bg-ide-yellow bg-opacity-10 border border-ide-yellow rounded p-2">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-3 h-3 text-ide-yellow" />
                  <span className="text-ide-yellow font-semibold">Encoding Detected</span>
                </div>
                {analysisResults.encoding.map((enc: any, i: number) => (
                  <div key={i} className="mb-1">
                    <div className="text-gray-300">{enc.type}</div>
                    <div className="text-gray-500 text-[10px]">
                      {enc.description} ({(enc.confidence * 100).toFixed(0)}% confidence)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAnalysisResults(false)}
            className="w-full px-3 py-2 text-xs bg-ide-blue text-white rounded hover:bg-opacity-80 transition-opacity"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed bg-editor-toolbar border border-editor-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[200px]"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        {/* Copy actions */}
        <button
          onClick={handleCopy}
          className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection flex items-center gap-2"
          disabled={isNull}
        >
          <Copy className="w-3 h-3" />
          Copy Value
        </button>

        <button
          onClick={handleCopyAsJSON}
          className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection flex items-center gap-2"
          disabled={isNull}
        >
          <Braces className="w-3 h-3" />
          Copy as JSON
        </button>

        <div className="border-t border-editor-border my-1" />

        {/* Search actions */}
        {onGlobalSearch && (
          <button
            onClick={handleGlobalSearch}
            className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection flex items-center gap-2"
            disabled={isEmpty}
          >
            <Search className="w-3 h-3" />
            Search Globally
          </button>
        )}

        {/* Add to Group submenu */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowGroupMenu(true)}
            onMouseLeave={() => setShowGroupMenu(false)}
            className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection flex items-center justify-between"
            disabled={isEmpty || !filePath || !structuralPath || !sourceType}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3 h-3" />
              Add to Group
            </span>
            <span className="text-[10px]">›</span>
          </button>

          {showGroupMenu && !isEmpty && filePath && structuralPath && sourceType && (
            <div
              className="absolute left-full top-0 ml-1 bg-editor-toolbar border border-editor-border rounded-lg shadow-xl overflow-hidden min-w-[180px] max-h-60 overflow-y-auto"
              onMouseEnter={() => setShowGroupMenu(true)}
              onMouseLeave={() => setShowGroupMenu(false)}
            >
              {groups.length > 0 ? (
                groups.map((group: any) => (
                  <button
                    key={group.id}
                    onClick={() => handleAddToGroup(group.id)}
                    className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="truncate">{group.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-500">
                  No groups yet
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-editor-border my-1" />

        {/* Encode/Decode submenu */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowEncodeMenu(true)}
            onMouseLeave={() => setShowEncodeMenu(false)}
            className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection flex items-center justify-between"
            disabled={isEmpty}
          >
            <span className="flex items-center gap-2">
              <Key className="w-3 h-3" />
              Encode
            </span>
            <span className="text-[10px]">›</span>
          </button>

          {showEncodeMenu && !isEmpty && (
            <div
              className="absolute left-full top-0 ml-1 bg-editor-toolbar border border-editor-border rounded-lg shadow-xl overflow-hidden min-w-[150px]"
              onMouseEnter={() => setShowEncodeMenu(true)}
              onMouseLeave={() => setShowEncodeMenu(false)}
            >
              <button
                onClick={() => handleEncode('base64')}
                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection"
              >
                Base64 Encode
              </button>
              <button
                onClick={() => handleEncode('hex')}
                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection"
              >
                Hex Encode
              </button>
              <button
                onClick={() => handleEncode('url')}
                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection"
              >
                URL Encode
              </button>
              <div className="border-t border-editor-border my-1" />
              <button
                onClick={() => handleDecode('base64')}
                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection"
              >
                Base64 Decode
              </button>
              <button
                onClick={() => handleDecode('hex')}
                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection"
              >
                Hex Decode
              </button>
              <button
                onClick={() => handleDecode('url')}
                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection"
              >
                URL Decode
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-editor-border my-1" />

        {/* Analysis */}
        <button
          onClick={handleAnalyze}
          className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-editor-selection flex items-center gap-2"
          disabled={isEmpty}
        >
          <Sparkles className="w-3 h-3" />
          Analyze Data
        </button>
      </div>
    </>
  );
}
