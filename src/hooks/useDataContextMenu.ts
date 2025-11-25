import { useState } from 'react';

export interface ContextMenuState {
  value: any;
  position: { x: number; y: number };
}

export function useDataContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const openContextMenu = (e: React.MouseEvent, value: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      value,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
}
