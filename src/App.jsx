import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Scratchpad from './components/Scratchpad';
import StatusBar from './components/StatusBar';
import RightActionToolbar from './components/RightActionToolbar';
import SettingsModal from './components/SettingsModal';
import { useUndoableState } from './hooks/useUndoableState';
import { CheckCircle2 } from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'inmem_memo_user_settings';

const DEFAULT_SETTINGS = {
  shortcut: 'Ctrl+Shift+M',
  theme: 'midnight',
  fontSize: '15px',
  wheelZoom: true,
  tabSize: 2,
  wordWrap: true,
  customActions: [
    {
      id: 'clean-empty-lines',
      name: '空行削除',
      pattern: '^\\s*$\\n',
      replacement: '',
      flags: 'gm',
      type: 'regex'
    },
    {
      id: 'comma-to-newlines',
      name: 'カンマを改行に',
      pattern: ',\\s*',
      replacement: '\\n',
      flags: 'g',
      type: 'regex'
    }
  ]
};

// Built-in JSON Format Action
const BUILTIN_JSON_ACTION = {
  id: 'json-format',
  name: 'JSON整形',
  description: 'JSON文字列をインデント(2スペース)で美しく自動整形',
  type: 'builtin'
};

export default function App() {
  // Pure In-Memory State with Undo/Redo support
  const { 
    text, 
    setText, 
    setTextImmediate, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useUndoableState('');

  const [isPreview, setIsPreview] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialSettingsTab, setInitialSettingsTab] = useState('shortcuts');
  const [toastMessage, setToastMessage] = useState('');

  // Persistent user settings (localStorage)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // Prompt before unload if there's unsaved memory text
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (text.trim()) {
        e.preventDefault();
        e.returnValue = 'メモはメモリ上にしか保存されていません。終了すると消去されますがよろしいですか？';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [text]);

  // Apply theme & font size to DOM root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'midnight');
    const sizeStr = typeof settings.fontSize === 'number' 
      ? `${settings.fontSize}px` 
      : (settings.fontSize || '15px');
    document.documentElement.style.setProperty('--editor-font-size', sizeStr);
  }, [settings]);

  // Sync initial/updated shortcut with Tauri backend
  useEffect(() => {
    const syncShortcut = async () => {
      try {
        if (window.__TAURI_INTERNALS__ || window.__TAURI__) {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('update_global_shortcut', { shortcutStr: settings.shortcut });
        }
      } catch (err) {
        console.warn('Tauri shortcut sync notice:', err);
      }
    };
    syncShortcut();
  }, [settings.shortcut]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage('');
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  };

  // Dynamic font size change via Ctrl+Wheel (silent without toast)
  const handleFontSizeChange = useCallback((newSize) => {
    const sizeStr = `${newSize}px`;
    setSettings(prev => {
      const updated = { ...prev, fontSize: sizeStr };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Complete application exit (Rust command exit_app)
  const handleQuitApp = async () => {
    try {
      if (window.__TAURI_INTERNALS__ || window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('exit_app');
      } else {
        window.close();
      }
    } catch (err) {
      console.error('Failed to exit application:', err);
      window.close();
    }
  };

  // Action executor (JSON formatting & Custom Regex)
  const handleExecuteAction = (action) => {
    if (!text.trim()) {
      showToast('テキストが入力されていません');
      return;
    }

    if (action.id === 'json-format') {
      try {
        const parsed = JSON.parse(text);
        const formatted = JSON.stringify(parsed, null, 2);
        setTextImmediate(formatted);
        showToast('JSONを美しく整形しました (Ctrl+Zで復元可能)');
      } catch (err) {
        showToast(`JSON解析エラー: ${err.message}`);
      }
      return;
    }

    if (action.type === 'regex' || action.pattern) {
      try {
        const regex = new RegExp(action.pattern, action.flags || 'g');
        const replacement = (action.replacement || '')
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t');
        const replaced = text.replace(regex, replacement);
        setTextImmediate(replaced);
        showToast(`「${action.name}」を実行しました (Ctrl+Zで復元可能)`);
      } catch (err) {
        showToast(`正規表現エラー: ${err.message}`);
      }
    }
  };

  const handleCopy = async () => {
    if (!text) {
      showToast('コピーする内容がありません');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('クリップボードにコピーしました！');
    } catch (err) {
      showToast('コピーに失敗しました');
    }
  };

  const handleClear = () => {
    if (!text) return;
    if (window.confirm('メモの内容を消去しますか？\n（※Ctrl+Zで元に戻せます）')) {
      setTextImmediate('');
      showToast('メモを消去しました (Ctrl+Zで復元可能)');
    }
  };

  const handleExport = () => {
    if (!text) {
      showToast('エクスポートする内容がありません');
      return;
    }
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inmem_memo_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Markdownファイルとしてエクスポートしました');
  };

  // Combine built-in actions with user's custom actions
  const allActions = [
    BUILTIN_JSON_ACTION,
    ...(settings.customActions || [])
  ];

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        onCopy={handleCopy}
        onClear={handleClear}
        onExport={handleExport}
        isPreview={isPreview}
        setIsPreview={setIsPreview}
        onOpenSettings={() => {
          setInitialSettingsTab('shortcuts');
          setIsSettingsOpen(true);
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      {/* Main Workspace Layout (Editor + Right Action Toolbar) */}
      <div className="main-workspace-layout">
        <Scratchpad
          text={text}
          setText={setText}
          isPreview={isPreview}
          tabSize={settings.tabSize || 2}
          wordWrap={settings.wordWrap !== false}
          wheelZoom={settings.wheelZoom ?? true}
          currentFontSize={settings.fontSize || 15}
          onFontSizeChange={handleFontSizeChange}
        />

        <RightActionToolbar
          actions={allActions}
          onExecuteAction={handleExecuteAction}
          onOpenSettingsForAction={() => {
            setInitialSettingsTab('actions');
            setIsSettingsOpen(true);
          }}
        />
      </div>

      {/* Status Bar */}
      <StatusBar text={text} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        showToast={showToast}
        onQuitApp={handleQuitApp}
        initialTab={initialSettingsTab}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <CheckCircle2 size={15} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
