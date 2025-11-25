import { useState } from 'react';
import { Plus, X, ChevronRight, ChevronDown } from 'lucide-react';
import { AnalysisGroup } from '../../types';

interface GroupManagerProps {
  groups?: AnalysisGroup[];
  onCreateGroup?: (name: string, color: string) => void;
  onDeleteGroup?: (groupId: string, color: string) => void;
  onRemoveFromGroup?: (groupId: string, item: [string, string]) => void;
}

const COLORS = [
  { name: 'Blue', value: '#589DF6' },
  { name: 'Green', value: '#6AAF50' },
  { name: 'Yellow', value: '#FFC66D' },
  { name: 'Orange', value: '#CC7832' },
  { name: 'Red', value: '#E06C75' },
  { name: 'Purple', value: '#9876AA' },
  { name: 'Cyan', value: '#56B6C2' },
];

export function GroupManager({
  groups = [],
  onCreateGroup,
  onDeleteGroup,
  onRemoveFromGroup,
}: GroupManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !onCreateGroup) return;

    onCreateGroup(newGroupName, selectedColor);
    setNewGroupName('');
    setIsCreating(false);
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-editor-border flex items-center justify-between px-3">
        <span className="text-sm text-gray-300">Groups</span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-editor-bg rounded transition-colors"
          title="New Group"
        >
          <Plus className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-thin p-2">
        {/* Create new group form */}
        {isCreating && (
          <div className="mb-3 p-3 bg-editor-toolbar border border-editor-border rounded">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full mb-2 px-2 py-1 bg-editor-bg border border-editor-border rounded text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-ide-blue"
              autoFocus
            />

            <div className="flex gap-2 mb-3">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-6 h-6 rounded border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-white scale-110'
                      : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateGroup}
                className="flex-1 px-3 py-1 bg-ide-blue text-white rounded text-sm hover:bg-opacity-80 transition-opacity"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewGroupName('');
                }}
                className="px-3 py-1 bg-editor-bg text-gray-400 rounded text-sm hover:bg-editor-toolbar transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Groups list */}
        {groups.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No groups created
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.name}
                className="bg-editor-toolbar border border-editor-border rounded overflow-hidden"
              >
                <div
                  onClick={() => toggleGroup(group.name)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-editor-bg transition-colors"
                >
                  {expandedGroups.has(group.name) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}

                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: group.color }}
                  />

                  <span className="text-sm text-gray-300 flex-1">{group.name}</span>

                  <span className="text-xs text-gray-500">{group.content.length}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGroup?.(group.name, group.color);
                    }}
                    className="p-1 hover:bg-editor-toolbar rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>

                {expandedGroups.has(group.name) && (
                  <div className="px-3 pb-2 space-y-1">
                    {group.content.length === 0 ? (
                      <div className="text-xs text-gray-500 py-2">No items</div>
                    ) : (
                      group.content.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-2 py-1 bg-editor-bg rounded group"
                        >
                          <span className="text-sm text-gray-400 truncate flex-1">
                            {item}
                          </span>
                          <button
                            onClick={() => onRemoveFromGroup?.(group.name, item)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-editor-toolbar rounded transition-all"
                          >
                            <X className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
