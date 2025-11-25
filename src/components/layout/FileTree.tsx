import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Trash2,
  Eye,
  Hash,
  Info,
  FolderTree,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { FileInfo } from '../../types';
import { useContextMenu, ContextMenuItem } from '../ui/ContextMenu';
import { getFileIcon } from '../../lib/fileIcons';

interface FileTreeProps {
  nodes: FileInfo[];
  onFileClick?: (node: FileInfo) => void;
  selectedPath?: string;
}

export function FileTree({ nodes, onFileClick, selectedPath }: FileTreeProps) {
  const { showContextMenu, ContextMenuComponent } = useContextMenu();

  return (
    <>
      <div className="px-1 py-1">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            onFileClick={onFileClick}
            selectedPath={selectedPath}
            depth={0}
            onContextMenu={showContextMenu}
          />
        ))}
      </div>
      {ContextMenuComponent}
    </>
  );
}

interface TreeNodeProps {
  node: FileInfo;
  onFileClick?: (node: FileInfo) => void;
  selectedPath?: string;
  depth: number;
  onContextMenu: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
}

function TreeNode({ node, onFileClick, selectedPath, depth, onContextMenu }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const isDirectory = node.type === 'directory';
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (isDirectory) {
      setExpanded(!expanded);
        onFileClick?.(node);
    } else {
      onFileClick?.(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const menuItems: ContextMenuItem[] = isDirectory
      ? [
          {
            id: 'open',
            label: 'Open',
            icon: <Eye className="w-4 h-4" />,
            onClick: () => setExpanded(true),
          },
          {
            id: 'expand-all',
            label: 'Expand All',
            icon: <FolderTree className="w-4 h-4" />,
            onClick: () => console.log('Expand all', node.path),
          },
          { id: 'sep1', label: '', separator: true },
          {
            id: 'copy-path',
            label: 'Copy Path',
            icon: <Copy className="w-4 h-4" />,
            shortcut: '⌘C',
            onClick: () => navigator.clipboard.writeText(node.path),
          },
          {
            id: 'info',
            label: 'Properties',
            icon: <Info className="w-4 h-4" />,
            onClick: () => console.log('Show properties', node),
          },
        ]
      : [
          {
            id: 'open',
            label: 'Open',
            icon: <Eye className="w-4 h-4" />,
            onClick: () => onFileClick?.(node),
          },
          { id: 'sep1', label: '', separator: true },
          {
            id: 'copy-path',
            label: 'Copy Path',
            icon: <Copy className="w-4 h-4" />,
            shortcut: '⌘C',
            onClick: () => navigator.clipboard.writeText(node.path),
          },
          {
            id: 'copy-name',
            label: 'Copy Name',
            icon: <Copy className="w-4 h-4" />,
            onClick: () => navigator.clipboard.writeText(node.name),
          },
          { id: 'sep2', label: '', separator: true },
          {
            id: 'hash',
            label: 'Calculate Hash',
            icon: <Hash className="w-4 h-4" />,
            submenu: [
              {
                id: 'md5',
                label: 'MD5',
                onClick: () => console.log('Calculate MD5', node.path),
              },
              {
                id: 'sha256',
                label: 'SHA-256',
                onClick: () => console.log('Calculate SHA-256', node.path),
              },
              {
                id: 'sha512',
                label: 'SHA-512',
                onClick: () => console.log('Calculate SHA-512', node.path),
              },
            ],
          },
          {
            id: 'info',
            label: 'Properties',
            icon: <Info className="w-4 h-4" />,
            onClick: () => console.log('Show properties', node),
          },
          { id: 'sep3', label: '', separator: true },
          {
            id: 'delete',
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            danger: true,
            onClick: () => console.log('Delete', node.path),
          },
        ];

    onContextMenu(e, menuItems);
  };

  const iconInfo = getFileIcon(node.name, isDirectory, expanded);
  const Icon = iconInfo.icon;

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          'flex items-center gap-1 px-1 py-0.5 cursor-pointer rounded group hover:bg-editor-bg transition-colors',
          isSelected && 'bg-editor-selection'
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {isDirectory ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )
        ) : (
          <div className="w-4" />
        )}

        <Icon
          className={cn(
            'w-4 h-4 flex-shrink-0',
            iconInfo.color
          )}
        />

        <span className={cn(
          'text-sm truncate',
          isSelected ? 'text-gray-100' : 'text-gray-300'
        )}>
          {node.name}
        </span>

        {node.size !== undefined && !isDirectory && (
          <span className="text-xs text-gray-500 ml-auto">
            {formatFileSize(node.size)}
          </span>
        )}
      </div>

      {isDirectory && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onFileClick={onFileClick}
              selectedPath={selectedPath}
              depth={depth + 1}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
