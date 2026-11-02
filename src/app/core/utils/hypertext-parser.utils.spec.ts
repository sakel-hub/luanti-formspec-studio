import { describe, it, expect } from 'vitest';
import { parseHypertext } from './hypertext-parser.utils';

describe('HypertextParserUtils', () => {
  it('handles empty or whitespace strings gracefully', () => {
    expect(parseHypertext('').html).toBe('');
    expect(parseHypertext('   ').html).toBe('');
  });

  it('strips unsafe HTML tags like script to prevent XSS', () => {
    const res = parseHypertext('<script>alert("xss")</script>');
    expect(res.html).not.toContain('<script>');
    expect(res.html).not.toContain('</script>');
  });

  it('converts newlines into line breaks <br>', () => {
    const res = parseHypertext('Line 1\nLine 2\nLine 3');
    expect(res.html).toContain('Line 1<br>Line 2<br>Line 3');
  });

  it('parses basic formatting tags (b, i, u, mono, bigger, smaller)', () => {
    const res = parseHypertext('<b>Bold</b> and <i>Italic</i> and <u>Underline</u> and <mono>Code</mono>');
    expect(res.html).toContain('<strong class="font-bold">Bold</strong>');
    expect(res.html).toContain('<em class="italic">Italic</em>');
    expect(res.html).toContain('<span class="underline">Underline</span>');
    expect(res.html).toContain('<code class="font-mono bg-black/40 px-1 py-0.5 rounded text-[0.9em]">Code</code>');
  });

  it('parses alignment blocks (center, left, right)', () => {
    const res = parseHypertext('<center>Centered Text</center>');
    expect(res.html).toContain('<div class="text-center w-full my-0.5">Centered Text</div>');
  });

  it('parses color and style tags with safe colors', () => {
    const res = parseHypertext('<color color=#34d399>Emerald</color>');
    expect(res.html).toContain('<span style="color: #34d399;">Emerald</span>');
  });

  it('extracts global styles correctly', () => {
    const res = parseHypertext('<global color=#34d399 background=#121214 halign=center size=16><b>Mythic Sword</b>\nDamage: 12 HP');
    expect(res.globalStyles.color).toBe('#34d399');
    expect(res.globalStyles.backgroundColor).toBe('#121214');
    expect(res.globalStyles.halign).toBe('center');
    expect(res.globalStyles.fontSize).toBe('16px');
    expect(res.html).toContain('<strong class="font-bold">Mythic Sword</strong><br>Damage: 12 HP');
  });

  it('parses inline item tags', () => {
    const res = parseHypertext('Equip: <item name=item_sword width=1 height=1>');
    expect(res.html).toContain('<img src="textures/item_sword.svg"');
    expect(res.html).toContain('alt="item_sword"');
  });

  it('parses interactive action links', () => {
    const res = parseHypertext('<action name=open_shop>Click Here</action>');
    expect(res.html).toContain('data-action="open_shop"');
    expect(res.html).toContain('Click Here');
  });
});
