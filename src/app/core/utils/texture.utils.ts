/**
 * Utility for resolving and providing textures / placeholder graphics for Luanti Formspec elements.
 */

const KNOWN_TEXTURES: Record<string, string> = {
  'gui_formspec_bg.png': 'textures/gui_formspec_bg.svg',
  gui_formspec_bg: 'textures/gui_formspec_bg.svg',
  'gui_hb_bg.png': 'textures/gui_hb_bg.svg',
  gui_hb_bg: 'textures/gui_hb_bg.svg',
  'default_chest_front.png': 'textures/default_chest_front.svg',
  default_chest_front: 'textures/default_chest_front.svg',
  'heart.png': 'textures/heart.svg',
  heart: 'textures/heart.svg',
  'bubble.png': 'textures/bubble.svg',
  bubble: 'textures/bubble.svg',
  'default_wood.png': 'textures/default_wood.svg',
  default_wood: 'textures/default_wood.svg',
  'item_sword.png': 'textures/item_sword.svg',
  item_sword: 'textures/item_sword.svg',
  'character.png': 'textures/character.svg',
  character: 'textures/character.svg',
  'character.b3d': 'textures/character.svg',
  'spritesheet_sample.png': 'textures/spritesheet_sample.svg',
  'default_furnace_fire_bg.png': 'textures/default_furnace_fire_bg.svg',
  default_furnace_fire_bg: 'textures/default_furnace_fire_bg.svg',
  'gui_furnace_arrow_bg.png': 'textures/gui_furnace_arrow_bg.svg',
  gui_furnace_arrow_bg: 'textures/gui_furnace_arrow_bg.svg',
};

/**
 * Resolves texture name to either bundled texture SVG, URL, or generated placeholder data URI.
 */
export function resolveTextureUrl(name?: string): string {
  if (!name || !name.trim()) {
    return createPlaceholderDataUri('texture.png');
  }

  const trimmed = name.trim();

  // If already an absolute URL or data URI
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Handle Luanti texture modifiers like ^[transformR270] or ^[colorize:#ff0000
  const baseName = trimmed.split('^')[0].trim();

  // Check known textures table (full string or base name)
  const mapped =
    KNOWN_TEXTURES[trimmed] ||
    KNOWN_TEXTURES[trimmed.toLowerCase()] ||
    KNOWN_TEXTURES[baseName] ||
    KNOWN_TEXTURES[baseName.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  // Generate dynamic Luanti-style placeholder SVG
  return createPlaceholderDataUri(baseName || trimmed);
}

/**
 * Generates an SVG data URI placeholder for unknown or user-specified textures.
 */
export function createPlaceholderDataUri(label: string): string {
  const cleanLabel = escapeXml(label.length > 20 ? label.slice(0, 18) + '...' : label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#18181c"/>
    <rect x="2" y="2" width="60" height="60" fill="#24242c" stroke="#383844" stroke-width="1.5" rx="3"/>
    <rect x="6" y="6" width="52" height="52" fill="#1e1e24" stroke="#2d2d38" stroke-dasharray="3,3" stroke-width="1"/>
    <circle cx="32" cy="26" r="10" fill="#334155" opacity="0.6"/>
    <path d="M26,26 L38,26 M32,20 L32,32" stroke="#94a3b8" stroke-width="2"/>
    <text x="32" y="50" font-family="monospace" font-size="7" fill="#10b981" font-weight="bold" text-anchor="middle">${cleanLabel}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
