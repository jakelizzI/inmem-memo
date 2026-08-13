import { StreamLanguage, foldService, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/**
 * Detect language automatically from text content
 * @param {string} text
 * @returns {'json' | 'yaml' | 'javascript' | 'markdown' | 'plain'}
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'plain';
  const trimmed = text.trim();
  if (!trimmed) return 'plain';

  // 1. JSON detection: starts with { or [ and looks like valid or partial JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return 'json';
  }
  if (/^\s*\{\s*"[\w\d_-]+"\s*:/m.test(trimmed)) {
    return 'json';
  }

  // 2. YAML detection: key: value with indentation or list dashes, without braces
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[') &&
      (/^[\w\d_-]+\s*:\s*(?:[^\n]+)?$/m.test(trimmed) || /^-\s+[\w\d_-]+/m.test(trimmed))) {
    // Exclude simple Markdown lists if there are headers
    if (!/^#{1,6}\s+/m.test(trimmed)) {
      return 'yaml';
    }
  }

  // 3. Markdown detection: headers #, code blocks ```, or markdown links
  if (/^#{1,6}\s+/m.test(trimmed) || /```[\s\S]*?```/m.test(trimmed) || /\[.+?\]\(.+?\)/m.test(trimmed)) {
    return 'markdown';
  }

  // 4. JavaScript / TypeScript detection
  if (/\b(const|let|var|function|import|export|class|async|await|return|if|else)\b/.test(trimmed)) {
    return 'javascript';
  }

  return 'plain';
}

/**
 * Custom StreamParser for JSON with syntax highlighting
 */
export const customJsonParser = {
  token(stream, state) {
    if (stream.eatSpace()) return null;

    // String or Key
    if (stream.peek() === '"') {
      stream.next();
      let escaped = false;
      while (!stream.eol()) {
        const next = stream.next();
        if (next === '"' && !escaped) break;
        escaped = !escaped && next === '\\';
      }
      // Check if this string is followed by a colon (making it a JSON key)
      if (stream.match(/^\s*:/, false)) {
        return 'propertyName';
      }
      return 'string';
    }

    // Number
    if (stream.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)) {
      return 'number';
    }

    // Boolean & Null
    if (stream.match(/^(?:true|false)\b/)) {
      return 'bool';
    }
    if (stream.match(/^null\b/)) {
      return 'null';
    }

    // Brackets & Punctuation
    const ch = stream.next();
    if (ch === '{' || ch === '}' || ch === '[' || ch === ']') {
      return 'bracket';
    }
    if (ch === ':' || ch === ',') {
      return 'punctuation';
    }

    return null;
  }
};

/**
 * Custom StreamParser for YAML
 */
