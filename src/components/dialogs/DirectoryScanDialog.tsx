import {useCallback, useMemo, useState, useEffect} from 'react';
import {X, Folder, Check, Loader2, AlertCircle} from 'lucide-react';
import { FileInfo } from '../../types';
import {match} from "minimatch"
import {flattenPath} from "../../lib/utils.ts";

interface DirectoryScanDialogProps {
  scanning: boolean;
  scannedTree: FileInfo | null;
  onConfirm: (excludedPaths: Set<string>) => void;
  onCancel: () => void;
}

export function DirectoryScanDialog({
  scanning,
  scannedTree,
  onConfirm,
  onCancel,
}: DirectoryScanDialogProps) {
  const [patternExcludedPaths, setPatternExcludedPaths] = useState<Set<string>>(new Set());
  const [excludedPaths, setExcludedPaths] = useState<Set<string>>(new Set());

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && !scanning && scannedTree) {
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scanning, scannedTree, excludedPaths]);

  const getFlattenedPaths = useCallback(() => scannedTree ? flattenPath(scannedTree) : [], [scannedTree])

  const togglePath = (path: string) => {
    const newExcluded = new Set(excludedPaths);
    if (newExcluded.has(path)) {
      newExcluded.delete(path);
    } else {
      newExcluded.add(path);
    }
    setExcludedPaths(newExcluded);
  };

  const countFiles = (node: FileInfo): number => {
    if (node.type === 'file') return 1;
    if (!node.children) return 0;
    return node.children.reduce((acc, child) => acc + countFiles(child), 0);
  };
  console.log("scanned tree", scannedTree);
  const totalFiles = useMemo(() => scannedTree ? countFiles(scannedTree) : 0, [scannedTree]);
  const excludedCount = Array.from(excludedPaths).reduce((acc, path) => {
    // Find the node and count its files
    const node = findNodeByPath(scannedTree, path);
    return acc + (node ? countFiles(node) : 0);
  }, 0);

  const handleConfirm = () => {
    onConfirm(excludedPaths);
  };

  const [excludedEntries, setExcludedEntries] = useState<string[]>([]);
  const [currExclusion, setCurrExclusion] = useState<string>("");

  const addNewExclusion = () => {
      if (currExclusion.trim().length == 0) return;
      setExcludedEntries(e => [...e, currExclusion.trim()]);
      setCurrExclusion("")
  }

  const removeExclusion = (text: string) => {
      setExcludedEntries(e => e.filter(ex => ex != text));
  }

  const calculateGlobbedExclusions = () => {
      const allExcluded = new Set(excludedPaths);
      const paths = getFlattenedPaths();
      patternExcludedPaths.forEach(excluded => allExcluded.delete(excluded))
      const exclusions = excludedEntries.flatMap(pat => match(paths, pat, {platform: "linux", matchBase: true}))
      const patternExcluded = new Set(exclusions)
      console.log("Excluding:", patternExcluded)
      setPatternExcludedPaths(patternExcluded)
      exclusions.forEach(x => allExcluded.add(x))
      setExcludedPaths(allExcluded)
  }



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-editor-toolbar border border-editor-border rounded-lg w-[800px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-editor-border">
          <h2 className="text-lg font-medium text-gray-200">
            {scanning ? 'Scanning Directory...' : 'Review Directory Structure'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-editor-bg rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 scrollbar-thin">
          {scanning ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-12 h-12 text-ide-blue animate-spin" />
              <p className="text-gray-400">Scanning directory structure...</p>
              <p className="text-xs text-gray-500">This may take a moment for large directories</p>
            </div>
          ) : scannedTree ? (
            <div>
              <div className="mb-4 p-3 bg-editor-bg rounded border border-editor-border">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-ide-yellow flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 mb-1">
                      Review the directory structure and exclude any folders you don't want to index.
                    </p>
                    <p className="text-xs text-gray-500">
                      Excluding large directories can prevent performance issues.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between">
                  <div className={"flex flex-row space-x-1"}>
                      <div className="flex items-center gap-2 bg-editor-toolbar border border-editor-border rounded px-2 py-1.5">
                          {excludedEntries.map(exc => (<span className={"px-2 py-1 bg-ide-yellow text-ide-blue rounded text-xs transition-colors hover:bg-ide-red hover:cursor-crosshair"} onClick={() => removeExclusion(exc)}>
                          {exc}
                      </span> ))}
                          <input
                              onBlur={() => addNewExclusion()}
                              type="text"
                              value={currExclusion}
                              onChange={(e) => setCurrExclusion(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addNewExclusion()}
                              placeholder="Pattern"
                              className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
                          />
                          {excludedEntries.length != 0 && (
                              <button onClick={() => (setExcludedEntries([]), setCurrExclusion(''))} className="p-0.5 hover:bg-editor-bg rounded">
                                  <X className="w-3 h-3 text-gray-400" />
                              </button>
                          )}
                      </div>
                      <button onClick={calculateGlobbedExclusions} className={"px-4 py-2 bg-editor-bg text-gray-300 rounded text-sm hover:bg-editor-toolbar transition-colors"}>
                          Calculate
                      </button>
                  </div>
                <span className="text-sm text-gray-400">
                  Total: {totalFiles} files
                  {excludedCount > 0 && (
                    <span className="text-ide-yellow ml-2">
                      ({excludedCount} excluded)
                    </span>
                  )}
                </span>
              </div>

              <DirectoryTreeNode
                node={scannedTree}
                excludedPaths={excludedPaths}
                onToggle={togglePath}
                depth={0}
              />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!scanning && scannedTree && (
          <div className="p-4 border-t border-editor-border flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-editor-bg text-gray-300 rounded text-sm hover:bg-editor-toolbar transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-ide-blue text-white rounded text-sm hover:bg-opacity-80 transition-opacity flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Index {totalFiles - excludedCount} Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface DirectoryTreeNodeProps {
  node: FileInfo;
  excludedPaths: Set<string>;
  onToggle: (path: string) => void;
  depth: number;
}

function DirectoryTreeNode({ node, excludedPaths, onToggle, depth }: DirectoryTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const isExcluded = excludedPaths.has(node.path);
  const isDirectory = node.type === 'directory';

  if (!isDirectory) return null; // Only show directories in this view

  const fileCount = countFiles(node);

  return (
    <div className={isExcluded ? 'opacity-50' : ''}>
      <div
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-editor-bg rounded cursor-pointer group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
          <div className={"flex items-center gap-2 px-2 py-1.5 hover:bg-editor-bg rounded cursor-pointer group"} onClick={() => setExpanded(!expanded)}>
              <button
                  className="p-0.5 hover:bg-editor-toolbar rounded"
              >
                  {expanded ? (
                      <span className="text-gray-400">▼</span>
                  ) : (
                      <span className="text-gray-400">▶</span>
                  )}
              </button>

              <Folder className="w-4 h-4 text-ide-blue flex-shrink-0" />

              <span className="text-sm text-gray-300 flex-1 truncate">{node.name}</span>

              <span className="text-xs text-gray-500">{fileCount} files</span>
          </div>

        <button
          onClick={() => onToggle(node.path)}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            isExcluded
              ? 'bg-ide-red/20 text-ide-red hover:bg-ide-red/30'
              : 'bg-ide-green/20 text-ide-green hover:bg-ide-green/30'
          }`}
        >
          {isExcluded ? 'Excluded' : 'Included'}
        </button>
      </div>

      {expanded && node.children && (
        <div>
          {node.children
            .filter(child => child.type === 'directory')
            .map(child => (
              <DirectoryTreeNode
                key={child.id}
                node={child}
                excludedPaths={excludedPaths}
                onToggle={onToggle}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function findNodeByPath(node: FileInfo | null, path: string): FileInfo | null {
  if (!node) return null;
  if (node.path === path) return node;
  if (!node.children) return null;

  for (const child of node.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }
  return null;
}

function countFiles(node: FileInfo): number {
  if (node.type === 'file') return 1;
  if (!node.children) return 0;
  return node.children.reduce((acc, child) => acc + countFiles(child), 0);
}
