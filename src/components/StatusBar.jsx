import React, { useMemo } from 'react';
import { ShieldCheck, FileCode2 } from 'lucide-react';
import { APP_VERSION } from '../constants/version';
import { detectLanguage } from '../utils/customHighlighter';

export default function StatusBar({ text, syntaxHighlight = true }) {
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const lang = useMemo(() => {
    if (!syntaxHighlight) return 'Plain';
    const detected = detectLanguage(text);
    switch (detected) {
      case 'json': return 'JSON';
      case 'yaml': return 'YAML';
      case 'javascript': return 'JS';
      case 'markdown': return 'Markdown';
      default: return 'Plain';
    }
  }, [text, syntaxHighlight]);

  return (
    <footer className="status-bar">
      <div className="status-left-section">
        <span className="status-version-badge" title={`inmem-memo v${APP_VERSION}`}>v{APP_VERSION}</span>
        <div className="status-metrics">
          <div className="metric-item">
            <span>Chars:</span>
            <span className="metric-value">{chars}</span>
          </div>
          <div className="metric-item">
            <span>Words:</span>
            <span className="metric-value">{words}</span>
          </div>
          <div className="metric-item">
            <span>Lines:</span>
            <span className="metric-value">{lines}</span>
          </div>
        </div>
        <div className="status-lang-badge" title="構文自動検出">
          <FileCode2 size={12} />
          <span>{lang}</span>
        </div>
      </div>

      <div className="status-warning">
        <ShieldCheck size={13} style={{ color: 'var(--accent-emerald)' }} />
        <span>No disk persistence — Memory only</span>
      </div>
    </footer>
  );
}
