import { useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
  onClick?: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [submenuPos, setSubmenuPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled || item.separator) return;

    if (item.submenu) {
      if (submenuOpen === item.id) {
        setSubmenuOpen(null);
      } else {
        const itemElement = document.getElementById(`context-menu-item-${item.id}`);
        if (itemElement) {
          const rect = itemElement.getBoundingClientRect();
          setSubmenuPos({
            x: rect.right,
            y: rect.top,
          });
        }
        setSubmenuOpen(item.id);
      }
      return;
    }

    item.onClick?.();
    onClose();
  };

  const handleMouseEnter = (item: ContextMenuItem) => {
    if (item.submenu) {
      const itemElement = document.getElementById(`context-menu-item-${item.id}`);
      if (itemElement) {
        const rect = itemElement.getBoundingClientRect();
        setSubmenuPos({
          x: rect.right,
          y: rect.top,
        });
      }
      setSubmenuOpen(item.id);
    } else {
      setSubmenuOpen(null);
    }
  };

  const renderItems = (menuItems: ContextMenuItem[]) => {
    return menuItems.map((item) => {
      if (item.separator) {
        return (
          <div
            key={item.id}
            className="h-px bg-editor-border my-1"
          />
        );
      }

      return (
        <div
          key={item.id}
          id={`context-menu-item-${item.id}`}
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => handleMouseEnter(item)}
          className={`
            flex items-center justify-between px-3 py-1.5 text-sm transition-colors relative
            ${item.disabled
              ? 'text-gray-600 cursor-not-allowed'
              : item.danger
              ? 'text-ide-red hover:bg-editor-selection cursor-pointer'
              : 'text-gray-300 hover:bg-editor-selection cursor-pointer'
            }
          `}
        >
          <div className="flex items-center gap-2">
            {item.icon && (
              <span className="w-4 h-4 flex items-center justify-center">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </div>

          {item.submenu && (
            <svg
              className="w-4 h-4 ml-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}

          {item.shortcut && !item.submenu && (
            <span className="ml-4 text-xs text-gray-500">{item.shortcut}</span>
          )}
        </div>
      );
    });
  };

  return createPortal(
    <>
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[200px] bg-editor-toolbar border border-editor-border rounded shadow-lg overflow-hidden py-1"
        style={{ left: x, top: y }}
      >
        {renderItems(items)}
      </div>

      {submenuOpen && (
        <div
          className="fixed z-50 min-w-[200px] bg-editor-toolbar border border-editor-border rounded shadow-lg overflow-hidden py-1"
          style={{ left: submenuPos.x, top: submenuPos.y }}
        >
          {renderItems(
            items.find((item) => item.id === submenuOpen)?.submenu || []
          )}
        </div>
      )}
    </>,
    document.body
  );
}

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  const showContextMenu = (
    e: React.MouseEvent,
    items: ContextMenuItem[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items,
    });
  };

  const hideContextMenu = () => {
    setContextMenu(null);
  };

  const ContextMenuComponent = contextMenu ? (
    <ContextMenu
      x={contextMenu.x}
      y={contextMenu.y}
      items={contextMenu.items}
      onClose={hideContextMenu}
    />
  ) : null;

  return {
    showContextMenu,
    hideContextMenu,
    ContextMenuComponent,
  };
}
