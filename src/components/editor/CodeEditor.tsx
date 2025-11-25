import {useEffect, useRef, useState, forwardRef, useImperativeHandle} from 'react';
import { EditorView, basicSetup } from 'codemirror';
import {EditorState, Text} from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { search, highlightSelectionMatches, openSearchPanel } from '@codemirror/search';

export interface CodeEditorHandle {
  openSearch: () => void;
}

interface CodeEditorProps {
  value: string;
  language?: 'javascript' | 'python' | 'json' | 'html' | 'css' | 'text';
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

const languageExtensions = {
  javascript: javascript(),
  python: python(),
  json: json(),
  html: html(),
  css: css(),
  text: [],
};

// IntelliJ-inspired theme
const intellijTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1E1E1E',
    color: '#A9B7C6',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#ffffff',
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
    fontSize: '13px',
  },
  '.cm-cursor': {
    borderLeftColor: '#ffffff',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: '#214283',
  },
  '.cm-focused .cm-selectionBackground': {
    backgroundColor: '#214283',
  },
  '.cm-activeLine': {
    backgroundColor: '#2B2B2B',
  },
  '.cm-gutters': {
    backgroundColor: '#2B2B2B',
    color: '#606366',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#2B2B2B',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    paddingRight: '8px',
  },
}, { dark: true });

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor({ value, language = 'text', readOnly = false, onChange }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
    const [fetchedText, setFetchedText] = useState<any>(null)

    useImperativeHandle(ref, () => ({
      openSearch: () => {
        if (viewRef.current) {
          openSearchPanel(viewRef.current);
        }
      },
    }));

    useEffect(() => {
        fetch(value).then(r => r.text()).then(r => setFetchedText(r))
    }, [value])

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      basicSetup,
      intellijTheme,
      languageExtensions[language] || [],
      EditorState.readOnly.of(readOnly),
      search({ top: true }),
      highlightSelectionMatches(),
    ];

    if (onChange) {
      extensions.push(
        EditorView.updateListener.of((update: any) => {
          if (update.docChanged) {
            onChange(update.state.doc?.toString());
          }
        })
      );
    }

    const state = EditorState.create({
      doc: fetchedText ?? Text.empty,
      extensions,

    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [language, readOnly]);

  useEffect(() => {
    if (viewRef.current && fetchedText !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: fetchedText,
        },
      });
    }
  }, [fetchedText]);

  return <div ref={editorRef} className="h-full w-full overflow-auto" />;
});
