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
});
