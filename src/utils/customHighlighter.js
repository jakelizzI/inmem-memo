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

  // 1. JSON detection: starts and ends with { } or [ ] or clear JSON key-value
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return 'json';
  }
  if (/^\s*\{\s*"[\w\d_-]+"\s*:/m.test(trimmed)) {
    return 'json';
  }

  // 2. Markdown detection: headers, code blocks, links, or bullet/numbered lists
  // (Evaluated before YAML to prevent list syntax from being misclassified as YAML)
  if (/^#{1,6}\s+/m.test(trimmed) || 
      /```[\s\S]*?```/m.test(trimmed) || 
      /\[.+?\]\(.+?\)/m.test(trimmed) ||
      /^(?:[-*+]|\d+\.)\s+\S+/m.test(trimmed)) {
    return 'markdown';
  }

  // 3. JavaScript / TypeScript detection: requires structural signals
  const hasJsKeywords = /\b(const|let|var|function|import|export|class|async|await|return|if|else)\b/g;
  const keywordMatches = trimmed.match(hasJsKeywords) || [];
  const hasArrowFunc = /=>\s*[{\w]/.test(trimmed);
  const hasImportExport = /^(?:import\s+.+\s+from\s+['"]|export\s+(?:default\s+)?(?:const|let|var|function|class))/m.test(trimmed);
  const hasFunctionDecl = /function\s+[\w$]+\s*\(/.test(trimmed);

  if (hasImportExport || hasFunctionDecl || hasArrowFunc || keywordMatches.length >= 2) {
    return 'javascript';
  }

  // 4. YAML detection: key: value pairs with indentation or comment lines
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[') &&
      (/^[\w\d_-]+\s*:\s*(?:[^\n]+)?$/m.test(trimmed) || /^#\s+\S+/m.test(trimmed))) {
    return 'yaml';
  }

  return 'plain';
}

/**
 * Custom StreamParser for JSON with syntax highlighting
 */
export const customJsonParser = {
  token(stream) {
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

    // Function calls e.g. foo( -> variableName.function
    if (stream.match(/^[\w$]+(?=\s*\()/)) {
      return 'variableName.function';
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
 * Bounded forward scan budget for performance (max lines to search for matching bracket/fold)
 */
const MAX_FOLD_SCAN_LINES = 1000;

/**
 * Helper to check if a quote character at index starts a string literal
 * Avoids treating prose/word apostrophes (e.g. "don't", "it's") as string openers
 */
function isStringQuote(char, index, str, inString, stringQuote) {
  if (index > 0 && str[index - 1] === '\\') return false; // Escaped
  if (inString) {
    return char === stringQuote; // Close matching quote
  }
  if (char === '"') return true;
  if (char === "'") {
    // Only treat single quote as string opener if not immediately preceded by a word character
    if (index === 0) return true;
    const prevChar = str[index - 1];
    return !/[\w\d]/.test(prevChar);
  }
  return false;
}

/**
 * Custom Code Folding Service for JSON, Braces, Arrays, and YAML Indentation
 */
export const customFoldingService = foldService.of((state, lineStart) => {
  const line = state.doc.lineAt(lineStart);
  const text = line.text;

  // 1. Bracket / Brace Folding: { ... } or [ ... ]
  const openBraceIndex = text.lastIndexOf('{');
  const openBracketIndex = text.lastIndexOf('[');

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
    let depth = 1;
    const openChar = closeChar === '}' ? '{' : '[';
    const maxLine = Math.min(state.doc.lines, line.number + MAX_FOLD_SCAN_LINES);

    // Scan rest of current line first
    const restOfFirstLine = text.slice(openIndex + 1);
    let inString = false;
    let stringQuote = '';

    for (let i = 0; i < restOfFirstLine.length; i++) {
      const char = restOfFirstLine[i];
      if ((char === '"' || char === "'") && isStringQuote(char, i, restOfFirstLine, inString, stringQuote)) {
        if (!inString) { inString = true; stringQuote = char; }
        else if (stringQuote === char) { inString = false; }
        continue;
      }
      if (inString) continue;

      if (char === openChar) depth++;
      else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          const to = line.from + openIndex + 1 + i;
          return from < to ? { from, to } : null;
        }
      }
    }

    // Scan subsequent lines up to budget
    for (let l = line.number + 1; l <= maxLine; l++) {
      const nextLine = state.doc.line(l);
      const str = nextLine.text;
      inString = false;

      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if ((char === '"' || char === "'") && isStringQuote(char, i, str, inString, stringQuote)) {
          if (!inString) { inString = true; stringQuote = char; }
          else if (stringQuote === char) { inString = false; }
          continue;
        }
        if (inString) continue;

        if (char === openChar) depth++;
        else if (char === closeChar) {
          depth--;
          if (depth === 0) {
            const to = nextLine.from + i;
            return from < to ? { from, to } : null;
          }
        }
      }
    }
  }

  // 2. Indentation-based Folding (Active for YAML / Plain / Indented structures)
  const isBracketLanguage = text.includes('{') || text.includes('}') || text.includes(';');
  if (!isBracketLanguage && text.trim().length > 0 && line.number < state.doc.lines) {
    const indentMatch = text.match(/^(\s*)/);
    const currentIndent = indentMatch ? indentMatch[1].length : 0;
    const maxLine = Math.min(state.doc.lines, line.number + MAX_FOLD_SCAN_LINES);
    let endLine = line.number;

    for (let l = line.number + 1; l <= maxLine; l++) {
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
      return from < to ? { from, to } : null;
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
  { tag: t.variableName, color: '#f3f4f6' },                   // Light for JS Identifiers
  { tag: t.atom, color: '#38bdf8' },                           // Cyan for YAML Scalars
  { tag: t.heading, color: '#38bdf8', fontWeight: 'bold' },    // Cyan for MD Headers
  { tag: t.link, color: '#818cf8', textDecoration: 'underline' }, // Indigo for Links
  { tag: t.strong, fontWeight: 'bold', color: '#f8fafc' },     // Bold for Strong
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
  { tag: t.variableName, color: '#1e293b' },                   // Dark Slate for JS Identifiers
  { tag: t.atom, color: '#0284c7' },                           // Dark Cyan for YAML Scalars
  { tag: t.heading, color: '#0284c7', fontWeight: 'bold' },    // Dark Cyan for MD Headers
  { tag: t.link, color: '#4f46e5', textDecoration: 'underline' }, // Indigo for Links
  { tag: t.strong, fontWeight: 'bold', color: '#0f172a' },     // Bold for Strong
  { tag: t.bracket, color: '#475569' },                        // Slate for Brackets
  { tag: t.punctuation, color: '#64748b' }                     // Slate for Punctuation
]);
