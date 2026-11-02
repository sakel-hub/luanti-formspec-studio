import { resolveTextureUrl } from './texture.utils';

export interface HypertextGlobalStyles {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  halign?: 'left' | 'center' | 'right' | 'justify';
  valign?: 'top' | 'middle' | 'bottom';
  fontFamily?: string;
}

export interface ParsedHypertext {
  html: string;
  globalStyles: HypertextGlobalStyles;
}

const SAFE_COLOR_REGEX = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20})$/;

/**
 * Validates and normalizes color strings for Luanti hypertext.
 */
function sanitizeColor(raw?: string): string | undefined {
  if (!raw) return undefined;
  const clean = raw.trim().replace(/^['"]|['"]$/g, '');
  if (SAFE_COLOR_REGEX.test(clean)) {
    return clean;
  }
  return undefined;
}

/**
 * Escapes HTML characters in raw text.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parses Luanti Hypertext markup into sanitized HTML and extracted global styles.
 * Supports:
 * - <global background=#color halign=... valign=... color=#color size=... font=...>
 * - <style color=... size=... font=...> / </style>
 * - <color color=...> / <color name=...> / </color>
 * - <b>...</b>, <i>...</i>, <u>...</u>, <mono>...</mono>
 * - <bigger>...</bigger>, <smaller>...</smaller>
 * - <center>...</center>, <left>...</left>, <right>...</right>, <justify>...</justify>
 * - <action name=action_name>...</action>
 * - <item name=... width=... height=...>
 * - <img name=... width=... height=...>
 * - \n (newlines mapped to <br>)
 */
export function parseHypertext(markup: string): ParsedHypertext {
  const globalStyles: HypertextGlobalStyles = {};
  if (!markup || !markup.trim()) {
    return { html: '', globalStyles };
  }

  // First pass: extract <global ...> tags
  let content = markup.replace(/<global\s+([^>]+)>(?:<\/global>)?/gi, (_, attrs) => {
    parseGlobalAttrs(attrs, globalStyles);
    return '';
  });

  // Tokenize markup into tags and text chunks
  const tagRegex = /<(\/)?([a-zA-Z0-9_]+)(?:\s+([^>]*))?>/g;
  let resultHtml = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(content)) !== null) {
    // Process text prior to this tag
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      resultHtml += formatText(textBefore);
    }
    lastIndex = match.index + match[0].length;

    const isClosing = match[1] === '/';
    const tagName = match[2].toLowerCase();
    const rawAttrs = match[3] || '';

    if (isClosing) {
      resultHtml += handleClosingTag(tagName);
    } else {
      resultHtml += handleOpeningTag(tagName, rawAttrs, globalStyles);
    }
  }

  // Remainder text
  if (lastIndex < content.length) {
    resultHtml += formatText(content.substring(lastIndex));
  }

  return {
    html: resultHtml.trim(),
    globalStyles,
  };
}

/**
 * Formats plain text segment: escapes HTML and converts newlines to <br>.
 */
function formatText(raw: string): string {
  return escapeHtml(raw).replace(/\r?\n/g, '<br>');
}

/**
 * Parses key=value attribute pairs from tag attributes.
 */
function parseAttributes(rawAttrs: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(rawAttrs)) !== null) {
    const key = m[1].toLowerCase();
    const val = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] || '';
    attrs[key] = val;
  }
  return attrs;
}

function parseGlobalAttrs(rawAttrs: string, styles: HypertextGlobalStyles): void {
  const attrs = parseAttributes(rawAttrs);
  if (attrs['color']) {
    const col = sanitizeColor(attrs['color']);
    if (col) styles.color = col;
  }
  if (attrs['background']) {
    const bg = sanitizeColor(attrs['background']);
    if (bg) styles.backgroundColor = bg;
  }
  if (attrs['halign'] && ['left', 'center', 'right', 'justify'].includes(attrs['halign'])) {
    styles.halign = attrs['halign'] as any;
  }
  if (attrs['valign'] && ['top', 'middle', 'bottom'].includes(attrs['valign'])) {
    styles.valign = attrs['valign'] as any;
  }
  if (attrs['size']) {
    const s = parseInt(attrs['size'], 10);
    if (!isNaN(s) && s >= 8 && s <= 48) {
      styles.fontSize = `${s}px`;
    }
  }
  if (attrs['font']) {
    if (attrs['font'].toLowerCase().includes('mono')) {
      styles.fontFamily = 'monospace';
    }
  }
}

