import { useState } from 'react';
import {
  Files,
  Search,
  Database,
  BarChart3,
  Tags,
  Clock,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';

type SidebarTab = 'files' | 'search' | 'database' | 'analysis' | 'groups' | 'timeline';

interface SidebarProps {
  activeTab?: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
  children?: React.ReactNode;
}

export function Sidebar({ activeTab = 'files', onTabChange, children }: SidebarProps) {
  const tabs = [
    { id: 'files' as SidebarTab, icon: Files, label: 'Files' },
    { id: 'search' as SidebarTab, icon: Search, label: 'Search' },
    { id: 'des' as SidebarTab, icon: Database, label: 'Dependencies' },
    { id: 'analysis' as SidebarTab, icon: BarChart3, label: 'Analysis' },
    { id: 'groups' as SidebarTab, icon: Tags, label: 'Groups' },
    { id: 'timeline' as SidebarTab, icon: Clock, label: 'Timeline' },
  ];

  return (
    <div className="flex h-full bg-editor-sidebar border-r border-editor-border">
      {/* Icon strip */}
      <div className="w-12 bg-editor-toolbar border-r border-editor-border flex flex-col items-center py-2 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded transition-colors',
                activeTab === tab.id
                  ? 'bg-editor-selection text-ide-blue'
                  : 'text-gray-400 hover:bg-editor-bg hover:text-gray-200'
              )}
              title={tab.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-10 border-b border-editor-border flex items-center px-3">
          <span className="text-sm font-medium text-gray-200">
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SidebarSection({
  title,
  defaultExpanded = true,
  children,
}: {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-editor-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-8 px-3 flex items-center gap-2 hover:bg-editor-bg transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-xs font-medium text-gray-300 uppercase">
          {title}
        </span>
      </button>
      {expanded && <div className="pb-2">{children}</div>}
    </div>
  );
}
