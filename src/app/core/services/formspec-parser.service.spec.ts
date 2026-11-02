import { describe, it, expect } from 'vitest';
import { FormspecParserService } from './formspec-parser.service';
import { FormspecAST } from '../models/formspec.models';

describe('FormspecParserService', () => {
  const service = new FormspecParserService();

  it('escapes and unescapes formspec delimiter characters', () => {
    const raw = 'Text with [brackets], semicolons; and commas,';
    const escaped = service.escape(raw);
    expect(escaped).toBe('Text with \\[brackets\\]\\, semicolons\\; and commas\\,');
    expect(service.unescape(escaped)).toBe(raw);
  });

  it('serializes a basic formspec AST to canonical string', () => {
    const ast: FormspecAST = {
      version: 7,
      size: { w: 10, h: 8 },
      padding: { x: 0, y: 0 },
      styles: [],
      children: [
        {
          id: 'btn1',
          type: 'button',
          x: 2,
          y: 4,
          w: 3,
          h: 1,
          name: 'btn_test',
          label: 'Click Me',
        },
      ],
    };

    const str = service.serialize(ast);
    expect(str).toContain('formspec_version[7]');
    expect(str).toContain('size[10,8]');
    expect(str).toContain('padding[0,0]');
    expect(str).toContain('button[2,4;3,1;btn_test;Click Me]');
  });

  it('parses formspec strings into AST nodes', () => {
    const raw = 'formspec_version[7]size[8,6]button[1,2;3,1;submit;Save]';
    const ast = service.parse(raw);

    expect(ast.version).toBe(7);
    expect(ast.size.w).toBe(8);
    expect(ast.size.h).toBe(6);
    expect(ast.children.length).toBe(1);
    expect(ast.children[0].type).toBe('button');
    expect(ast.children[0].x).toBe(1);
    expect(ast.children[0].y).toBe(2);
    expect(ast.children[0].w).toBe(3);
    expect(ast.children[0].h).toBe(1);
    expect(ast.children[0].name).toBe('submit');
    expect(ast.children[0].label).toBe('Save');
  });

  it('serializes and parses modern Luanti elements (hypertip, model, button_url, allow_close)', () => {
    const ast: FormspecAST = {
      version: 11,
      size: { w: 12, h: 9 },
      allowClose: false,
      styles: [],
      children: [
        {
          id: 'm1',
          type: 'model',
          x: 1,
          y: 1,
          w: 3,
          h: 4,
          name: 'player_mesh',
          mesh: 'character.b3d',
          meshTextures: 'character.png',
          meshRotation: '0,180',
          animationSpeed: 30,
        },
        {
          id: 'h1',
          type: 'hypertip',
          x: 4,
          y: 1,
          w: 3,
          h: 1,
          name: 'tip1',
          tooltipText: '<global color=#00ff00>Item Info</global>',
        },
        {
          id: 'u1',
          type: 'button_url',
          x: 4,
          y: 3,
          w: 3,
          h: 0.8,
          name: 'btn_docs',
          label: 'Visit Docs',
          url: 'https://luanti.org',
        },
      ],
    };

    const serialized = service.serialize(ast);
    expect(serialized).toContain('formspec_version[11]');
    expect(serialized).toContain('allow_close[false]');
    expect(serialized).toContain('model[1,1;3,4;player_mesh;character.b3d;character.png;0,180;false;true;0,79;30]');
    expect(serialized).toContain('hypertip[tip1;;15;tip1_tip;<global color=#00ff00>Item Info</global>]');
    expect(serialized).toContain('button_url[4,3;3,0.8;btn_docs;Visit Docs;https://luanti.org]');

    const parsed = service.parse(serialized);
    expect(parsed.version).toBe(11);
    expect(parsed.allowClose).toBe(false);
    expect(parsed.children.some((c) => c.type === 'model')).toBe(true);
    expect(parsed.children.some((c) => c.type === 'button_url')).toBe(true);
  });
});
