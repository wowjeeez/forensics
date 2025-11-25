import { useState } from 'react';
import { X, GripVertical, SplitSquareHorizontal, SplitSquareVertical } from 'lucide-react';
import { EditorPane as EditorPaneType } from '../../hooks/useFileSystemWithPanes';

interface EditorPaneProps {
  pane: EditorPaneType;
  isActive: boolean;
  canSplit: boolean;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabDragStart: (tabId: string) => void;
  onTabDragOver: (e: React.DragEvent) => void;
  onTabDrop: (e: React.DragEvent) => void;
  onPaneClick: () => void;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
  onClosePane?: () => void;
  children: React.ReactNode;
}

export function EditorPane({
  pane,
  isActive,
  canSplit,
  onTabClick,
  onTabClose,
  onTabDragStart,
  onTabDragOver,
  onTabDrop,
  onPaneClick,
  onSplitHorizontal,
  onSplitVertical,
  onClosePane,
  children,
}: EditorPaneProps) {
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ tabId, paneId: pane.id }));

    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    onTabDragStart(tabId);
  };

  const handleTabDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTabId(tabId);
  };

  const handleTabDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverTabId(null);
  };

  const handleTabDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTabId(null);
    onTabDrop(e);
  };

  const handlePaneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    onTabDragOver(e);
  };

  return (
    <div
      className={`flex flex-col h-full ${
        isActive ? 'ring-2 ring-ide-blue' : 'ring-1 ring-editor-border'
      }`}
      onClick={onPaneClick}
      onDragOver={handlePaneDragOver}
      onDrop={handleTabDrop}
    >
      {/* Tab Bar */}
      <div className="flex items-center bg-editor-toolbar border-b border-editor-border">
        {/* Tabs */}
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin">
          {pane.tabs.map((tab) => (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleTabDragStart(e, tab.id)}
              onDragOver={(e) => handleTabDragOver(e, tab.id)}
              onDragLeave={handleTabDragLeave}
              onDrop={handleTabDrop}
              className={`
                group flex items-center gap-2 px-3 py-2 border-r border-editor-border
                cursor-move select-none relative transition-all duration-150
                ${pane.activeTabId === tab.id ? 'bg-editor-bg text-gray-200' : 'text-gray-400 hover:bg-editor-bg/50'}
                ${dragOverTabId === tab.id ? 'bg-ide-blue/30 scale-105 shadow-lg' : ''}
              `}
              onClick={(e) => {
                e.stopPropagation();
                onTabClick(tab.id);
              }}
            >
              <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              <span className="text-sm truncate max-w-[150px]">{tab.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="p-0.5 hover:bg-editor-selection rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Pane Controls */}
        <div className="flex items-center gap-1 px-2 border-l border-editor-border">
          {canSplit && onSplitHorizontal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSplitHorizontal();
              }}
              className="p-1.5 hover:bg-editor-selection rounded transition-colors"
              title="Split Horizontally"
            >
              <SplitSquareHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {canSplit && onSplitVertical && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSplitVertical();
              }}
              className="p-1.5 hover:bg-editor-selection rounded transition-colors"
              title="Split Vertically"
            >
              <SplitSquareVertical className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {onClosePane && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClosePane();
              }}
              className="p-1.5 hover:bg-ide-red/20 rounded transition-colors"
              title="Close Pane"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-ide-red" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