export const customYamlParser = {
  token(stream) {
    if (stream.eatSpace()) return null;

    // Comments
    if (stream.peek() === '#') {
      stream.skipToEnd();
      return 'comment';
    }

    // List indicator
    if (stream.match(/^-\s+/)) {
      return 'punctuation';
    }

    // Key definition (e.g. key:)
    if (stream.match(/^[\w\d_-]+(?=\s*:)/)) {
      return 'propertyName';
    }

    // Quoted strings
    if (stream.peek() === '"' || stream.peek() === "'") {
      const quote = stream.next();
      let escaped = false;
      while (!stream.eol()) {
        const next = stream.next();
        if (next === quote && !escaped) break;
        escaped = !escaped && next === '\\';
      }
      return 'string';
    }

    // Numbers & Booleans
    if (stream.match(/^-?\d+(?:\.\d+)?\b/)) return 'number';
    if (stream.match(/^(?:true|false|yes|no|on|off)\b/i)) return 'bool';
    if (stream.match(/^(?:null|~)\b/i)) return 'null';

    // Separators
    const ch = stream.next();
    if (ch === ':' || ch === '-' || ch === '[' || ch === ']' || ch === '{' || ch === '}') {
      return 'punctuation';
    }

    // Normal word/value
    stream.match(/^[^\s:#,\[\]{}]+/);
    return 'atom';
  }
};

/**
 * Custom StreamParser for JavaScript
 */
export const customJsParser = {
  token(stream) {
    if (stream.eatSpace()) return null;

    // Line Comments
    if (stream.match(/^\/\/.*/)) {
      return 'comment';
    }
    // Block Comments
    if (stream.match(/^\/\*[\s\S]*?\*\//)) {
      return 'comment';
    }

    // Strings
    if (stream.peek() === '"' || stream.peek() === "'" || stream.peek() === '`') {
      const quote = stream.next();
      let escaped = false;
      while (!stream.eol()) {
        const next = stream.next();
        if (next === quote && !escaped) break;
        escaped = !escaped && next === '\\';
      }
      return 'string';
    }

    // Keywords
    if (stream.match(/^(?:const|let|var|function|return|if|else|for|while|import|export|from|class|extends|async|await|try|catch|throw|new|typeof|instanceof|switch|case|default|break|continue)\b/)) {
      return 'keyword';
    }

    // Booleans & Null
    if (stream.match(/^(?:true|false)\b/)) return 'bool';
    if (stream.match(/^(?:null|undefined|NaN)\b/)) return 'null';

    // Numbers
    if (stream.match(/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i) || stream.match(/^0x[0-9a-fA-F]+\b/)) {
      return 'number';
    }

    // Function calls e.g. foo(
    if (stream.match(/^[\w$]+(?=\s*\()/)) {
      return 'functionName';
    }

    // Variable / identifier
    if (stream.match(/^[a-zA-Z_$][\w$]*/)) {
      return 'variableName';
    }

    stream.next();
    return 'punctuation';
  }
};

/**
 * Custom StreamParser for Markdown
 */
export const customMarkdownParser = {
  token(stream) {
    // Headers #, ##, etc.
    if (stream.sol() && stream.match(/^#{1,6}\s+.*/)) {
      return 'heading';
    }

    // Code blocks ```
    if (stream.match(/^```[\w]*/)) {
      return 'keyword';
    }

    // Inline code `...`
    if (stream.match(/^`[^`]+`/)) {
      return 'string';
    }

    // Links [text](url)
    if (stream.match(/^\[[^\]]+\]\([^)]+\)/)) {
      return 'link';
    }

    // Bold **text**
    if (stream.match(/^\*\*[^*]+\*\*/)) {
      return 'strong';
    }

    // Lists -, *, 1.
    if (stream.sol() && stream.match(/^(?:[-*+]|\d+\.)\s+/)) {
      return 'punctuation';
    }

    stream.next();
    return null;
  }
};

/**
 * Custom StreamLanguages
 */
export const customJsonLanguage = StreamLanguage.define(customJsonParser);
export const customYamlLanguage = StreamLanguage.define(customYamlParser);
export const customJsLanguage = StreamLanguage.define(customJsParser);
export const customMarkdownLanguage = StreamLanguage.define(customMarkdownParser);

/**
 * Custom Code Folding Service for JSON, Braces, Arrays, and YAML Indentation
 */
export const customFoldingService = foldService.of((state, lineStart, lineEnd) => {
  const line = state.doc.lineAt(lineStart);
  const text = line.text;

  // 1. Bracket / Brace Folding: { ... } or [ ... ]
  let openBraceIndex = text.lastIndexOf('{');
  let openBracketIndex = text.lastIndexOf('[');

  let openIndex = -1;
  let closeChar = '';
  if (openBraceIndex !== -1 && openBraceIndex >= openBracketIndex) {
    openIndex = openBraceIndex;
    closeChar = '}';
  } else if (openBracketIndex !== -1) {
    openIndex = openBracketIndex;
    closeChar = ']';
  }

  if (openIndex !== -1) {
    const from = line.from + openIndex + 1;
    // Scan subsequent lines for matching closing brace
    let depth = 1;
    const openChar = closeChar === '}' ? '{' : '[';

    for (let l = line.number + 1; l <= state.doc.lines; l++) {
      const nextLine = state.doc.line(l);
      const str = nextLine.text;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === openChar) depth++;
        else if (str[i] === closeChar) {
          depth--;
          if (depth === 0) {
            const to = nextLine.from + i;
            if (from < to) {
              return { from, to };
            }
          }
        }
      }
    }
  }

  // 2. YAML / Indentation Folding: If next lines have deeper indentation
  const indentMatch = text.match(/^(\s*)/);
  const currentIndent = indentMatch ? indentMatch[1].length : 0;
  if (text.trim().length > 0 && line.number < state.doc.lines) {
    let endLine = line.number;
    for (let l = line.number + 1; l <= state.doc.lines; l++) {
      const nextLine = state.doc.line(l);
      if (!nextLine.text.trim()) continue; // Skip blank lines
      const nextIndentMatch = nextLine.text.match(/^(\s*)/);
      const nextIndent = nextIndentMatch ? nextIndentMatch[1].length : 0;
      if (nextIndent > currentIndent) {
        endLine = l;
      } else {
        break;
      }
    }
    if (endLine > line.number) {
      const from = line.to;
      const to = state.doc.line(endLine).to;
      return { from, to };
    }
  }

  return null;
});

/**
 * Custom Highlight Styles matching InMem Themes (Midnight, OLED, Clean Light)
 */
export const customDarkHighlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: '#38bdf8', fontWeight: '600' }, // Cyan for JSON Keys
  { tag: t.string, color: '#34d399' },                         // Emerald for Strings
  { tag: t.number, color: '#fbbf24' },                         // Amber for Numbers
  { tag: t.bool, color: '#c084fc', fontWeight: '600' },        // Purple for Booleans
  { tag: t.null, color: '#94a3b8', fontStyle: 'italic' },      // Muted for Null
  { tag: t.keyword, color: '#f472b6', fontWeight: '600' },     // Pink for Keywords
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },   // Slate for Comments
  { tag: t.function(t.variableName), color: '#60a5fa' },       // Blue for Functions
  { tag: t.heading, color: '#38bdf8', fontWeight: 'bold' },    // Cyan for MD Headers
  { tag: t.bracket, color: '#cbd5e1' },                        // Light Slate for Brackets
  { tag: t.punctuation, color: '#94a3b8' }                     // Slate for Punctuation
]);

export const customLightHighlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: '#0284c7', fontWeight: '600' }, // Dark Cyan for JSON Keys
  { tag: t.string, color: '#059669' },                         // Dark Emerald for Strings
  { tag: t.number, color: '#d97706' },                         // Dark Amber for Numbers
  { tag: t.bool, color: '#9333ea', fontWeight: '600' },        // Dark Purple for Booleans
  { tag: t.null, color: '#64748b', fontStyle: 'italic' },      // Muted Slate for Null
  { tag: t.keyword, color: '#db2777', fontWeight: '600' },     // Dark Pink for Keywords
  { tag: t.comment, color: '#94a3b8', fontStyle: 'italic' },   // Light Slate for Comments
  { tag: t.function(t.variableName), color: '#2563eb' },       // Blue for Functions
  { tag: t.heading, color: '#0284c7', fontWeight: 'bold' },    // Dark Cyan for MD Headers
  { tag: t.bracket, color: '#475569' },                        // Slate for Brackets
  { tag: t.punctuation, color: '#64748b' }                     // Slate for Punctuation
]);
