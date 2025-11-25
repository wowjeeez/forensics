import {FileTab} from "../../types";

interface StatusBarProps {
  message?: string;
  fileCount?: number;
  selectedFile?: FileTab;
}

export function StatusBar({ message, fileCount = 0, selectedFile }: StatusBarProps) {
  return (
    <div className="h-6 bg-editor-toolbar border-t border-editor-border flex items-center px-2 text-xs text-gray-400">
      <div className="flex items-center gap-4">
        {message && (
          <span className="text-gray-300">{message}</span>
        )}
        {selectedFile && (
          <>
            <div className="w-px h-4 bg-editor-border" />
            <span>{selectedFile.path}</span>
              <span>(loader: {selectedFile.type})</span>
          </>
        )}
        {fileCount > 0 && (
          <>
            <div className="w-px h-4 bg-editor-border" />
            <span>{fileCount} files</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <span>UTF-8</span>
        <div className="w-px h-4 bg-editor-border" />
        <span>LF</span>
      </div>
    </div>
  );
}
