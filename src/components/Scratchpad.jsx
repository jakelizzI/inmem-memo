import React, { useRef, useEffect, useMemo } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { 
  EditorView, 
  lineNumbers, 
  highlightActiveLine, 
  highlightActiveLineGutter, 
  keymap,
  placeholder as cmPlaceholder
} from '@codemirror/view';
import { 
  syntaxHighlighting, 
  foldGutter, 
  codeFolding 
} from '@codemirror/language';
import { indentWithTab, defaultKeymap } from '@codemirror/commands';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import {
  detectLanguage,
  customJsonLanguage,
  customYamlLanguage,
  customJsLanguage,
  customMarkdownLanguage,
  customFoldingService,
  customDarkHighlightStyle,
  customLightHighlightStyle
} from '../utils/customHighlighter';

export default function Scratchpad({ 
  text, 
  setText, 
  isPreview, 
  tabSize = 2, 
  wordWrap = true,
  wheelZoom = true,
  showLineNumbers = true,
  codeFolding: enableCodeFolding = true,
  syntaxHighlight = true,
  theme = 'midnight',
  currentFontSize = 15,
  onFontSizeChange
}) {
  const containerRef = useRef(null);
  const editorHostRef = useRef(null);
  const viewRef = useRef(null);
  const isUpdatingFromPropsRef = useRef(false);

  // Compartments for dynamic reconfiguration
  const compartmentsRef = useRef({
    language: new Compartment(),
    theme: new Compartment(),
    lineNumbers: new Compartment(),
    foldGutter: new Compartment(),
    wordWrap: new Compartment(),
    tabSize: new Compartment(),
    highlight: new Compartment()
  });

  // Determine language mode based on current text and syntaxHighlight setting
  const detectedLang = useMemo(() => {
    if (!syntaxHighlight) return 'plain';
    return detectLanguage(text);
  }, [text, syntaxHighlight]);

  // Determine language extension
  const getLanguageExtension = (lang) => {
    switch (lang) {
      case 'json':
        return customJsonLanguage;
      case 'yaml':
        return customYamlLanguage;
      case 'javascript':
        return customJsLanguage;
      case 'markdown':
        return customMarkdownLanguage;
      default:
        return [];
    }
  };

  // Custom Base Theme matching CSS Variables
  const getBaseEditorTheme = (currentTheme) => {
    const isLight = currentTheme === 'light';
    return EditorView.theme({
      '&': {
        height: '100%',
        fontSize: 'var(--editor-font-size, 15px)',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'transparent',
        color: isLight ? '#0f172a' : '#f3f4f6'
      },
      '.cm-scroller': {
        fontFamily: 'inherit',
        lineHeight: '1.65',
        overflow: 'auto'
      },
      '.cm-content': {
        padding: '16px 20px',
        caretColor: isLight ? '#4f46e5' : '#38bdf8'
      },
      '.cm-line': {
        padding: '0 2px'
      },
      '.cm-gutters': {
        backgroundColor: isLight ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
        color: isLight ? '#94a3b8' : '#64748b',
        borderRight: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
        paddingLeft: '4px',
        paddingRight: '6px',
        userSelect: 'none'
      },
      '.cm-activeLineGutter': {
        backgroundColor: isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(99, 102, 241, 0.15)',
        color: isLight ? '#4f46e5' : '#38bdf8',
        fontWeight: 'bold'
      },
      '.cm-activeLine': {
        backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)'
      },
      '.cm-foldGutter .cm-gutterElement': {
        cursor: 'pointer',
        padding: '0 4px',
        color: isLight ? '#64748b' : '#94a3b8',
        transition: 'color 0.15s ease'
      },
      '.cm-foldGutter .cm-gutterElement:hover': {
        color: isLight ? '#4f46e5' : '#38bdf8'
      },
      '.cm-foldPlaceholder': {
        backgroundColor: isLight ? 'rgba(79, 70, 229, 0.12)' : 'rgba(99, 102, 241, 0.25)',
        border: `1px solid ${isLight ? 'rgba(79, 70, 229, 0.25)' : 'rgba(99, 102, 241, 0.4)'}`,
        color: isLight ? '#4f46e5' : '#a5b4fc',
        borderRadius: '4px',
        padding: '0 6px',
        margin: '0 2px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)'
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: isLight ? 'rgba(79, 70, 229, 0.2) !important' : 'rgba(99, 102, 241, 0.3) !important'
      },
      '.cm-cursor': {
        borderLeftColor: isLight ? '#4f46e5' : '#38bdf8',
        borderLeftWidth: '2px'
      }
    }, { dark: !isLight });
  };

  // Initialize CodeMirror View
  useEffect(() => {
    if (!editorHostRef.current) return;

    const comps = compartmentsRef.current;
    const isLight = theme === 'light';

    const startState = EditorState.create({
      doc: text || '',
      extensions: [
        comps.lineNumbers.of(showLineNumbers ? lineNumbers() : []),
        comps.foldGutter.of(enableCodeFolding ? [codeFolding(), foldGutter(), customFoldingService] : []),
        comps.wordWrap.of(wordWrap ? EditorView.lineWrapping : []),
        comps.tabSize.of(EditorState.tabSize.of(tabSize)),
        comps.theme.of(getBaseEditorTheme(theme)),
        comps.highlight.of(syntaxHighlight ? syntaxHighlighting(isLight ? customLightHighlightStyle : customDarkHighlightStyle) : []),
        comps.language.of(getLanguageExtension(detectedLang)),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        keymap.of([indentWithTab, ...defaultKeymap]),
        cmPlaceholder('ここに思いついたメモやアイデアを即座に入力... (アプリを閉じると自動的に消去されます)'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdatingFromPropsRef.current) {
            const newText = update.state.doc.toString();
            setText(newText);
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorHostRef.current
    });

    viewRef.current = view;

    // Focus editor if not preview
    if (!isPreview) {
      view.focus();
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Run once on mount

  // Sync external text changes (Undo/Redo, JSON format, regex actions)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (text !== currentDoc) {
      isUpdatingFromPropsRef.current = true;
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: text || '' }
      });
      isUpdatingFromPropsRef.current = false;
    }
  }, [text]);

  // Dynamic updates for Language & Syntax Highlighting
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const comps = compartmentsRef.current;
    const isLight = theme === 'light';

    view.dispatch({
      effects: [
        comps.language.reconfigure(getLanguageExtension(detectedLang)),
        comps.highlight.reconfigure(
          syntaxHighlight 
            ? syntaxHighlighting(isLight ? customLightHighlightStyle : customDarkHighlightStyle) 
            : []
        )
      ]
    });
  }, [detectedLang, syntaxHighlight, theme]);

  // Dynamic updates for Theme & Font Size
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const comps = compartmentsRef.current;
    const isLight = theme === 'light';

    view.dispatch({
      effects: [
        comps.theme.reconfigure(getBaseEditorTheme(theme)),
        comps.highlight.reconfigure(
          syntaxHighlight 
            ? syntaxHighlighting(isLight ? customLightHighlightStyle : customDarkHighlightStyle) 
            : []
        )
      ]
    });
  }, [theme]);

  // Dynamic updates for Line Numbers
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: compartmentsRef.current.lineNumbers.reconfigure(showLineNumbers ? lineNumbers() : [])
    });
  }, [showLineNumbers]);

  // Dynamic updates for Code Folding
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: compartmentsRef.current.foldGutter.reconfigure(
        enableCodeFolding ? [codeFolding(), foldGutter(), customFoldingService] : []
      )
    });
  }, [enableCodeFolding]);

  // Dynamic updates for Word Wrap
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: compartmentsRef.current.wordWrap.reconfigure(wordWrap ? EditorView.lineWrapping : [])
    });
  }, [wordWrap]);

  // Dynamic updates for Tab Size
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: compartmentsRef.current.tabSize.reconfigure(EditorState.tabSize.of(tabSize))
    });
  }, [tabSize]);

  // Handle Ctrl + MouseWheel to change font size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if ((e.ctrlKey || e.metaKey) && wheelZoom) {
        e.preventDefault();
        e.stopPropagation();

        const currentSize = typeof currentFontSize === 'number' 
          ? currentFontSize 
          : parseInt(currentFontSize || 15, 10);

        let newSize = currentSize;
        if (e.deltaY < 0) {
          // Zoom In (Max 36px)
          newSize = Math.min(36, currentSize + 1);
        } else if (e.deltaY > 0) {
          // Zoom Out (Min 10px)
          newSize = Math.max(10, currentSize - 1);
        }

        if (newSize !== currentSize && onFontSizeChange) {
          onFontSizeChange(newSize);
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [wheelZoom, currentFontSize, onFontSizeChange]);

  const getParsedMarkdown = () => {
    try {
      const rawHtml = marked.parse(text || '*No content*');
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      return { __html: cleanHtml };
    } catch (e) {
      return { __html: '<p style="color: var(--accent-rose)">Markdown Parse Error</p>' };
    }
  };

  return (
    <main className="editor-container" ref={containerRef}>
      <div 
        className="editor-host-wrapper" 
        style={{ display: isPreview ? 'none' : 'block' }}
      >
        <div ref={editorHostRef} className="codemirror-editor-host" />
      </div>

      {isPreview && (
        <div 
          className="markdown-preview"
          dangerouslySetInnerHTML={getParsedMarkdown()}
        />
      )}
    </main>
  );
}
