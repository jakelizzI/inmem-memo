import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsModal from '../components/SettingsModal';

describe('SettingsModal Component Smoke & Functional Test', () => {
  const defaultSettings = {
    globalShortcut: 'CommandOrControl+Shift+M',
    actions: [],
    theme: 'midnight',
    fontSize: 15,
    showLineNumbers: true,
    codeFolding: true,
    syntaxHighlight: true,
  };

  it('renders SettingsModal without crashing when open', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();
    const handleQuit = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        settings={defaultSettings}
        onSaveSettings={handleSave}
        onQuitApp={handleQuit}
      />
    );

    // Verify modal title is displayed
    expect(screen.getByText('環境設定')).toBeInTheDocument();
  });

  it('switches across all sidebar tabs without runtime exceptions', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();
    const handleQuit = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        settings={defaultSettings}
        onSaveSettings={handleSave}
        onQuitApp={handleQuit}
      />
    );

    // Click Shortcut tab
    fireEvent.click(screen.getByText('ショートカット'));
    expect(screen.getByText('グローバル呼び出しショートカット')).toBeInTheDocument();

    // Click Actions tab
    fireEvent.click(screen.getByText('アクション・正規表現'));
    expect(screen.getByText('新しい正規表現アクションを作成')).toBeInTheDocument();

    // Click Appearance tab
    fireEvent.click(screen.getByText('外観・フォント'));
    expect(screen.getByText('カラーテーマ')).toBeInTheDocument();

    // Click Editor tab
    fireEvent.click(screen.getByText('エディタ設定'));
    expect(screen.getByText('行番号の表示 (Line Numbers)')).toBeInTheDocument();

    // Click Privacy & Exit tab
    fireEvent.click(screen.getByText('メモリ・終了'));
    expect(screen.getByText('完全インメモリ保護ポリシー')).toBeInTheDocument();
    expect(screen.getByText('アプリを完全終了')).toBeInTheDocument();
  });

  it('handles 2-step Quit App inline confirmation correctly', () => {
    const handleQuit = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={defaultSettings}
        onSaveSettings={vi.fn()}
        onQuitApp={handleQuit}
        initialTab="privacy"
      />
    );

    const quitBtn = screen.getByText('アプリを完全終了');
    expect(quitBtn).toBeInTheDocument();

    // 1st click: switches to confirmation prompt
    fireEvent.click(quitBtn);
    expect(screen.getByText('本当に終了しますか？ (再度クリック)')).toBeInTheDocument();
    expect(handleQuit).not.toHaveBeenCalled();

    // 2nd click: invokes onQuitApp
    fireEvent.click(screen.getByText('本当に終了しますか？ (再度クリック)'));
    expect(handleQuit).toHaveBeenCalledTimes(1);
  });
});
