import { describe, it, expect } from 'vitest';
import { resolveTextureUrl, createPlaceholderDataUri } from './texture.utils';

describe('texture.utils', () => {
  describe('resolveTextureUrl', () => {
    it('resolves known bundled textures to static asset paths', () => {
      expect(resolveTextureUrl('gui_formspec_bg.png')).toBe('textures/gui_formspec_bg.svg');
      expect(resolveTextureUrl('default_chest_front.png')).toBe('textures/default_chest_front.svg');
      expect(resolveTextureUrl('default_furnace_fire_bg.png')).toBe(
        'textures/default_furnace_fire_bg.svg',
      );
      expect(resolveTextureUrl('gui_furnace_arrow_bg.png^[transformR270]')).toBe(
        'textures/gui_furnace_arrow_bg.svg',
      );
      expect(resolveTextureUrl('heart.png')).toBe('textures/heart.svg');
      expect(resolveTextureUrl('item_sword.png')).toBe('textures/item_sword.svg');
    });

    it('preserves absolute URLs and data URIs', () => {
      const url = 'https://example.com/texture.png';
      expect(resolveTextureUrl(url)).toBe(url);

      const dataUri = 'data:image/svg+xml;utf8,<svg></svg>';
      expect(resolveTextureUrl(dataUri)).toBe(dataUri);
    });

    it('generates a placeholder SVG data URI for unknown textures', () => {
      const result = resolveTextureUrl('custom_ore.png');
      expect(result.startsWith('data:image/svg+xml')).toBe(true);
      expect(decodeURIComponent(result)).toContain('custom_ore.png');
    });

    it('generates fallback placeholder when given empty or undefined input', () => {
      const result = resolveTextureUrl('');
      expect(result.startsWith('data:image/svg+xml')).toBe(true);
    });
  });

  describe('createPlaceholderDataUri', () => {
    it('creates a valid SVG data URI containing the label', () => {
      const uri = createPlaceholderDataUri('custom_item.png');
      expect(uri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
      expect(decodeURIComponent(uri)).toContain('custom_item.png');
    });

    it('truncates very long labels cleanly', () => {
      const uri = createPlaceholderDataUri('this_is_an_extremely_long_texture_filename.png');
      expect(decodeURIComponent(uri)).toContain('...');
    });
  });
});
