import {
  FileSearch,
  Database,
  BarChart3,
  Settings,
  FolderOpen,
  Search
} from 'lucide-react';

interface ToolbarProps {
  onOpenFolder?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
}

export function Toolbar({ onOpenFolder, onSearch, onSettings }: ToolbarProps) {
  return (
    <div className="h-10 bg-editor-toolbar border-b border-editor-border flex items-center px-2 gap-1">
      <button
        onClick={onOpenFolder}
        className="p-1.5 hover:bg-editor-bg rounded transition-colors"
        title="Open Folder"
      >
        <FolderOpen className="w-4 h-4 text-gray-300" />
      </button>

      <div className="w-px h-6 bg-editor-border mx-1" />

      <button
        onClick={onSearch}
        className="p-1.5 hover:bg-editor-bg rounded transition-colors"
        title="Search"
      >
        <Search className="w-4 h-4 text-gray-300" />
      </button>

      <button
        className="p-1.5 hover:bg-editor-bg rounded transition-colors"
        title="File Analysis"
      >
        <FileSearch className="w-4 h-4 text-gray-300" />
      </button>

      <button
        className="p-1.5 hover:bg-editor-bg rounded transition-colors"
        title="Database Viewer"
      >
        <Database className="w-4 h-4 text-gray-300" />
      </button>

      <button
        className="p-1.5 hover:bg-editor-bg rounded transition-colors"
        title="Data Visualization"
      >
        <BarChart3 className="w-4 h-4 text-gray-300" />
      </button>

      <div className="flex-1" />

      <button
        onClick={onSettings}
        className="p-1.5 hover:bg-editor-bg rounded transition-colors"
        title="Settings"
      >
        <Settings className="w-4 h-4 text-gray-300" />
      </button>
    </div>
  );
}