function handleOpeningTag(
  tagName: string,
  rawAttrs: string,
  _globalStyles: HypertextGlobalStyles
): string {
  const attrs = parseAttributes(rawAttrs);

  switch (tagName) {
    case 'b':
      return '<strong class="font-bold">';
    case 'i':
      return '<em class="italic">';
    case 'u':
      return '<span class="underline">';
    case 'mono':
      return '<code class="font-mono bg-black/40 px-1 py-0.5 rounded text-[0.9em]">';
    case 'bigger':
      return '<span class="text-[1.2em] font-semibold">';
    case 'smaller':
      return '<span class="text-[0.85em] opacity-80">';
    case 'center':
      return '<div class="text-center w-full my-0.5">';
    case 'left':
      return '<div class="text-left w-full my-0.5">';
    case 'right':
      return '<div class="text-right w-full my-0.5">';
    case 'justify':
      return '<div class="text-justify w-full my-0.5">';

    case 'color': {
      const colorVal = sanitizeColor(attrs['color'] || attrs['name']);
      return colorVal ? `<span style="color: ${colorVal};">` : '<span>';
    }

    case 'style': {
      const inlineStyles: string[] = [];
      if (attrs['color']) {
        const col = sanitizeColor(attrs['color']);
        if (col) inlineStyles.push(`color: ${col}`);
      }
      if (attrs['background']) {
        const bg = sanitizeColor(attrs['background']);
        if (bg) inlineStyles.push(`background-color: ${bg}`);
      }
      if (attrs['size']) {
        const sz = parseInt(attrs['size'], 10);
        if (!isNaN(sz) && sz >= 8 && sz <= 48) inlineStyles.push(`font-size: ${sz}px`);
      }
      if (attrs['font'] && attrs['font'].toLowerCase().includes('mono')) {
        inlineStyles.push('font-family: monospace');
      }
      return inlineStyles.length > 0
        ? `<span style="${inlineStyles.join('; ')};">`
        : '<span>';
    }

    case 'action': {
      const actionName = escapeHtml(attrs['name'] || '');
      return `<span class="text-emerald-400 underline cursor-pointer hover:text-emerald-300 font-medium" data-action="${actionName}" title="Luanti action: ${actionName}">`;
    }

    case 'item': {
      const itemName = attrs['name'] || 'unknown';
      const wSlots = parseFloat(attrs['width'] || '1') || 1;
      const hSlots = parseFloat(attrs['height'] || '1') || 1;
      const pxW = Math.max(16, Math.min(64, Math.round(wSlots * 24)));
      const pxH = Math.max(16, Math.min(64, Math.round(hSlots * 24)));
      const textureUrl = resolveTextureUrl(itemName);
      return `<img src="${textureUrl}" alt="${escapeHtml(itemName)}" title="${escapeHtml(itemName)}" class="inline-block align-middle pixelated mx-1" style="width: ${pxW}px; height: ${pxH}px;" />`;
    }

    case 'img': {
      const imgName = attrs['name'] || 'unknown';
      const wSlots = parseFloat(attrs['width'] || '1') || 1;
      const hSlots = parseFloat(attrs['height'] || '1') || 1;
      const pxW = Math.max(16, Math.min(128, Math.round(wSlots * 24)));
      const pxH = Math.max(16, Math.min(128, Math.round(hSlots * 24)));
      const textureUrl = resolveTextureUrl(imgName);
      return `<img src="${textureUrl}" alt="${escapeHtml(imgName)}" title="${escapeHtml(imgName)}" class="inline-block align-middle pixelated mx-1" style="width: ${pxW}px; height: ${pxH}px;" />`;
    }

    default:
      return '';
  }
}

function handleClosingTag(tagName: string): string {
  switch (tagName) {
    case 'b':
      return '</strong>';
    case 'i':
      return '</em>';
    case 'u':
    case 'color':
    case 'style':
    case 'bigger':
    case 'smaller':
    case 'action':
      return '</span>';
    case 'mono':
      return '</code>';
    case 'center':
    case 'left':
    case 'right':
    case 'justify':
      return '</div>';
    default:
      return '';
  }
}
