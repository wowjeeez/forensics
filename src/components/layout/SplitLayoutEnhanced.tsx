import { EditorPane as EditorPaneComponent } from './EditorPane';
import { SplitLayout as SplitLayoutType, EditorPane } from '../../hooks/useFileSystemWithPanes';
import { PreviewFile } from '../viewers/PreviewFile';
import { useRef, useState } from 'react';

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

type DropZone = 'left' | 'right' | 'top' | 'bottom' | 'center' | null;

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
  const [dropZone, setDropZone] = useState<{ paneId: string; zone: DropZone } | null>(null);
  const paneRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleTabDragStart = (tabId: string, paneId: string) => {
    draggedTabRef.current = { tabId, paneId };
  };

  const calculateDropZone = (e: React.DragEvent, paneElement: HTMLDivElement): DropZone => {
    const rect = paneElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const edgeThreshold = Math.min(width, height) * 0.25; // 25% edge zone
    const centerThreshold = 0.4; // 40% center zone

    // Check edges first
    if (x < edgeThreshold) return 'left';
    if (x > width - edgeThreshold) return 'right';
    if (y < edgeThreshold) return 'top';
    if (y > height - edgeThreshold) return 'bottom';

    // Center zone
    const centerX = Math.abs(x - width / 2) / (width / 2);
    const centerY = Math.abs(y - height / 2) / (height / 2);
    if (centerX < centerThreshold && centerY < centerThreshold) {
      return 'center';
    }

    // Default to closest edge
    const distances = {
      left: x,
      right: width - x,
      top: y,
      bottom: height - y,
    };

    type EdgeKey = keyof typeof distances;
    return Object.entries(distances).reduce((a, b) =>
      (distances[a[0] as EdgeKey] < distances[b[0] as EdgeKey] ? a : b)
    )[0] as DropZone;
  };

  const handlePaneDragOver = (e: React.DragEvent, paneId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const paneElement = paneRefs.current.get(paneId);
    if (!paneElement) return;

    const zone = calculateDropZone(e, paneElement);
    setDropZone({ paneId, zone });
  };

  const handlePaneDragLeave = () => {
    setDropZone(null);
  };

  const handlePaneDrop = (e: React.DragEvent, targetPaneId: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = e.dataTransfer.getData('text/plain');
      const { tabId, paneId: sourcePaneId } = JSON.parse(data);

      if (!dropZone) {
        // Simple move to center
        if (sourcePaneId !== targetPaneId) {
          onMoveTab(tabId, sourcePaneId, targetPaneId);
        }
        return;
      }

      const { zone } = dropZone;

      if (zone === 'center') {
        // Move to existing pane
        if (sourcePaneId !== targetPaneId) {
          onMoveTab(tabId, sourcePaneId, targetPaneId);
        }
      } else if (layout.panes.length < 4) {
        // Create new split
        if (zone === 'left' || zone === 'right') {
          onSplitVertical();
          // Move tab to new pane after it's created
          setTimeout(() => {
            const newPane = layout.panes[layout.panes.length - 1];
            onMoveTab(tabId, sourcePaneId, newPane.id);
          }, 0);
        } else if (zone === 'top' || zone === 'bottom') {
          onSplitHorizontal();
          setTimeout(() => {
            const newPane = layout.panes[layout.panes.length - 1];
            onMoveTab(tabId, sourcePaneId, newPane.id);
          }, 0);
        }
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    } finally {
      draggedTabRef.current = null;
      setDropZone(null);
    }
  };

  const renderDropZoneOverlay = (paneId: string) => {
    if (!dropZone || dropZone.paneId !== paneId) return null;

    const { zone } = dropZone;
    if (!zone) return null;

    const getOverlayStyles = (): string => {
      const base = 'absolute bg-ide-blue/30 border-2 border-ide-blue transition-all duration-150 pointer-events-none';
      switch (zone) {
        case 'left':
          return `${base} top-0 left-0 bottom-0 w-1/2`;
        case 'right':
          return `${base} top-0 right-0 bottom-0 w-1/2`;
        case 'top':
          return `${base} top-0 left-0 right-0 h-1/2`;
        case 'bottom':
          return `${base} bottom-0 left-0 right-0 h-1/2`;
        case 'center':
          return `${base} inset-4`;
        default:
          return base;
      }
    };

    return (
      <div className={getOverlayStyles()}>
        <div className="flex items-center justify-center h-full text-white font-medium text-sm">
          {zone === 'center' ? 'Add to this pane' : `Split ${zone}`}
        </div>
      </div>
    );
  };

  const renderPane = (pane: EditorPane) => {
    const activeTab = pane.tabs.find((t) => t.id === pane.activeTabId);
    const isActive = layout.activePaneId === pane.id;

    return (
      <div
        key={pane.id}
        ref={(el) => {
          if (el) {
            paneRefs.current.set(pane.id, el);
          } else {
            paneRefs.current.delete(pane.id);
          }
        }}
        className="relative h-full"
        onDragOver={(e) => handlePaneDragOver(e, pane.id)}
        onDragLeave={handlePaneDragLeave}
        onDrop={(e) => handlePaneDrop(e, pane.id)}
      >
        <EditorPaneComponent
          pane={pane}
          isActive={isActive}
          canSplit={layout.panes.length < 4}
          onTabClick={(tabId) => onTabClick(tabId, pane.id)}
          onTabClose={(tabId) => onTabClose(tabId, pane.id)}
          onTabDragStart={(tabId) => handleTabDragStart(tabId, pane.id)}
          onTabDragOver={() => {}}
          onTabDrop={() => {}}
          onPaneClick={() => onPaneClick(pane.id)}
          onSplitHorizontal={layout.panes.length < 4 ? onSplitHorizontal : undefined}
          onSplitVertical={layout.panes.length < 4 ? onSplitVertical : undefined}
          onClosePane={layout.panes.length > 1 ? () => onClosePane(pane.id) : undefined}
        >
          {activeTab ? (
            <PreviewFile path={activeTab.path} fileName={activeTab.name} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-sm mb-2">No file open</p>
                <p className="text-xs text-gray-600">
                  Drag a tab here or open a file
                </p>
              </div>
            </div>
          )}
        </EditorPaneComponent>

        {renderDropZoneOverlay(pane.id)}
      </div>
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
          className="flex-1 relative"
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
