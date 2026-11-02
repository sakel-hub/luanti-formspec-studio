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

  it('supports Luanti 5.18.0 features: listimages and editable=false styles', () => {
    const ast: FormspecAST = {
      version: 7,
      size: { w: 10, h: 8 },
      styles: [],
      children: [
        {
          id: 'li1',
          type: 'listimages',
          x: 0,
          y: 0,
          w: 0,
          h: 0,
          texture: 'gui_slot.png',
          pressedTexture: 'gui_slot_hover.png',
        },
        {
          id: 'f1',
          type: 'field',
          x: 1,
          y: 2,
          w: 4,
          h: 1,
          name: 'read_only_status',
          label: 'System Status',
          defaultVal: 'ONLINE',
          editable: false,
        },
      ],
    };

    const serialized = service.serialize(ast);
    // Auto-promotes version to 12 for 5.18 features
    expect(serialized).toContain('formspec_version[12]');
    expect(serialized).toContain('listimages[gui_slot.png;gui_slot_hover.png]');
    expect(serialized).toContain('style[read_only_status;editable=false]');
    expect(serialized).toContain('field[1,2;4,1;read_only_status;System Status;ONLINE]');

    const parsed = service.parse(serialized);
    expect(parsed.version).toBe(12);
    const listImgNode = parsed.children.find((c) => c.type === 'listimages');
    expect(listImgNode).toBeDefined();
    expect(listImgNode?.texture).toBe('gui_slot.png');
    expect(listImgNode?.pressedTexture).toBe('gui_slot_hover.png');

    const fieldNode = parsed.children.find((c) => c.name === 'read_only_status');
    expect(fieldNode).toBeDefined();
    expect(fieldNode?.editable).toBe(false);
  });
});
