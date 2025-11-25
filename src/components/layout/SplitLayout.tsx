import { EditorPane as EditorPaneComponent } from './EditorPane';
import { SplitLayout as SplitLayoutType, EditorPane } from '../../hooks/useFileSystemWithPanes';
import { PreviewFile, PreviewFileHandle } from '../viewers/PreviewFile';
import { useRef } from 'react';

interface SplitLayoutProps {
  layout: SplitLayoutType;
  onTabClick: (tabId: string, paneId: string) => void;
  onTabClose: (tabId: string, paneId: string) => void;
  onPaneClick: (paneId: string) => void;
  onSplitHorizontal: () => void;
  onSplitVertical: () => void;
  onClosePane: (paneId: string) => void;
  onMoveTab: (tabId: string, fromPaneId: string, toPaneId: string) => void;
}

export function SplitLayout({
  layout,
  onTabClick,
  onTabClose,
  onPaneClick,
  onSplitHorizontal,
  onSplitVertical,
  onClosePane,
  onMoveTab,
}: SplitLayoutProps) {
  const draggedTabRef = useRef<{ tabId: string; paneId: string } | null>(null);
  const previewRefs = useRef<Map<string, PreviewFileHandle>>(new Map());

  const handleTabDragStart = (tabId: string, paneId: string) => {
    draggedTabRef.current = { tabId, paneId };
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTabDrop = (e: React.DragEvent, targetPaneId: string) => {
    e.preventDefault();

    try {
      const data = e.dataTransfer.getData('text/plain');
      const { tabId, paneId } = JSON.parse(data);

      if (paneId !== targetPaneId) {
        onMoveTab(tabId, paneId, targetPaneId);
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }

    draggedTabRef.current = null;
  };

  const renderPane = (pane: EditorPane) => {
    const activeTab = pane.tabs.find((t) => t.id === pane.activeTabId);
    const isActive = layout.activePaneId === pane.id;

    return (
      <EditorPaneComponent
        key={pane.id}
        pane={pane}
        isActive={isActive}
        canSplit={layout.panes.length < 4}
        onTabClick={(tabId) => onTabClick(tabId, pane.id)}
        onTabClose={(tabId) => onTabClose(tabId, pane.id)}
        onTabDragStart={(tabId) => handleTabDragStart(tabId, pane.id)}
        onTabDragOver={handleTabDragOver}
        onTabDrop={(e) => handleTabDrop(e, pane.id)}
        onPaneClick={() => onPaneClick(pane.id)}
        onSplitHorizontal={layout.panes.length < 4 ? onSplitHorizontal : undefined}
        onSplitVertical={layout.panes.length < 4 ? onSplitVertical : undefined}
        onClosePane={layout.panes.length > 1 ? () => onClosePane(pane.id) : undefined}
      >
        {activeTab ? (
          <PreviewFile
            ref={(ref) => {
              if (ref) {
                previewRefs.current.set(pane.id, ref);
              } else {
                previewRefs.current.delete(pane.id);
              }
            }}
            path={activeTab.path}
            fileName={activeTab.name}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">No file open</p>
          </div>
        )}
      </EditorPaneComponent>
    );
  };

  if (layout.panes.length === 1) {
    return <div className="h-full">{renderPane(layout.panes[0])}</div>;
  }

  return (
    <div
      className={`h-full flex ${
        layout.direction === 'horizontal' ? 'flex-col' : 'flex-row'
      }`}
    >
      {layout.panes.map((pane, index) => (
        <div
          key={pane.id}
          className="flex-1"
          style={{
            [layout.direction === 'horizontal' ? 'minHeight' : 'minWidth']: '200px',
          }}
        >
          {renderPane(pane)}
          {index < layout.panes.length - 1 && (
            <div
              className={`
                ${layout.direction === 'horizontal' ? 'h-1 w-full' : 'w-1 h-full'}
                bg-editor-border hover:bg-ide-blue transition-colors cursor-${
                  layout.direction === 'horizontal' ? 'row' : 'col'
                }-resize
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
}
