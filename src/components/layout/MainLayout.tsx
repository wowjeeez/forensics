import { useState, ReactNode } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Toolbar } from './Toolbar';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { FileTab } from '../../types';

type SidebarTab = 'files' | 'search' | 'database' | 'analysis' | 'groups' | 'timeline';

interface MainLayoutProps {
  sidebarContent?: ReactNode;
  children?: ReactNode;
  sidebarTab?: SidebarTab;
  onSidebarTabChange?: (tab: SidebarTab) => void;
  tabs?: FileTab[];
  activeTabId?: string;
  onTabClick?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onOpenFolder?: () => void;
}

export function MainLayout({
  sidebarContent,
  children,
  sidebarTab = 'files',
  onSidebarTabChange,
  tabs = [],
  activeTabId,
  onTabClick,
  onTabClose,
  onOpenFolder,
}: MainLayoutProps) {
  const [statusMessage, setStatusMessage] = useState('Ready');

  const handleOpenFolder = () => {
    setStatusMessage('Opening folder...');
    onOpenFolder?.();
  };

  const handleSearch = () => {
    onSidebarTabChange?.('search');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar
        onOpenFolder={handleOpenFolder}
        onSearch={handleSearch}
      />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <Sidebar activeTab={sidebarTab} onTabChange={onSidebarTabChange}>
              {sidebarContent}
            </Sidebar>
          </Panel>

          <PanelResizeHandle className="w-1 bg-editor-border hover:bg-ide-blue transition-colors" />

          <Panel defaultSize={80}>
            <div className="flex flex-col h-full">
              <TabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onTabClick={onTabClick}
                onTabClose={onTabClose}
              />
              <div className="flex-1 overflow-auto bg-editor-bg">
                {children || (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-lg mb-2">No file open</p>
                      <p className="text-sm">Open a folder to start analyzing files</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <StatusBar
        message={statusMessage}
        fileCount={tabs.length}
        selectedFile={tabs.find(t => t.id === activeTabId)}
      />
    </div>
  );
}
