import { describe, it, expect } from 'vitest';
import { highlightLua, highlightFormspec } from './syntax-highlighter.utils';

describe('SyntaxHighlighterUtils', () => {
  it('highlights Lua keywords, strings, comments, and numbers', () => {
    const lua = 'local function test() -- a comment\n  return 42\nend';
    const html = highlightLua(lua);

    expect(html).toContain('text-purple-400 font-semibold">local</span>');
    expect(html).toContain('text-purple-400 font-semibold">function</span>');
    expect(html).toContain('text-zinc-500 italic">-- a comment</span>');
    expect(html).toContain('text-amber-400">42</span>');
    expect(html).toContain('text-purple-400 font-semibold">end</span>');
  });

  it('highlights Luanti engine APIs and functions', () => {
    const lua = 'core.register_node("mod:chest", { description = "Chest" })';
    const html = highlightLua(lua);

    expect(html).toContain('text-sky-400 font-semibold">core</span>');
    expect(html).toContain('text-yellow-300 font-medium">register_node</span>');
    expect(html).toContain('text-emerald-300 font-medium">&quot;mod:chest&quot;</span>');
  });

  it('highlights Formspec tags and coordinate parameters', () => {
    const formspec = 'formspec_version[7]size[10,8]button[1,2;3,1;btn;Click]';
    const html = highlightFormspec(formspec);

    expect(html).toContain('text-emerald-400 font-bold">formspec_version</span>');
    expect(html).toContain('text-emerald-400 font-bold">size</span>');
    expect(html).toContain('text-emerald-400 font-bold">button</span>');
    expect(html).toContain('text-amber-300 font-mono">10</span>');
    expect(html).toContain('text-purple-400">[</span>');
    expect(html).toContain('text-purple-400">]</span>');
  });
});
