import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FileTab } from '../../types';

interface TabBarProps {
  tabs: FileTab[];
  activeTabId?: string;
  onTabClick?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabClick, onTabClose }: TabBarProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="h-9 bg-editor-toolbar border-b border-editor-border flex items-center overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabClick?.(tab.id)}
          className={cn(
            'h-full px-3 flex items-center gap-2 cursor-pointer border-r border-editor-border relative group min-w-0',
            activeTabId === tab.id
              ? 'bg-editor-bg text-gray-200'
              : 'text-gray-400 hover:bg-editor-bg/50'
          )}
        >
          {activeTabId === tab.id && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-ide-blue" />
          )}

          <span className="text-sm truncate max-w-[150px]">
            {tab.name}
          </span>

          {tab.modified && (
            <div className="w-1.5 h-1.5 rounded-full bg-ide-blue" />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose?.(tab.id);
            }}
            className={cn(
              'p-0.5 rounded hover:bg-editor-toolbar transition-colors',
              activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
