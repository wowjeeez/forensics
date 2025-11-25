import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, FolderOpen, Search, Sparkles, Filter } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface Group {
  id: string;
  name: string;
  color: string;
  description?: string;
  elements: GroupElement[];
  createdAt: string;
  modifiedAt: string;
  tags: string[];
}

interface GroupElement {
  id: string;
  filePath: string;
  structuralPath: string;
  value: string;
  sourceType: string;
  note?: string;
  addedAt: string;
}

interface EnhancedSearchResult {
  groupId: string;
  groupName: string;
  groupColor: string;
  elementId: string;
  filePath: string;
  structuralPath: string;
  value: string;
  sourceType: string;
  matchType: 'elementvalue' | 'filecontent';
  snippet?: string;
  score: number;
}

export function GroupsPanel() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [useEnhancedSearch, setUseEnhancedSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<EnhancedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const result = await invoke<Group[]>('list_groups');
      setGroups(result);
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (useEnhancedSearch) {
        const results = await invoke<EnhancedSearchResult[]>('search_group_elements_enhanced', {
          query: searchTerm,
          limit: 100,
        });
        setSearchResults(results);
      } else {
        // Use basic search - filter groups locally
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (useEnhancedSearch) {
      const debounce = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, useEnhancedSearch]);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedGroupData = selectedGroup
    ? groups.find(g => g.id === selectedGroup)
    : null;

  return (
    <div className="h-full flex flex-col bg-editor-bg">
      {/* Header */}
      <div className="p-4 border-b border-editor-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-200">Groups</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 hover:bg-editor-toolbar rounded transition-colors"
            title="Create new group"
          >
            <Plus className="w-5 h-5 text-ide-blue" />
          </button>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={useEnhancedSearch ? "Search content with AI indexer..." : "Search groups..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-editor-toolbar border border-editor-border rounded text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-ide-blue"
            />
          </div>

          {/* Enhanced Search Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseEnhancedSearch(!useEnhancedSearch)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
                useEnhancedSearch
                  ? 'bg-ide-blue text-white'
                  : 'bg-editor-toolbar text-gray-400 hover:text-gray-300'
              }`}
              title="Use AI-powered indexer for deep content search"
            >
              <Sparkles className="w-3 h-3" />
              Enhanced Search
            </button>
            {isSearching && (
              <span className="text-xs text-gray-500">Searching...</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Groups List or Search Results */}
        <div className="w-64 border-r border-editor-border overflow-auto">
          {useEnhancedSearch && searchResults.length > 0 ? (
            /* Enhanced Search Results */
            <div className="p-2">
              <div className="text-xs text-gray-400 mb-2 px-2">
                {searchResults.length} results (score-ranked)
              </div>
              {searchResults.map((result, idx) => (
                <div
                  key={`${result.groupId}-${result.elementId}-${idx}`}
                  onClick={() => setSelectedGroup(result.groupId)}
                  className={`p-3 mb-2 border border-editor-border rounded hover:bg-editor-toolbar transition-colors cursor-pointer ${
                    selectedGroup === result.groupId ? 'bg-editor-selection' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: result.groupColor }}
                    />
                    <span className="text-xs font-medium text-gray-200 truncate">
                      {result.groupName}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {(result.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-1">
                    {result.matchType === 'filecontent' ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Content Match
                      </span>
                    ) : (
                      <span>Element Match</span>
                    )}
                  </div>

                  {result.snippet && (
                    <div className="text-xs text-gray-400 font-mono bg-editor-bg p-1.5 rounded mt-1 line-clamp-2">
                      {result.snippet}
                    </div>
                  )}

                  <div className="text-xs text-ide-cyan mt-1 truncate">
                    {result.structuralPath}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Regular Groups List */
            <>
              {filteredGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`w-full p-3 text-left border-b border-editor-border hover:bg-editor-toolbar transition-colors ${
                selectedGroup === group.id ? 'bg-editor-selection' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-sm font-medium text-gray-200 truncate">
                  {group.name}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {group.elements.length} item{group.elements.length !== 1 ? 's' : ''}
              </div>
              {group.description && (
                <div className="text-xs text-gray-600 truncate mt-1">
                  {group.description}
                </div>
              )}
            </button>
          ))}

              {filteredGroups.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                  {searchTerm ? 'No groups match your search' : 'No groups yet'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Group Details */}
        <div className="flex-1 overflow-auto">
          {selectedGroupData ? (
            <div className="p-4">
              {/* Group Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: selectedGroupData.color }}
                    />
                    <h3 className="text-xl font-semibold text-gray-200">
                      {selectedGroupData.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-editor-toolbar rounded transition-colors"
                      title="Edit group"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete group "${selectedGroupData.name}"?`)) {
                          try {
                            await invoke('delete_group', { groupId: selectedGroupData.id });
                            setSelectedGroup(null);
                            loadGroups();
                          } catch (err) {
                            console.error('Failed to delete group:', err);
                          }
                        }
                      }}
                      className="p-2 hover:bg-editor-toolbar rounded transition-colors"
                      title="Delete group"
                    >
                      <Trash2 className="w-4 h-4 text-ide-red" />
                    </button>
                  </div>
                </div>

                {selectedGroupData.description && (
                  <p className="text-sm text-gray-400">{selectedGroupData.description}</p>
                )}

                <div className="text-xs text-gray-600 mt-2">
                  Created: {new Date(selectedGroupData.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Elements */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  Elements ({selectedGroupData.elements.length})
                </h4>

                {selectedGroupData.elements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No elements in this group yet
                    <div className="text-xs mt-1">
                      Right-click on data in viewers to add elements
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedGroupData.elements.map((element) => (
                      <div
                        key={element.id}
                        className="p-3 bg-editor-toolbar border border-editor-border rounded hover:bg-editor-selection transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FolderOpen className="w-3 h-3 text-gray-500 flex-shrink-0" />
                              <span className="text-xs text-gray-400 truncate">
                                {element.filePath}
                              </span>
                            </div>
                            <div className="text-xs text-ide-cyan mb-1 font-mono">
                              {element.structuralPath}
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await invoke('remove_element_from_group', {
                                  groupId: selectedGroupData.id,
                                  elementId: element.id,
                                });
                                loadGroups();
                              } catch (err) {
                                console.error('Failed to remove element:', err);
                              }
                            }}
                            className="p-1 hover:bg-editor-bg rounded transition-colors flex-shrink-0"
                            title="Remove from group"
                          >
                            <Trash2 className="w-3 h-3 text-gray-500 hover:text-ide-red" />
                          </button>
                        </div>

                        <div className="text-sm text-gray-300 font-mono bg-editor-bg p-2 rounded mb-1 break-all">
                          {element.value.length > 200
                            ? element.value.substring(0, 200) + '...'
                            : element.value}
                        </div>

                        {element.note && (
                          <div className="text-xs text-gray-500 italic">{element.note}</div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-600 uppercase">
                            {element.sourceType}
                          </span>
                          <span className="text-xs text-gray-600">
                            {new Date(element.addedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Select a group to view details
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadGroups();
          }}
        />
      )}
    </div>
  );
}

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateGroupModal({ onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      await invoke('create_group', {
        name: name.trim(),
        color,
        description: description.trim() || null,
      });
      onCreated();
    } catch (err) {
      console.error('Failed to create group:', err);
      alert('Failed to create group: ' + err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-editor-toolbar border border-editor-border rounded-lg shadow-xl p-6 z-50 w-96">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Create New Group</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              className="w-full px-3 py-2 bg-editor-bg border border-editor-border rounded text-gray-300 focus:outline-none focus:border-ide-blue"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Color</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-editor-toolbar scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group for?"
              className="w-full px-3 py-2 bg-editor-bg border border-editor-border rounded text-gray-300 focus:outline-none focus:border-ide-blue resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm bg-ide-blue text-white rounded hover:bg-opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Group
          </button>
        </div>
      </div>
    </>
  );
}
