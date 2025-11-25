import { useState } from 'react';
import { FileInfo, FileTab, FileType } from '../types';

export function useFileSystem() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | undefined>();

  const openFile = (node: FileInfo) => {
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.path === node.path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    // Create new tab
    const newTab: FileTab = {
      id: Math.random().toString(36).substr(2, 9),
      name: node.name,
      path: node.path,
      type: getFileType(node.name),
      content: node.path, // Store the path for lazy loading
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(undefined);
      }
      return newTabs;
    });
  };

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

  return {
    files,
    setFiles,
    tabs,
    activeTabId,
    setActiveTabId,
    openFile,
    closeTab,
  };
}
