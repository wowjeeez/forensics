import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Loader2, FileText, Table, Presentation } from 'lucide-react';

interface OfficeViewerProps {
  file: ArrayBuffer | string;
  fileType: 'docx' | 'xlsx' | 'pptx';
  fileName?: string;
}

export function OfficeViewer({ file, fileType, fileName }: OfficeViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    loadDocument();
  }, [file, fileType]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      if (fileType === 'docx') {
        await loadDocx();
      } else if (fileType === 'xlsx') {
        await loadXlsx();
      } else if (fileType === 'pptx') {
        setPptxPlaceholder();
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
      setLoading(false);
    }
  };

  const loadDocx = async () => {
    const arrayBuffer = typeof file === 'string'
      ? await fetch(file).then(r => r.arrayBuffer())
      : file;

    const result = await mammoth.convertToHtml({ arrayBuffer });
    setContent(result.value);

    if (result.messages.length > 0) {
      console.warn('DOCX conversion warnings:', result.messages);
    }
  };

  const loadXlsx = async () => {
    const arrayBuffer = typeof file === 'string'
      ? await fetch(file).then(r => r.arrayBuffer())
      : file;

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    setSheets(sheetNames);

    if (sheetNames.length > 0) {
      renderSheet(workbook, 0);
    }
  };

  const renderSheet = (workbook: XLSX.WorkBook, sheetIndex: number) => {
    const sheetName = workbook.SheetNames[sheetIndex];
    const worksheet = workbook.Sheets[sheetName];
    const html = XLSX.utils.sheet_to_html(worksheet, {
      header: '',
      footer: '',
    });
    setContent(html);
    setActiveSheet(sheetIndex);
  };

  const handleSheetChange = async (index: number) => {
    const arrayBuffer = typeof file === 'string'
      ? await fetch(file).then(r => r.arrayBuffer())
      : file;

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    renderSheet(workbook, index);
  };

  const setPptxPlaceholder = () => {
    setContent(`
      <div class="p-8 text-center">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-300 mb-2">PowerPoint Viewer</h3>
        <p class="text-sm text-gray-500">
          Full PPTX rendering requires additional processing.<br />
          Consider using the hex viewer or exporting to PDF.
        </p>
      </div>
    `);
  };

  const getIcon = () => {
    switch (fileType) {
      case 'docx':
        return <FileText className="w-4 h-4" />;
      case 'xlsx':
        return <Table className="w-4 h-4" />;
      case 'pptx':
        return <Presentation className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-ide-blue animate-spin" />
          <span className="text-sm text-gray-400">Loading document...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-ide-red mb-2">Error loading document</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-editor-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-editor-border bg-editor-toolbar">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm text-gray-300">{fileName || `${fileType.toUpperCase()} Document`}</span>
        </div>

        {/* Sheet tabs for Excel */}
        {fileType === 'xlsx' && sheets.length > 0 && (
          <div className="flex items-center gap-1 ml-4">
            {sheets.map((sheet, index) => (
              <button
                key={index}
                onClick={() => handleSheetChange(index)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeSheet === index
                    ? 'bg-ide-blue text-white'
                    : 'bg-editor-bg text-gray-400 hover:text-gray-300'
                }`}
              >
                {sheet}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          {fileType === 'docx' && (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                color: '#d1d5db',
              }}
            />
          )}

          {fileType === 'xlsx' && (
            <div
              className="overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                color: '#d1d5db',
              }}
            />
          )}

          {fileType === 'pptx' && (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      </div>

      {/* Add custom styles for tables */}
      <style>{`
        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 0.875rem;
        }

        table td, table th {
          border: 1px solid #374151;
          padding: 0.5rem;
          text-align: left;
        }

        table th {
          background-color: #1f2937;
          font-weight: 600;
          color: #9ca3af;
        }

        table tr:nth-child(even) {
          background-color: #111827;
        }

        table tr:hover {
          background-color: #1f2937;
        }

        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: #e5e7eb;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }

        .prose p {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          line-height: 1.6;
        }

        .prose ul, .prose ol {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          padding-left: 1.5em;
        }

        .prose li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }

        .prose strong {
          color: #f3f4f6;
          font-weight: 600;
        }

        .prose em {
          color: #d1d5db;
        }

        .prose a {
          color: #60a5fa;
          text-decoration: underline;
        }

        .prose a:hover {
          color: #93c5fd;
        }
      `}</style>
    </div>
  );
}
