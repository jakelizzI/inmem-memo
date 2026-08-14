import React, { useState, useEffect } from 'react';
import { APP_VERSION } from '../constants/version';
import { 
  Settings, 
  X, 
  Keyboard, 
  Palette, 
  FileText, 
  ShieldCheck, 
  Check, 
  RefreshCw, 
  Sparkles,
  Wand2,
  Plus,
  Trash2,
  Edit2,
  Code2,
  Play,
  Power,
  ZoomIn,
  Sun,
  Moon,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

const PRESET_SHORTCUTS = [
  'Ctrl+Shift+M',
  'Alt+Space',
  'Ctrl+Alt+N',
  'Ctrl+Shift+K',
  'Alt+Shift+S',
  'Ctrl+Shift+Space'
];

const PRESET_REGEX_ACTIONS = [
  { name: '空行を削除', pattern: '^\\s*$\\n', replacement: '', flags: 'gm', description: '連続する空白行や空行をすべて削除' },
  { name: '行末スペース削除', pattern: '[ \\t]+$', replacement: '', flags: 'gm', description: '各行の末尾にある無駄な空白やタブを削除' },
  { name: 'カンマを改行に', pattern: ',\\s*', replacement: '\\n', flags: 'g', description: 'カンマ区切りテキストを行ごとに分割' },
  { name: 'HTMLタグ除去', pattern: '<[^>]+>', replacement: '', flags: 'g', description: 'HTMLタグをすべて取り除きプレーンテキスト化' },
  { name: '連続空白を1つに', pattern: '[ \\t]+', replacement: ' ', flags: 'g', description: '複数の連続するスペースやタブを1つの半角スペースに統一' }
];

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSaveSettings,
  showToast,
  onQuitApp,
  initialTab = 'shortcuts'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [localSettings, setLocalSettings] = useState(settings);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New action form state
  const [actionName, setActionName] = useState('');
  const [actionPattern, setActionPattern] = useState('');
  const [actionReplacement, setActionReplacement] = useState('');
  const [actionFlags, setActionFlags] = useState('gm');
  const [editingIndex, setEditingIndex] = useState(null);
  const [showFlagHelp, setShowFlagHelp] = useState(false);

  // Live test preview multiline state
  const [testInput, setTestInput] = useState(`Apple, Banana, Orange\nGrape, Mango, Peach\n\nStrawberry, Melon`);
  const [testOutput, setTestOutput] = useState('');

  // Inline confirmation state for Quit App (replaces blocking window.confirm)
  const [isConfirmingQuit, setIsConfirmingQuit] = useState(false);
  const quitTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (quitTimerRef.current) clearTimeout(quitTimerRef.current);
    };
  }, []);

  const handleQuitClick = () => {
    if (isConfirmingQuit) {
      if (quitTimerRef.current) clearTimeout(quitTimerRef.current);
      setIsConfirmingQuit(false);
      onQuitApp();
    } else {
      setIsConfirmingQuit(true);
      if (quitTimerRef.current) clearTimeout(quitTimerRef.current);
      quitTimerRef.current = setTimeout(() => {
        setIsConfirmingQuit(false);
      }, 4000);
    }
  };

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Key recorder event listener
  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Cmd');

      const key = e.key;
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
        let normalizedKey = key.toUpperCase();
        if (key === ' ') normalizedKey = 'Space';
        if (key === 'Escape') normalizedKey = 'Esc';
        
        parts.push(normalizedKey);
        const combo = parts.join('+');
        setLocalSettings((prev) => ({ ...prev, shortcut: combo }));
        setIsRecording(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isRecording]);

  // Real-time Regex Test computation
  useEffect(() => {
    if (!actionPattern) {
      setTestOutput(testInput);
      return;
    }
    const effectiveFlags = (actionFlags.trim() || 'gm').toLowerCase();
    try {
      const regex = new RegExp(actionPattern, effectiveFlags);
      // Format escaped newlines and tabs in replacement
      const rep = actionReplacement.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      const res = testInput.replace(regex, rep);
      setTestOutput(res);
    } catch (err) {
      setTestOutput(`[正規表現エラー: ${err.message}]`);
    }
  }, [testInput, actionPattern, actionReplacement, actionFlags]);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaving(true);
    onSaveSettings(localSettings);
    setTimeout(() => {
      setIsSaving(false);
      showToast('設定を保存しました');
      onClose();
    }, 150);
  };

  const handleAddOrUpdateAction = () => {
    if (!actionName.trim() || !actionPattern.trim()) {
      showToast('アクション名と正規表現パターンを入力してください');
      return;
    }

    const effectiveFlags = (actionFlags.trim() || 'gm').toLowerCase();

    try {
      new RegExp(actionPattern, effectiveFlags);
    } catch (err) {
      showToast(`正規表現が無効です: ${err.message}`);
      return;
    }

    const currentActions = localSettings.customActions || [];
    const newAction = {
      id: editingIndex !== null ? currentActions[editingIndex].id : `custom-${Date.now()}`,
      name: actionName.trim(),
      pattern: actionPattern,
      replacement: actionReplacement,
      flags: effectiveFlags,
      type: 'regex'
    };

    let updatedActions;
    if (editingIndex !== null) {
      updatedActions = [...currentActions];
      updatedActions[editingIndex] = newAction;
      setEditingIndex(null);
    } else {
      updatedActions = [...currentActions, newAction];
    }

    setLocalSettings(prev => ({ ...prev, customActions: updatedActions }));
    setActionName('');
    setActionPattern('');
    setActionReplacement('');
    setActionFlags('gm');
    showToast(editingIndex !== null ? 'アクションを更新しました' : 'アクションを追加しました');
  };

  const handleEditAction = (index) => {
    const act = (localSettings.customActions || [])[index];
    if (act) {
      setActionName(act.name);
      setActionPattern(act.pattern);
      setActionReplacement(act.replacement);
      setActionFlags((act.flags || 'gm').toLowerCase());
      setEditingIndex(index);
    }
  };

  const handleDeleteAction = (index) => {
    const updated = (localSettings.customActions || []).filter((_, i) => i !== index);
    setLocalSettings(prev => ({ ...prev, customActions: updated }));
    if (editingIndex === index) {
      setEditingIndex(null);
      setActionName('');
      setActionPattern('');
      setActionReplacement('');
    }
    showToast('アクションを削除しました');
  };

  const handleAddPreset = (preset) => {
    const currentActions = localSettings.customActions || [];
    if (currentActions.some(a => a.name === preset.name)) {
      showToast(`「${preset.name}」は既に追加されています`);
      return;
    }
    const newAction = {
      id: `preset-${Date.now()}`,
      ...preset,
      type: 'regex'
    };
    setLocalSettings(prev => ({
      ...prev,
      customActions: [...currentActions, newAction]
    }));
    showToast(`「${preset.name}」を追加しました`);
  };

  // Convert font size string (e.g. '15px') or number to integer
  const currentFontSizeNum = parseInt(localSettings.fontSize || 15, 10);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-extended sidebar-layout" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-badge">
              <Settings size={18} />
            </div>
            <div>
              <div className="modal-title-row">
                <h3 className="modal-title">環境設定</h3>
                <span className="modal-version-tag">v{APP_VERSION}</span>
              </div>
              <p className="modal-subtitle">ショートカット・アクション・外観・エディタのカスタマイズ</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Main Container: Sidebar + Body Content */}
        <div className="modal-main-container">
          {/* Vertical Sidebar Navigation */}
          <nav className="modal-sidebar">
            <div className="sidebar-menu-list">
              <button 
                className={`sidebar-tab-btn ${activeTab === 'shortcuts' ? 'active' : ''}`}
                onClick={() => setActiveTab('shortcuts')}
              >
                <Keyboard size={15} />
                <span>ショートカット</span>
              </button>
              <button 
                className={`sidebar-tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
                onClick={() => setActiveTab('actions')}
              >
                <Wand2 size={15} />
                <span>アクション・正規表現</span>
              </button>
              <button 
                className={`sidebar-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
                onClick={() => setActiveTab('appearance')}
              >
                <Palette size={15} />
                <span>外観・フォント</span>
              </button>
              <button 
                className={`sidebar-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                <FileText size={15} />
                <span>エディタ設定</span>
              </button>
              <button 
                className={`sidebar-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                <Power size={15} />
                <span>メモリ・終了</span>
              </button>
            </div>

            <div className="sidebar-app-info">
              <span className="sidebar-app-version">inmem-memo v{APP_VERSION}</span>
            </div>
          </nav>

          {/* Tab Content Body */}
          <div className="modal-body">
            {/* TAB: Shortcuts */}
            {activeTab === 'shortcuts' && (
              <div className="tab-content">
                <div className="setting-section">
                  <div className="setting-section-title">
                    <span>グローバル呼び出しショートカット</span>
                  </div>
                  <p className="setting-description">
                    他のアプリ（ブラウザやIDEなど）の操作中でも、このキーを押すだけで即座にスクラッチパッドを画面最前面に表示 / 非表示トグルします。
                  </p>

                  <div 
                    className={`shortcut-recorder-box ${isRecording ? 'recording' : ''}`}
                    onClick={() => setIsRecording(true)}
                  >
                    <div className="shortcut-key-chips">
                      {isRecording ? (
                        <span className="key-chip-placeholder">割り当てたいキーの組み合わせを押してください...</span>
                      ) : (
                        localSettings.shortcut.split('+').map((key, i) => (
                          <kbd key={i} className="key-chip">{key}</kbd>
                        ))
                      )}
                    </div>
                    <button 
                      className={`btn-record ${isRecording ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRecording(!isRecording);
                      }}
                    >
                      <Keyboard size={13} />
                      <span>{isRecording ? '入力待機中...' : 'キーを変更'}</span>
                    </button>
                  </div>
                </div>

                {/* Preset Shortcuts */}
                <div className="presets-wrapper">
                  <span className="presets-label">おすすめプリセット:</span>
                  <div className="presets-list">
                    {PRESET_SHORTCUTS.map((sc) => (
                      <button
                        key={sc}
                        className={`preset-btn ${localSettings.shortcut === sc ? 'active' : ''}`}
                        onClick={() => setLocalSettings(prev => ({ ...prev, shortcut: sc }))}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Actions & Regex */}
            {activeTab === 'actions' && (
              <div className="tab-content">
                {/* Add/Edit Custom Regex Form */}
                <div className="custom-action-form-box">
                  <div className="form-box-title">
                    <Wand2 size={14} />
                    <span>{editingIndex !== null ? '正規表現アクションの編集' : '新しい正規表現アクションを作成'}</span>
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label>アクション名 (ボタン表示名)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="例: カンマを改行に"
                        value={actionName}
                        onChange={(e) => setActionName(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <div className="form-label-with-help">
                        <label>フラグ (flags)</label>
                        <button 
                          type="button" 
                          className="btn-flag-help-toggle" 
                          onClick={() => setShowFlagHelp(!showFlagHelp)}
                          title="フラグの説明と設定例を見る"
                        >
                          <HelpCircle size={13} />
                          <span>フラグ一覧・設定例</span>
                          {showFlagHelp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                      <input 
                        type="text" 
                        className="form-input code-font" 
                        placeholder="例: gm (全行置換), g, gi"
                        value={actionFlags}
                        onChange={(e) => {
                          // Automatically convert to lowercase and keep only valid regex flags (g, m, i, s, u, y, d, v)
                          const sanitized = e.target.value.toLowerCase().replace(/[^gmisudyv]/g, '');
                          setActionFlags(sanitized);
                        }}
                      />
                    </div>

                    <div className="form-field">
                      <label>正規表現パターン (Pattern)</label>
                      <input 
                        type="text" 
                        className="form-input code-font" 
                        placeholder="例: ,\\s*"
                        value={actionPattern}
                        onChange={(e) => setActionPattern(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>置換文字列 (Replacement)</label>
                      <input 
                        type="text" 
                        className="form-input code-font" 
                        placeholder="例: \\n (改行)"
                        value={actionReplacement}
                        onChange={(e) => setActionReplacement(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Flag Help & Cheat Sheet Box */}
                  {showFlagHelp && (
                    <div className="flag-guide-box">
                      <div className="flag-guide-title">
                        <Info size={13} />
                        <span>フラグの意味とおすすめの組み合わせ</span>
                      </div>
                      <div className="flag-guide-grid">
                        <div className="flag-guide-item">
                          <code>g</code>
                          <div className="flag-item-desc">
                            <strong>Global (全体置換)</strong>
                            <span>テキスト全体から一致するすべての箇所を置換</span>
                          </div>
                        </div>
                        <div className="flag-guide-item">
                          <code>m</code>
                          <div className="flag-item-desc">
                            <strong>Multiline (複数行)</strong>
                            <span><code>^</code>(行頭) と <code>$</code>(行末) を各行ごとに判定</span>
                          </div>
                        </div>
                        <div className="flag-guide-item">
                          <code>i</code>
                          <div className="flag-item-desc">
                            <strong>Ignore Case (大小無視)</strong>
                            <span>英字の大文字・小文字を区別せず一致</span>
                          </div>
                        </div>
                        <div className="flag-guide-item">
                          <code>s</code>
                          <div className="flag-item-desc">
                            <strong>DotAll (改行一致)</strong>
                            <span><code>.</code> が改行記号にもマッチするようになる</span>
                          </div>
                        </div>
                      </div>
                      <div className="flag-preset-chips">
                        <span className="chips-label">クイック選択:</span>
                        <button type="button" className={`flag-chip ${actionFlags === 'gm' ? 'active' : ''}`} onClick={() => setActionFlags('gm')}>
                          <strong>gm</strong> 全行一括置換 (推奨)
                        </button>
                        <button type="button" className={`flag-chip ${actionFlags === 'g' ? 'active' : ''}`} onClick={() => setActionFlags('g')}>
                          <strong>g</strong> 単語の全体置換
                        </button>
                        <button type="button" className={`flag-chip ${actionFlags === 'gi' ? 'active' : ''}`} onClick={() => setActionFlags('gi')}>
                          <strong>gi</strong> 大文字小文字無視
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Live Regex Multiline Test Box */}
                  <div className="live-test-box multiline-test">
                    <div className="live-test-header">
                      <div className="live-test-title">
                        <Play size={12} />
                        <span>リアルタイム動作テスト (複数行対応)</span>
                      </div>
                      <div className="live-test-presets">
                        <button 
                          type="button" 
                          className="btn-test-sample"
                          onClick={() => setTestInput(`Apple, Banana, Orange\nGrape, Mango, Peach\n\nStrawberry, Melon`)}
                          title="カンマ区切り＋空行のサンプル"
                        >
                          カンマ・空行例
                        </button>
                        <button 
                          type="button" 
                          className="btn-test-sample"
                          onClick={() => setTestInput(`1. 第一行のテキスト\n2. 第二行のテキスト\n3. 第三行のテキスト`)}
                          title="連番付き複数行のサンプル"
                        >
                          連番リスト例
                        </button>
                      </div>
                    </div>

                    <div className="live-test-multiline-grid">
                      <div className="live-pane">
                        <label htmlFor="live-test-input-textarea" className="live-pane-label">入力テキスト (テスト用)</label>
                        <textarea 
                          id="live-test-input-textarea"
                          aria-label="入力テキスト (テスト用)"
                          className="live-textarea live-textarea-input"
                          rows={3}
                          placeholder="テストするテキストを入力..."
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                        />
                      </div>
                      <div className="live-pane-divider" aria-hidden="true">➔</div>
                      <div className="live-pane">
                        <label htmlFor="live-test-output-textarea" className="live-pane-label">置換結果プレビュー</label>
                        <textarea 
                          id="live-test-output-textarea"
                          aria-label="置換結果プレビュー"
                          className="live-textarea live-textarea-output"
                          rows={3}
                          readOnly 
                          placeholder="置換結果がリアルタイムに表示されます..."
                          value={testOutput} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-actions-row">
                    {editingIndex !== null && (
                      <button 
                        className="btn" 
                        onClick={() => {
                          setEditingIndex(null);
                          setActionName('');
                          setActionPattern('');
                          setActionReplacement('');
                        }}
                      >
                        キャンセル
                      </button>
                    )}
                    <button className="btn btn-primary" onClick={handleAddOrUpdateAction}>
                      <Plus size={13} />
                      <span>{editingIndex !== null ? '変更を確定' : 'アクションを追加'}</span>
                    </button>
                  </div>
                </div>

                {/* Registered Actions List */}
                <div className="registered-actions-section">
                  <span className="section-small-title">登録済みカスタムアクション ({localSettings.customActions?.length || 0})</span>
                  {localSettings.customActions && localSettings.customActions.length > 0 ? (
                    <div className="actions-card-list">
                      {localSettings.customActions.map((act, idx) => (
                        <div key={act.id || idx} className="action-card">
                          <div className="action-card-info">
                            <div className="action-card-top">
                              <span className="action-card-title">{act.name}</span>
                              <span className="action-flags-badge">/{act.flags || 'g'}</span>
                            </div>
                            <div className="action-regex-details">
                              <code>/{act.pattern}/</code> ➔ <code>"{act.replacement}"</code>
                            </div>
                          </div>
                          <div className="action-card-buttons">
                            <button 
                              className="btn-icon" 
                              onClick={() => handleEditAction(idx)}
                              title="編集"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              className="btn-icon btn-icon-danger" 
                              onClick={() => handleDeleteAction(idx)}
                              title="削除"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-actions-hint">
                      追加されたカスタムアクションはまだありません。上記のフォームまたは下のプリセットから追加してください。
                    </div>
                  )}
                </div>

                {/* Presets List */}
                <div className="presets-wrapper">
                  <span className="presets-label">おすすめ正規表現プリセット (クリックで追加):</span>
                  <div className="presets-list">
                    {PRESET_REGEX_ACTIONS.map((preset, i) => (
                      <button
                        key={i}
                        className="preset-btn"
                        onClick={() => handleAddPreset(preset)}
                        title={preset.description}
                      >
                        <Plus size={11} />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Appearance */}
            {activeTab === 'appearance' && (
              <div className="tab-content">
                {/* Color Theme Selector (3 Options) */}
                <div className="setting-section">
                  <div className="setting-section-title">
                    <span>カラーテーマ</span>
                  </div>
                  <div className="theme-options-grid">
                    <label className={`theme-card ${localSettings.theme === 'midnight' ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="theme" 
                        value="midnight" 
                        checked={localSettings.theme === 'midnight'}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, theme: e.target.value }))}
                      />
                      <div className="theme-preview midnight"></div>
                      <div className="theme-meta">
                        <span className="theme-name">Midnight Dark</span>
                        <span className="theme-desc">深いグラデーション</span>
                      </div>
                    </label>

                    <label className={`theme-card ${localSettings.theme === 'oled' ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="theme" 
                        value="oled" 
                        checked={localSettings.theme === 'oled'}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, theme: e.target.value }))}
                      />
                      <div className="theme-preview oled"></div>
                      <div className="theme-meta">
                        <span className="theme-name">OLED Pure Black</span>
                        <span className="theme-desc">完全な黒で省電力</span>
                      </div>
                    </label>

                    <label className={`theme-card ${localSettings.theme === 'light' ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="theme" 
                        value="light" 
                        checked={localSettings.theme === 'light'}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, theme: e.target.value }))}
                      />
                      <div className="theme-preview light"></div>
                      <div className="theme-meta">
                        <span className="theme-name">Clean Light</span>
                        <span className="theme-desc">爽やかで明るい白</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Font Size & Ctrl+Wheel Zoom */}
                <div className="setting-section">
                  <div className="setting-section-title">
                    <span>文字サイズ設定</span>
                  </div>
                  
                  <div className="font-size-control-box">
                    {/* Wheel Zoom Toggle */}
                    <label className="toggle-row">
                      <div className="toggle-info">
                        <span className="toggle-title">Ctrl + マウスホイールで文字サイズを変更</span>
                        <span className="toggle-desc">エディタ上で Ctrl（Mac: Cmd）を押しながらホイールを回すと拡大・縮小します</span>
                      </div>
                      <input 
                        type="checkbox" 
                        className="custom-toggle"
                        checked={localSettings.wheelZoom ?? true}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, wheelZoom: e.target.checked }))}
                      />
                    </label>

                    {/* Number Input Control */}
                    <div className={`font-size-input-wrapper ${localSettings.wheelZoom ?? true ? 'disabled' : ''}`}>
                      <div className="font-size-info">
                        <span className="font-size-label">エディタの基準文字サイズ</span>
                        <span className="font-size-hint">
                          {localSettings.wheelZoom ?? true 
                            ? '※ ホイール変更がONのため、エディタ上で直接 Ctrl + ホイール操作が可能です' 
                            : '10px 〜 36px の範囲で数値を入力して調整できます'}
                        </span>
                      </div>
                      <div className="font-size-actions">
                        {localSettings.wheelZoom ?? true ? (
                          <span className="font-size-badge">{currentFontSizeNum}px</span>
                        ) : (
                          <input 
                            type="number" 
                            className="font-size-number-input"
                            min="10"
                            max="36"
                            value={currentFontSizeNum}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 10 && val <= 36) {
                                setLocalSettings(prev => ({ ...prev, fontSize: `${val}px` }));
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Editor Settings */}
            {activeTab === 'editor' && (
              <div className="tab-content">
                <div className="setting-section">
                  <div className="setting-section-title">
                    <span>Tabキーのインデント幅</span>
                  </div>
                  <div className="segmented-control">
                    {[2, 4].map((spaces) => (
                      <button
                        key={spaces}
                        className={`segment-btn ${localSettings.tabSize === spaces ? 'active' : ''}`}
                        onClick={() => setLocalSettings(prev => ({ ...prev, tabSize: spaces }))}
                      >
                        {spaces} スペース
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting-section">
                  <label className="toggle-row">
                    <div className="toggle-info">
                      <span className="toggle-title">自動折り返し (Word Wrap)</span>
                      <span className="toggle-desc">長い行をウィンドウ幅に合わせて折り返します</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="custom-toggle"
                      checked={localSettings.wordWrap !== false}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, wordWrap: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="setting-section">
                  <label className="toggle-row">
                    <div className="toggle-info">
                      <span className="toggle-title">行番号の表示 (Line Numbers)</span>
                      <span className="toggle-desc">エディタ左端に行番号を表示します</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="custom-toggle"
                      checked={localSettings.showLineNumbers !== false}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, showLineNumbers: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="setting-section">
                  <label className="toggle-row">
                    <div className="toggle-info">
                      <span className="toggle-title">コードの折りたたみ (Code Folding)</span>
                      <span className="toggle-desc">JSON・配列・オブジェクト・YAML等の折りたたみアイコンを表示します</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="custom-toggle"
                      checked={localSettings.codeFolding !== false}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, codeFolding: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="setting-section">
                  <label className="toggle-row">
                    <div className="toggle-info">
                      <span className="toggle-title">シンタックスハイライト (Syntax Highlighting)</span>
                      <span className="toggle-desc">JSON、YAML、JavaScript、Markdownの構文を自動色分けします</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="custom-toggle"
                      checked={localSettings.syntaxHighlight !== false}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, syntaxHighlight: e.target.checked }))}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB: Privacy & Application Termination */}
            {activeTab === 'privacy' && (
              <div className="tab-content">
                <div className="info-box-large">
                  <div className="info-box-header">
                    <ShieldCheck size={18} />
                    <span>完全インメモリ保護ポリシー</span>
                  </div>
                  <p className="info-box-text">
                    ・<strong>メモ本文テキスト</strong>: ハードディスク・データベース・localStorageには一切書き込まれません。アプリを完全終了すると即座にメモリから完全消滅します。<br />
                    ・<strong>ユーザー設定</strong>: ショートカット・カスタム正規表現・外観テーマ・エディタ設定のみがローカル（localStorage）に安全に保存されます。
                  </p>
                </div>

                {/* Application Version & Build Info */}
                <div className="app-version-info-box">
                  <div className="version-info-header">
                    <Sparkles size={14} className="version-sparkle-icon" />
                    <span>バージョン情報</span>
                  </div>
                  <div className="version-info-body">
                    <div className="version-info-row">
                      <span className="version-info-label">アプリケーション</span>
                      <span className="version-info-val">inmem-memo</span>
                    </div>
                    <div className="version-info-row">
                      <span className="version-info-label">現在のバージョン</span>
                      <span className="version-info-badge">v{APP_VERSION}</span>
                    </div>
                    <div className="version-info-row">
                      <span className="version-info-label">ライセンス / ソースコード</span>
                      <a 
                        href="https://github.com/jakelizzI/inmem-memo" 
                        target="_blank" 
                        rel="noreferrer"
                        className="version-github-link"
                      >
                        <span>GitHub Repository</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Complete Application Exit Section */}
                <div className="quit-app-section">
                  <div className="quit-app-info">
                    <span className="quit-app-title">アプリを完全終了 (Exit)</span>
                    <span className="quit-app-desc">
                      タスクトレイ常駐を含めプロセス全体を完全に終了し、OSメモリを解放します。（※未保存のメモは完全に消去されます）
                    </span>
                  </div>
                  <button 
                    className={`btn btn-quit-app ${isConfirmingQuit ? 'btn-confirming-quit' : ''}`}
                    onClick={handleQuitClick}
                    style={isConfirmingQuit ? { 
                      backgroundColor: 'var(--accent-rose, #f43f5e)', 
                      color: '#ffffff', 
                      borderColor: 'transparent',
                      fontWeight: 'bold',
                      animation: 'pulse 1.5s infinite'
                    } : {}}
                    title={isConfirmingQuit ? "クリックして即座に終了します" : "アプリを完全終了します"}
                  >
                    <Power size={14} />
                    <span>{isConfirmingQuit ? '本当に終了しますか？ (再度クリック)' : 'アプリを完全終了'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            キャンセル
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={13} className="spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Check size={13} />
                <span>設定を保存</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
