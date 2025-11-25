import {useEffect, useMemo, useState} from 'react';
import { CodeEditor } from '../editor/CodeEditor';
import { HexViewer } from './HexViewer';
import { ImageViewer } from './ImageViewer';
import { JsonViewer } from './JsonViewer';
import { CsvViewer } from './CsvViewer';
import { PdfViewer } from './PdfViewer';
import { OfficeViewer } from './OfficeViewer';
import { DatabaseDirectoryViewer } from './DatabaseDirectoryViewer';
import { SqliteViewer } from './SqliteViewer';
import { LevelDbViewer } from './LevelDbViewer';
import { IndexedDbViewer } from './IndexedDbViewer';
import { XmlViewer } from './XmlViewer';
import { FileType as FileTypeIcon } from 'lucide-react';
import {convertFileSrc, invoke} from "@tauri-apps/api/core";
import { normalizePath, pathToFileUrl, getFileExtension } from '../../lib/pathUtils';

interface PreviewFileProps {
  path: string;
  fileName: string;
}

type ViewerType = 'auto' | 'text' | 'hex' | 'json' | 'xml' | 'csv' | 'image' | 'pdf' | 'code' | 'sqlite' | 'leveldb' | 'indexeddb';

export function PreviewFile({ path, fileName }: PreviewFileProps) {
    const [error, setError] = useState<string | null>(null);
    const [dbDirType, setDbDirType] = useState<'leveldb' | 'indexeddb' | 'sqlite' | null>(null);
    const [viewerOverride, setViewerOverride] = useState<ViewerType>('auto');
    const [showViewerMenu, setShowViewerMenu] = useState(false);
    const viewerOptions: { value: ViewerType; label: string }[] = [
        {value: 'auto', label: 'Auto Detect'},
        {value: 'text', label: 'Plain Text'},
        {value: 'code', label: 'Code Editor'},
        {value: 'hex', label: 'Hex Viewer'},
        {value: 'json', label: 'JSON Viewer'},
        {value: 'xml', label: 'XML Viewer'},
        {value: 'csv', label: 'CSV Viewer'},
        {value: 'image', label: 'Image Viewer'},
        {value: 'pdf', label: 'PDF Viewer'},
        {value: 'sqlite', label: 'SQLite Database'},
        {value: 'leveldb', label: 'LevelDB Database'},
        {value: 'indexeddb', label: 'IndexedDB Database'},
    ];

    // Normalize the path for consistent handling
    const normalizedPath = useMemo(() => normalizePath(path), [path]);

    // Convert to URL for use with convertFileSrc (for images, PDFs, etc.)
    const url = useMemo(() => {
        console.log(path)
        return convertFileSrc(path);
    }, [path]);

    // Get file extension using utility
    const ext = useMemo(() => getFileExtension(normalizedPath), [normalizedPath]);

    useEffect(() => {
        // Reset state when file changes
        setDbDirType(null);
        setError(null);
        setViewerOverride('auto');
        loadFile();
    }, [path, fileName]);

    const loadFile = async () => {
        try {
            setError(null);

            // Check if it's a directory (use normalized path)
            const isDir = await invoke<boolean>('is_dir', {path: normalizedPath});

            if (isDir) {
                // Check for LevelDB directory
                if (fileName.toLowerCase().includes('leveldb')) {
                    setDbDirType('leveldb');
                    return;
                }

                // Check for IndexedDB directory
                if (fileName.toLowerCase().includes('indexeddb')) {
                    setDbDirType('indexeddb');
                    return;
                }

                // Check directory contents for database indicators
                try {
                    interface FileInfo {
                        name: string;
                        type: 'file' | 'directory';
                    }

                    const contents = await invoke<FileInfo[]>('list_directory', {path: normalizedPath});

                    // Check for LevelDB files
                    const hasLevelDbFiles = contents.some(file =>
                        file.name === 'CURRENT' ||
                        file.name === 'LOCK' ||
                        file.name.startsWith('MANIFEST') ||
                        file.name.endsWith('.ldb')
                    );
                    if (hasLevelDbFiles) {
                        setDbDirType('leveldb');
                        return;
                    }

                    // Check for IndexedDB structure
                    const hasIndexedDbStructure = contents.some(file =>
                        file.name.endsWith('.indexeddb') ||
                        file.name === 'blob_storage'
                    );
                    if (hasIndexedDbStructure) {
                        setDbDirType('indexeddb');
                        return;
                    }
                } catch (e) {
                    console.error('Error checking directory contents:', e);
                }
            } else {
                // It's a file - check for database file types

                // Check for SQLite files
                if (['db', 'sqlite', 'sqlite3'].includes(ext) ||
                    fileName.toLowerCase().includes('sqlite')) {
                    setDbDirType('sqlite');
                    return;
                }

                // Check for LevelDB data files
                if (ext === 'ldb' || fileName === 'CURRENT' || fileName === 'LOCK' || fileName.startsWith('MANIFEST')) {
                    setDbDirType('leveldb');
                    return;
                }
            }
        } catch (err) {
            console.error('Error parsing file:', err);
            setError(err instanceof Error ? err.message : 'Failed to parse file');
        } finally {
        }
    };
    const openAs = () => (<div
        className="flex items-center gap-2 px-3 py-2 border-b border-editor-border bg-editor-toolbar">
        <FileTypeIcon className="w-4 h-4 text-gray-400"/>
        <span className="text-xs text-gray-400">Open as:</span>
        <div className="relative">
            <button
                onClick={() => setShowViewerMenu(!showViewerMenu)}
                className="px-3 py-1 text-xs bg-editor-bg border border-editor-border rounded text-gray-300 hover:bg-editor-selection transition-colors min-w-[120px] text-left flex items-center justify-between"
            >
                <span>{viewerOptions.find(v => v.value === viewerOverride)?.label}</span>
                <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
            </button>

            {showViewerMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowViewerMenu(false)}
                    />
                    <div
                        className="absolute top-full left-0 mt-1 bg-editor-toolbar border border-editor-border rounded shadow-lg overflow-hidden z-20 min-w-[180px]">
                        {viewerOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setViewerOverride(option.value);
                                    setShowViewerMenu(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                                    viewerOverride === option.value
                                        ? 'bg-ide-blue text-white'
                                        : 'text-gray-300 hover:bg-editor-selection'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>

        {viewerOverride !== 'auto' && (
            <button
                onClick={() => setViewerOverride('auto')}
                className="ml-2 px-2 py-1 text-xs bg-editor-bg text-gray-400 hover:text-gray-300 rounded"
            >
                Reset
            </button>
        )}

        <div className="flex-1"/>

        <span className="text-xs text-gray-500">{fileName}</span>
    </div>)

    // Show appropriate database viewer if auto-detected or manually selected
    // Pass normalized path to ensure proper handling
    if (viewerOverride === 'sqlite' || (viewerOverride === 'auto' && dbDirType === 'sqlite')) {
        return <>
            {openAs()}
            <SqliteViewer path={normalizedPath}/>
        </>;
    }

    if (viewerOverride === 'leveldb' || (viewerOverride === 'auto' && dbDirType === 'leveldb')) {
        return <>
            {openAs()}
            <LevelDbViewer path={normalizedPath}/>
        </>;
    }

    if (viewerOverride === 'indexeddb' || (viewerOverride === 'auto' && dbDirType === 'indexeddb')) {
        return <>{openAs()}
            <IndexedDbViewer path={normalizedPath}/>
        </>

        // Fallback to directory viewer for other database types (only when auto-detected)
        if (viewerOverride === 'auto' && dbDirType) {
            return <>{openAs()}
                <DatabaseDirectoryViewer path={url} type={dbDirType!}/>
            </>;
        }
    }


        if (error) {
            return (<>
                    {openAs()}
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-ide-red mb-2">Error loading file</p>
                            <p className="text-sm text-gray-500">{error}</p>
                        </div>
                    </div>
                </>
            );
        }


        const renderViewer = () => {
            const mapCategory = (ext: string) => {
                if (["json", "jsonb", "json5"].includes(ext)) return "json"
                if (["js", "ts", "cs", "cpp", "rs", "mjs", "mts", "cjs", "cts", "go", "c", "h", "hpp"].includes(ext)) return "code"
                if (["xml", "xsl", "xsd", "svg", "html", "htmx", "htm"].includes(ext)) return "xml"
                if (["csv", "tsv"].includes(ext)) return "csv"
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'avif', 'ico', 'tiff', 'svg'].includes(ext)) return "image"
                if (['txt', 'log', 'md'].includes(ext)) return "text"
                return "_"

            }
            const viewAs = viewerOverride === 'auto' ? mapCategory(ext) : viewerOverride;
            switch (viewAs) {
                case 'hex':
                    return <HexViewer data={url}/>;
                case 'text':
                    return <CodeEditor value={url} language="text" readOnly={true}/>;
                case 'code':
                    return <CodeEditor value={url} language="javascript" readOnly={true}/>;
                case 'json':
                    try {
                        return <JsonViewer data={url}/>;
                    } catch {
                        return <CodeEditor value={url} language="json" readOnly={true}/>;
                    }
                case 'xml':
                    return <XmlViewer data={url}/>;
                case 'csv':
                    return <CsvViewer data={url}/>;
                case 'image':
                    return <ImageViewer src={url} fileName={fileName}/>;
                case 'pdf':
                    return <PdfViewer file={url} fileName={fileName}/>;
            }

            // Auto-detect based on file extension
            if (ext === 'pdf') {
                return <PdfViewer file={url} fileName={fileName}/>;
            }

            if (ext === 'docx') {
                return <OfficeViewer file={url} fileType="docx" fileName={fileName}/>;
            }

            if (ext === 'xlsx') {
                return <OfficeViewer file={url} fileType="xlsx" fileName={fileName}/>;
            }

            if (ext === 'pptx') {
                return <OfficeViewer file={url} fileType="pptx" fileName={fileName}/>;
            }

            if (ext === 'xml' || ext === 'svg' || ext === 'xsd' || ext === 'xsl') {
                return <XmlViewer data={url}/>;
            }

            const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif', 'avif', 'ico', 'tiff'];
            if (imageExts.includes(ext)) {
                return <ImageViewer src={url} fileName={fileName}/>;
            }
            return <HexViewer data={url}/>
        };

        return (<div className="h-full flex flex-col">{openAs()}
                <div className="flex-1 overflow-hidden">
                    {renderViewer()}
                </div>
            </div>
        );
    }