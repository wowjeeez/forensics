import { useState, useCallback } from 'react';
import { FileInfo, FileTab, FileType } from '../types';

export type SplitDirection = 'horizontal' | 'vertical' | null;

export interface EditorPane {
  id: string;
  tabs: FileTab[];
  activeTabId: string | undefined;
}

export interface SplitLayout {
  direction: SplitDirection;
  panes: EditorPane[];
  activePaneId: string;
}

export function useFileSystemWithPanes() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [layout, setLayout] = useState<SplitLayout>({
    direction: null,
    panes: [
      {
        id: 'pane-1',
        tabs: [],
        activeTabId: undefined,
      },
    ],
    activePaneId: 'pane-1',
  });

  const getFileType = (fileName: string): FileType => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
        return FileType.JSON;
      case 'csv':
        return FileType.CSV;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'bmp':
      case 'webp':
        return FileType.IMAGE;
      case 'db':
      case 'sqlite':
      case 'sqlite3':
        return FileType.DATABASE;
      case 'txt':
      case 'log':
      case 'md':
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx':
      case 'py':
      case 'html':
      case 'css':
      case 'xml':
      case 'yml':
      case 'yaml':
      case 'sh':
      case 'rs':
      case 'go':
      case 'java':
      case 'c':
      case 'cpp':
      case 'h':
        return FileType.TEXT;
      case 'bin':
      case 'exe':
      case 'dll':
      case 'so':
        return FileType.HEX;
      default:
        return FileType.UNKNOWN;
    }
  };

  const openFile = useCallback((node: FileInfo, paneId?: string) => {
    const targetPaneId = paneId || layout.activePaneId;

    setLayout((prev) => {
      const paneIndex = prev.panes.findIndex((p) => p.id === targetPaneId);
      if (paneIndex === -1) return prev;

      const pane = prev.panes[paneIndex];

      // Check if tab already exists in this pane
      const existingTab = pane.tabs.find((tab) => tab.path === node.path);
      if (existingTab) {
        const newPanes = [...prev.panes];
        newPanes[paneIndex] = {
          ...pane,
          activeTabId: existingTab.id,
        };
        return {
          ...prev,
          panes: newPanes,
          activePaneId: targetPaneId,
        };
      }

      // Create new tab
      const newTab: FileTab = {
        id: Math.random().toString(36).substr(2, 9),
        name: node.name,
        path: node.path,
        type: getFileType(node.name),
        content: node.path,
      };

      const newPanes = [...prev.panes];
      newPanes[paneIndex] = {
        ...pane,
        tabs: [...pane.tabs, newTab],
        activeTabId: newTab.id,
      };

      return {
        ...prev,
        panes: newPanes,
        activePaneId: targetPaneId,
      };
    });
  }, [layout.activePaneId]);

  const closeTab = useCallback((tabId: string, paneId: string) => {
    setLayout((prev) => {
      const paneIndex = prev.panes.findIndex((p) => p.id === paneId);
      if (paneIndex === -1) return prev;

      const pane = prev.panes[paneIndex];
      const newTabs = pane.tabs.filter((t) => t.id !== tabId);

      let newActiveTabId = pane.activeTabId;
      if (pane.activeTabId === tabId && newTabs.length > 0) {
        newActiveTabId = newTabs[newTabs.length - 1].id;
      } else if (newTabs.length === 0) {
        newActiveTabId = undefined;
      }

      const newPanes = [...prev.panes];
      newPanes[paneIndex] = {
        ...pane,
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };

      return {
        ...prev,
        panes: newPanes,
      };
    });
  }, []);

  const setActiveTab = useCallback((tabId: string, paneId: string) => {
    setLayout((prev) => {
      const paneIndex = prev.panes.findIndex((p) => p.id === paneId);
      if (paneIndex === -1) return prev;

      const newPanes = [...prev.panes];
      newPanes[paneIndex] = {
        ...newPanes[paneIndex],
        activeTabId: tabId,
      };

      return {
        ...prev,
        panes: newPanes,
        activePaneId: paneId,
      };
    });
  }, []);

  const splitPane = useCallback((direction: 'horizontal' | 'vertical') => {
    setLayout((prev) => {
      const newPaneId = `pane-${Date.now()}`;
      return {
        direction,
        panes: [
          ...prev.panes,
          {
            id: newPaneId,
            tabs: [],
            activeTabId: undefined,
          },
        ],
        activePaneId: newPaneId,
      };
    });
  }, []);

  const closePane = useCallback((paneId: string) => {
    setLayout((prev) => {
      if (prev.panes.length <= 1) return prev;

      const newPanes = prev.panes.filter((p) => p.id !== paneId);
      const newActivePaneId =
        prev.activePaneId === paneId ? newPanes[0].id : prev.activePaneId;

      return {
        ...prev,
        panes: newPanes,
        direction: newPanes.length === 1 ? null : prev.direction,
        activePaneId: newActivePaneId,
      };
    });
  }, []);

  const moveTabToPane = useCallback((tabId: string, fromPaneId: string, toPaneId: string) => {
    setLayout((prev) => {
      const fromPaneIndex = prev.panes.findIndex((p) => p.id === fromPaneId);
      const toPaneIndex = prev.panes.findIndex((p) => p.id === toPaneId);

      if (fromPaneIndex === -1 || toPaneIndex === -1) return prev;

      const fromPane = prev.panes[fromPaneIndex];
      const toPane = prev.panes[toPaneIndex];

      const tab = fromPane.tabs.find((t) => t.id === tabId);
      if (!tab) return prev;

      // Check if tab already exists in target pane
      const existingTab = toPane.tabs.find((t) => t.path === tab.path);
      if (existingTab) {
        // Just activate it and remove from source
        const newPanes = [...prev.panes];
        newPanes[fromPaneIndex] = {
          ...fromPane,
          tabs: fromPane.tabs.filter((t) => t.id !== tabId),
          activeTabId:
            fromPane.activeTabId === tabId
              ? fromPane.tabs[0]?.id
              : fromPane.activeTabId,
        };
        newPanes[toPaneIndex] = {
          ...toPane,
          activeTabId: existingTab.id,
        };
        return {
          ...prev,
          panes: newPanes,
          activePaneId: toPaneId,
        };
      }

      // Move tab to new pane
      const newPanes = [...prev.panes];
      newPanes[fromPaneIndex] = {
        ...fromPane,
        tabs: fromPane.tabs.filter((t) => t.id !== tabId),
        activeTabId:
          fromPane.activeTabId === tabId
            ? fromPane.tabs[0]?.id
            : fromPane.activeTabId,
      };
      newPanes[toPaneIndex] = {
        ...toPane,
        tabs: [...toPane.tabs, tab],
        activeTabId: tab.id,
      };

      return {
        ...prev,
        panes: newPanes,
        activePaneId: toPaneId,
      };
    });
  }, []);

  const setActivePane = useCallback((paneId: string) => {
    setLayout((prev) => ({
      ...prev,
      activePaneId: paneId,
    }));
  }, []);

  return {
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
  };
}
