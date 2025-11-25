import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { MainLayout } from './components/layout/MainLayout';
import { FileTree } from './components/layout/FileTree';
import { SearchPanel } from './components/search/SearchPanel';
import { GroupManager } from './components/analysis/GroupManager';
import { Timeline } from './components/analysis/Timeline';
import { DirectoryScanDialog } from './components/dialogs/DirectoryScanDialog';
import { IndexingModal } from './components/dialogs/IndexingModal';
import { useFileSystemWithPanes } from './hooks/useFileSystemWithPanes';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { SplitLayout } from './components/layout/SplitLayoutEnhanced';
import { FileInfo, AnalysisGroup, IndexStats } from './types';
import {scanDirectory, createProjectDatabase, indexDirectory, createGroup, getGroups, deleteGroup} from './lib/tauri';

function App() {
  const {
    files,
    setFiles,
    layout,
    openFile,
    closeTab,
    setActiveTab,
    splitPane,
    closePane,
    moveTabToPane,
    setActivePane,
  } = useFileSystemWithPanes();
  const [sidebarTab, setSidebarTab] = useState<'files' | 'search' | 'database' | 'analysis' | 'groups' | 'timeline'>('files');
  const [groups, setGroups] = useState<AnalysisGroup[]>([]);

  // Get active pane and tab
  const activePane = layout.panes.find((p) => p.id === layout.activePaneId);
  const activeTabId = activePane?.activeTabId;

  // Directory scanning state
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedTree, setScannedTree] = useState<FileInfo | null>(null);
  const [evidencePath, setevidencePath] = useState<string | null>(null);

  // Database indexing state
  const [showIndexingModal, setShowIndexingModal] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  // Register keyboard shortcuts that only work when window is focused
  useKeyboardShortcuts([
    {
      key: 'w',
      meta: true,
      action: () => {
        console.log('Closing tab');
        if (activeTabId && activePane) {
          closeTab(activeTabId, activePane.id);
        }
      },
    },
    {
      key: 'o',
      meta: true,
      action: () => {
        console.log('Opening folder');
        handleOpenFolder();
      },
    },
    {
      key: '\\',
      meta: true,
      action: () => {
        console.log('Split vertically');
        splitPane('vertical');
      },
    },
    {
      key: '-',
      meta: true,
      action: () => {
        console.log('Split horizontally');
        splitPane('horizontal');
      },
    },
    {
      key: 'Tab',
      ctrl: true,
      action: () => {
        console.log('Next tab in pane');
        if (activePane && activePane.tabs.length > 0) {
          const currentIndex = activePane.tabs.findIndex(t => t.id === activeTabId);
          const nextIndex = (currentIndex + 1) % activePane.tabs.length;
          setActiveTab(activePane.tabs[nextIndex].id, activePane.id);
        }
      },
    },
    {
      key: 'Tab',
      ctrl: true,
      shift: true,
      action: () => {
        console.log('Previous tab in pane');
        if (activePane && activePane.tabs.length > 0) {
          const currentIndex = activePane.tabs.findIndex(t => t.id === activeTabId);
          const prevIndex = currentIndex === 0 ? activePane.tabs.length - 1 : currentIndex - 1;
          setActiveTab(activePane.tabs[prevIndex].id, activePane.id);
        }
      },
    },
    {
      key: '1',
      meta: true,
      action: () => {
        if (activePane && activePane.tabs.length >= 1) {
          setActiveTab(activePane.tabs[0].id, activePane.id);
        }
      },
    },
    {
      key: '2',
      meta: true,
      action: () => {
        if (activePane && activePane.tabs.length >= 2) {
          setActiveTab(activePane.tabs[1].id, activePane.id);
        }
      },
    },
    {
      key: '3',
      meta: true,
      action: () => {
        if (activePane && activePane.tabs.length >= 3) {
          setActiveTab(activePane.tabs[2].id, activePane.id);
        }
      },
    },
    {
      key: '4',
      meta: true,
      action: () => {
        if (activePane && activePane.tabs.length >= 4) {
          setActiveTab(activePane.tabs[3].id, activePane.id);
        }
      },
    },
    {
      key: '5',
      meta: true,
      action: () => {
        if (activePane && activePane.tabs.length >= 5) {
          setActiveTab(activePane.tabs[4].id, activePane.id);
        }
      },
    },
    {
      key: '6',
      meta: true,
      action: () => {
        if (activePane && activePane.tabs.length >= 6) {
          setActiveTab(activePane.tabs[5].id, activePane.id);
        }
      },
    },
    {
      key: '7',
      meta: true,
      action: () => {
        if (activePane && activePane.tabs.length >= 7) {
          setActiveTab(activePane.tabs[6].id, activePane.id);
        }
      },
    },
    {
      key: '8',
      meta: true,
      action: () => {
        if (activePane && activePane.tabs.length >= 8) {
          setActiveTab(activePane.tabs[7].id, activePane.id);
        }
      },
    },
    {
      key: '9',
      meta: true,
      action: () => {
        // Jump to last tab in active pane
        if (activePane && activePane.tabs.length > 0) {
          const lastTab = activePane.tabs[activePane.tabs.length - 1];
          setActiveTab(lastTab.id, activePane.id);
        }
      },
    },
  ])

  const mockTimelineEvents = [
    {
      id: '1',
      timestamp: new Date('2024-01-15T10:30:00'),
      title: 'File accessed',
      description: 'system.log was accessed',
      category: 'file',
    },
    {
      id: '2',
      timestamp: new Date('2024-01-15T11:00:00'),
      title: 'Database query executed',
      description: 'SELECT * FROM users',
      category: 'database',
    },
  ];

  const handleOpenFolder = async () => {
    try {
      // Open directory picker
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Directory',
      });

      if (!selected || typeof selected !== 'string') {
        return;
      }

      // Store evidence path for later database creation
      setevidencePath(selected);

      // Start scanning
      setShowScanDialog(true);
      setScanning(true);
      setScannedTree(null);

      // Scan directory with parallel processing
      const tree = await scanDirectory(selected, {
        maxDepth: undefined, // Scan all levels
        includeHidden: true,
        followSymlinks: false,
        parallel: true, // Enable parallel scanning for performance
      });

      console.log("Directory scanned successfully", tree)
      setScannedTree(tree);
      setScanning(false);
    } catch (error) {
      console.error('Error scanning directory:', error);
      setScanning(false);
      setShowScanDialog(false);
      alert(`Error scanning directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleConfirmScan = async (excludedPaths: Set<string>) => {
    if (!scannedTree || !evidencePath) return;

    try {
      // Filter out excluded paths from the tree
      const filteredTree = filterTree(scannedTree, excludedPaths);

      // Close scan dialog and show indexing modal
      setShowScanDialog(false);
      setShowIndexingModal(true);
      setIsIndexing(true);
      setIndexError(null);
      setIndexStats(null);

      // Create case database
      await createProjectDatabase(evidencePath);

      // Index the directory tree
      const stats = await indexDirectory(filteredTree);
      setIndexStats(stats);
      setIsIndexing(false);

      // Convert FileInfo to FileNode format and set as files
      setFiles(filteredTree.children || []);
      setScannedTree(null);
      const groups = await getGroups()
        console.log(groups)
        setGroups(groups ?? [])
    } catch (error) {
      console.error('Error indexing directory:', error);
      setIndexError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsIndexing(false);
    }
  };

  const handleCancelScan = () => {
    setShowScanDialog(false);
    setScannedTree(null);
    setScanning(false);
    setevidencePath(null);
  };

  const handleCloseIndexing = () => {
    setShowIndexingModal(false);
    setIndexStats(null);
    setIndexError(null);
  };

  const filterTree = (node: FileInfo, excludedPaths: Set<string>): FileInfo => {
    if (excludedPaths.has(node.path)) {
      // Return empty node if excluded
      return { ...node, children: [] };
    }

    if (!node.children) {
      return node;
    }

    return {
      ...node,
      children: node.children
        .filter(child => !excludedPaths.has(child.path))
        .map(child => filterTree(child, excludedPaths)),
    };
  };

  const handleCreateGroup = (name: string, color: string) => {
    const newGroup: AnalysisGroup = {
      name,
      color,
      content: [],
    };
    setGroups(prev => [...prev, newGroup]);
      createGroup(name, color).then(() => console.log("Group created"))
  };

  const handleDeleteGroup = (name: string, color: string) => {
    setGroups(prev => prev.filter(g => g.name !== name));
      deleteGroup(name, color).then(() => console.log("Group deleted"))


  };

  const renderSidebarContent = () => {
    switch (sidebarTab) {
      case 'files':
        return files.length > 0 ? (
          <FileTree nodes={files} onFileClick={openFile} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm p-4">
            <p className="text-center mb-4">No directory loaded</p>
            <button
              onClick={handleOpenFolder}
              className="px-4 py-2 bg-ide-blue text-white rounded hover:bg-opacity-80 transition-opacity"
            >
              Open Folder
            </button>
          </div>
        );
      case 'search':
        return <SearchPanel />;
      case 'groups':
        return (
          <GroupManager
            groups={groups}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        );
      case 'timeline':
        return <Timeline events={mockTimelineEvents} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            {sidebarTab.charAt(0).toUpperCase() + sidebarTab.slice(1)} view
          </div>
        );
    }
  };

  const renderMainContent = () => {
    const hasAnyTabs = layout.panes.some((p) => p.tabs.length > 0);

    if (!hasAnyTabs) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-400">Detective</h2>
            <p className="text-sm mb-6">
              Forensics Analysis & Data Visualization Tool
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-left">
              <div className="p-3 bg-editor-toolbar rounded border border-editor-border">
                <h3 className="font-medium text-gray-300 mb-2">File Analysis</h3>
                <p className="text-gray-500">
                  View and analyze various file types with specialized viewers
                </p>
              </div>
              <div className="p-3 bg-editor-toolbar rounded border border-editor-border">
                <h3 className="font-medium text-gray-300 mb-2">Search & Filter</h3>
                <p className="text-gray-500">
                  Powerful search capabilities with regex support
                </p>
              </div>
              <div className="p-3 bg-editor-toolbar rounded border border-editor-border">
                <h3 className="font-medium text-gray-300 mb-2">Data Visualization</h3>
                <p className="text-gray-500">
                  Charts, graphs, and timeline views for data analysis
                </p>
              </div>
              <div className="p-3 bg-editor-toolbar rounded border border-editor-border">
                <h3 className="font-medium text-gray-300 mb-2">Database Tools</h3>
                <p className="text-gray-500">
                  Query and explore database files
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <SplitLayout
        layout={layout}
        onTabClick={setActiveTab}
        onTabClose={closeTab}
        onPaneClick={setActivePane}
        onSplitHorizontal={() => splitPane('horizontal')}
        onSplitVertical={() => splitPane('vertical')}
        onClosePane={closePane}
        onMoveTab={moveTabToPane}
      />
    );
  };

  return (
    <>
      <MainLayout
        sidebarContent={renderSidebarContent()}
        sidebarTab={sidebarTab}
        onSidebarTabChange={setSidebarTab}
        tabs={[]}
        activeTabId={undefined}
        onTabClick={() => {}}
        onTabClose={() => {}}
        onOpenFolder={handleOpenFolder}
      >
        {renderMainContent()}
      </MainLayout>

      {showScanDialog && (
        <DirectoryScanDialog
          scanning={scanning}
          scannedTree={scannedTree}
          onConfirm={handleConfirmScan}
          onCancel={handleCancelScan}
        />
      )}

      {showIndexingModal && (
        <IndexingModal
          isIndexing={isIndexing}
          stats={indexStats}
          error={indexError}
          onClose={handleCloseIndexing}
        />
      )}
    </>
  );
}

export default App;
