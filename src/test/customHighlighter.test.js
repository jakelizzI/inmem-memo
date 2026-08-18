import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../utils/customHighlighter';

describe('detectLanguage Utility Tests', () => {
  it('correctly detects JSON', () => {
    expect(detectLanguage('{"name": "inmem-memo", "version": 1}')).toBe('json');
    expect(detectLanguage('  [ 1, 2, 3 ]  ')).toBe('json');
  });

  it('correctly detects YAML', () => {
    const yamlSample = 'server:\n  port: 8080\n  host: localhost\n';
    expect(detectLanguage(yamlSample)).toBe('yaml');
  });

  it('correctly detects JavaScript', () => {
    const jsSample = 'import React from "react";\nconst x = () => 10;\nexport default x;';
    expect(detectLanguage(jsSample)).toBe('javascript');
  });

  it('correctly detects Markdown', () => {
    const mdSample = '# Header Title\n\n- Item 1\n- Item 2\n\n```js\nconsole.log(1)\n```';
    expect(detectLanguage(mdSample)).toBe('markdown');
  });

  it('falls back to plain for generic text', () => {
    expect(detectLanguage('Just a quick shopping list:\nmilk, bread, eggs')).toBe('plain');
  });
});
