/**
 * Pure TypeScript syntax highlighter for Lua and Luanti Formspec.
 * Safely HTML-escapes content and applies themed span styling.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function highlightLua(source: string): string {
  if (!source) return '';

  const lines = source.split('\n');
  const highlightedLines = lines.map((line) => highlightLuaLine(line));
  return highlightedLines.join('\n');
}

function highlightLuaLine(line: string): string {
  // Check for whole line or inline comment: --
  const commentIdx = line.indexOf('--');
  if (commentIdx !== -1) {
    const codePart = line.substring(0, commentIdx);
    const commentPart = line.substring(commentIdx);
    return `${highlightLuaTokens(codePart)}<span class="text-zinc-500 italic">${escapeHtml(commentPart)}</span>`;
  }
  return highlightLuaTokens(line);
}

function highlightLuaTokens(code: string): string {
  // Tokenizer pattern matching:
  // 1. Strings: "..." or '...'
  // 2. Numbers: \b\d+(\.\d+)?\b
  // 3. Identifiers / words: \b[A-Za-z_][A-Za-z0-9_]*\b
  // 4. Operators / punctuation
  const tokenRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)|([=+\-*\/%^#~<>;:,.()\[\]{}]+)/g;

  const keywords = new Set([
    'local',
    'function',
    'end',
    'return',
    'if',
    'then',
    'else',
    'elseif',
    'for',
    'in',
    'do',
    'while',
    'repeat',
    'until',
    'not',
    'and',
    'or',
    'nil',
    'true',
    'false',
  ]);

  const apiNames = new Set([
    'core',
    'minetest',
    'math',
    'string',
    'table',
    'pairs',
    'ipairs',
    'type',
    'tostring',
    'tonumber',
    'print',
  ]);

  const engineFuncs = new Set([
    'register_node',
    'register_chatcommand',
    'register_on_player_receive_fields',
    'get_player_window_information',
    'show_formspec',
    'close_formspec',
    'formspec_escape',
    'get_player_by_name',
    'get_modpath',
  ]);

  return code.replace(tokenRegex, (match, str, num, ident, op) => {
    if (str) {
      return `<span class="text-emerald-300 font-medium">${escapeHtml(str)}</span>`;
    }
    if (num) {
      return `<span class="text-amber-400">${escapeHtml(num)}</span>`;
    }
    if (ident) {
      if (keywords.has(ident)) {
        return `<span class="text-purple-400 font-semibold">${escapeHtml(ident)}</span>`;
      }
      if (apiNames.has(ident)) {
        return `<span class="text-sky-400 font-semibold">${escapeHtml(ident)}</span>`;
      }
      if (engineFuncs.has(ident)) {
        return `<span class="text-yellow-300 font-medium">${escapeHtml(ident)}</span>`;
      }
      return `<span class="text-zinc-200">${escapeHtml(ident)}</span>`;
    }
    if (op) {
      if (op === '=' || op === '==' || op === '..' || op === '~=') {
        return `<span class="text-rose-400 font-bold">${escapeHtml(op)}</span>`;
      }
      return `<span class="text-zinc-400">${escapeHtml(op)}</span>`;
    }
    return escapeHtml(match);
  });
}

export function highlightFormspec(raw: string): string {
  if (!raw) return '';

  // Formspec syntax: tag[args]
  const tagRegex = /([a-z_0-9]+)\s*(\[)([^\]]*)(\])/gi;

  let lastIndex = 0;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(raw)) !== null) {
    // Add text preceding the tag
    if (match.index > lastIndex) {
      result += escapeHtml(raw.substring(lastIndex, match.index));
    }

    const tagName = match[1];
    const openBracket = match[2];
    const content = match[3];
    const closeBracket = match[4];

    result += `<span class="text-emerald-400 font-bold">${escapeHtml(tagName)}</span>`;
    result += `<span class="text-purple-400">${escapeHtml(openBracket)}</span>`;

    // Highlight parameters in content (numbers in amber, delimiters in zinc)
    const highlightedContent = content.replace(
      /([^;,\s]+)|([;,])/g,
      (_m, val, delim) => {
        if (delim) {
          return `<span class="text-zinc-500 font-bold">${escapeHtml(delim)}</span>`;
        }
        if (/^\d+(\.\d+)?$/.test(val)) {
          return `<span class="text-amber-300 font-mono">${escapeHtml(val)}</span>`;
        }
        if (val === 'true' || val === 'false') {
          return `<span class="text-purple-300 font-semibold">${escapeHtml(val)}</span>`;
        }
        return `<span class="text-sky-200">${escapeHtml(val)}</span>`;
      }
    );

    result += highlightedContent;
    result += `<span class="text-purple-400">${escapeHtml(closeBracket)}</span>`;

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    result += escapeHtml(raw.substring(lastIndex));
  }

  return result;
}
