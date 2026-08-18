import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Component Integration & Smoke Test', () => {
  it('renders App shell and header elements correctly', () => {
    render(<App />);

    expect(screen.getByText('inmem-memo')).toBeInTheDocument();
    expect(screen.getByText('JSON整形')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('opens Settings Modal when settings button is clicked', async () => {
    render(<App />);

    const settingsBtn = screen.getByText('設定');
    fireEvent.click(settingsBtn);

    await waitFor(() => {
      expect(screen.getByText('環境設定')).toBeInTheDocument();
    });
  });
});
