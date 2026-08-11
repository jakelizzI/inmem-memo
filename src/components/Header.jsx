import React from 'react';
import brandLogoImg from '../assets/icon.png';
import { APP_VERSION } from '../constants/version';
import { 
  Copy, 
  Trash2, 
  Download, 
  Eye, 
  Edit3, 
  Settings,
  Undo2,
  Redo2
} from 'lucide-react';

export default function Header({ 
  isPreview, 
  setIsPreview, 
  onCopy, 
  onClear, 
  onExport, 
  onOpenSettings,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <img 
            src={brandLogoImg} 
            alt="InMem Scratchpad Icon" 
            className="brand-app-icon"
          />
        </div>
        <span className="brand-title">InMem Scratchpad</span>
        <span className="brand-version-badge" title={`InMem Scratchpad v${APP_VERSION}`}>v{APP_VERSION}</span>
        <div className="badge-inmemory" title="アプリを終了するとメモデータは自動的にメモリから破棄されます">
          <span className="badge-dot"></span>
          In-Memory Only
        </div>
      </div>

      <div className="header-actions">
        {/* Undo / Redo Controls */}
        <div className="undo-redo-group">
          <button 
            className="btn btn-icon-only" 
            onClick={onUndo}
            disabled={!canUndo}
            title="元に戻す (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button 
            className="btn btn-icon-only" 
            onClick={onRedo}
            disabled={!canRedo}
            title="やり直す (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Toggle Edit / Markdown Preview */}
        <button 
          className={`btn ${isPreview ? 'btn-toggle active' : 'btn'}`}
          onClick={() => setIsPreview(!isPreview)}
          title={isPreview ? "エディタに戻る" : "Markdown プレビュー"}
        >
          {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
          <span>{isPreview ? 'Edit' : 'Preview'}</span>
        </button>

        {/* Copy All */}
        <button className="btn" onClick={onCopy} title="全体をクリップボードにコピー">
          <Copy size={14} />
          <span>Copy</span>
        </button>

        {/* Export Manual File */}
        <button className="btn" onClick={onExport} title="ファイルとしてダウンロード (.md)">
          <Download size={14} />
          <span>Export</span>
        </button>

        {/* Clear Memo */}
        <button className="btn btn-danger" onClick={onClear} title="メモをクリア (Ctrl+Zで復元可能)">
          <Trash2 size={14} />
          <span>Clear</span>
        </button>

        {/* Settings Gear Button */}
        <button 
          className="btn btn-settings" 
          onClick={onOpenSettings} 
          title="設定を開く"
        >
          <Settings size={15} />
          <span>設定</span>
        </button>
      </div>
    </header>
  );
}
