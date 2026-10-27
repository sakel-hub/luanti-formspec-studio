import { Injectable } from '@angular/core';
import { FormspecAST, FormspecNode, FormspecStyleRule } from '../models/formspec.models';

@Injectable({
  providedIn: 'root',
})
export class FormspecParserService {
  /**
   * Safely escapes Luanti formspec delimiter characters: [, ], ;, ,
   */
  escape(val: string): string {
    return val.replace(/([\[\];,])/g, '\\$1');
  }

  /**
   * Unescapes Luanti formspec string literals.
   */
  unescape(val: string): string {
    return val.replace(/\\([\[\];,])/g, '$1');
  }

  /**
   * Serializes an AST into a canonical Luanti Formspec string.
   */
  serialize(ast: FormspecAST): string {
    const lines: string[] = [];

    // Header directives
    lines.push(`formspec_version[${ast.version || 7}]`);
    lines.push(`size[${ast.size.w},${ast.size.h}${ast.size.fixed ? ',true' : ''}]`);

    if (ast.padding) {
      lines.push(`padding[${ast.padding.x},${ast.padding.y}]`);
    }

    if (ast.position) {
      lines.push(`position[${ast.position.x},${ast.position.y}]`);
    }

    if (ast.anchor) {
      lines.push(`anchor[${ast.anchor.x},${ast.anchor.y}]`);
    }

    if (ast.noPrepend) {
      lines.push('no_prepend[]');
    }

    // Styles
    if (ast.styles && ast.styles.length > 0) {
      for (const style of ast.styles) {
        const props = Object.entries(style.properties)
          .map(([k, v]) => `${k}=${v}`)
          .join(';');
        if (style.selector === '*' || style.selector === 'button' || style.selector.startsWith('button')) {
          lines.push(`style_type[${style.selector};${props}]`);
        } else {
          lines.push(`style[${style.selector};${props}]`);
        }
      }
    }

    // Children elements
    this.serializeNodes(ast.children, lines);

    return lines.join('');
  }

  private serializeNodes(nodes: FormspecNode[], lines: string[]): void {
    for (const node of nodes) {
      switch (node.type) {
        case 'button':
        case 'button_exit': {
          const tag = node.type;
          lines.push(`${tag}[${node.x},${node.y};${node.w},${node.h};${node.name || ''};${this.escape(node.label || '')}]`);
          break;
        }

        case 'field':
        case 'pwdfield': {
          const tag = node.type;
          lines.push(`${tag}[${node.x},${node.y};${node.w},${node.h};${node.name || ''};${this.escape(node.label || '')};${this.escape(node.defaultVal || '')}]`);
          break;
        }

        case 'textarea': {
          lines.push(`textarea[${node.x},${node.y};${node.w},${node.h};${node.name || ''};${this.escape(node.label || '')};${this.escape(node.defaultVal || '')}]`);
          break;
        }

        case 'checkbox': {
          lines.push(`checkbox[${node.x},${node.y};${node.name || ''};${this.escape(node.label || '')};${node.checked ? 'true' : 'false'}]`);
          break;
        }

        case 'label': {
          lines.push(`label[${node.x},${node.y};${this.escape(node.label || '')}]`);
          break;
        }

        case 'vertlabel': {
          lines.push(`vertlabel[${node.x},${node.y};${this.escape(node.label || '')}]`);
          break;
        }

        case 'hypertext': {
          lines.push(`hypertext[${node.x},${node.y};${node.w},${node.h};${node.name || ''};${this.escape(node.label || '')}]`);
          break;
        }

        case 'box': {
          lines.push(`box[${node.x},${node.y};${node.w},${node.h};${node.color || '#000000'}]`);
          break;
        }

        case 'background9': {
          lines.push(`background9[${node.x},${node.y};${node.w},${node.h};${node.texture || 'gui_bg.png'};false;8]`);
          break;
        }

        case 'image': {
          lines.push(`image[${node.x},${node.y};${node.w},${node.h};${node.texture || ''}]`);
          break;
        }

        case 'item_image': {
          lines.push(`item_image[${node.x},${node.y};${node.w},${node.h};${node.name || ''}]`);
          break;
        }

        case 'list': {
          const loc = node.inventoryLocation || 'current_name';
          const lst = node.inventoryList || 'main';
          const idx = node.startingIndex ?? 0;
          lines.push(`list[${loc};${lst};${node.x},${node.y};${node.w},${node.h};${idx}]`);
          break;
        }

        case 'listring': {
          const loc = node.inventoryLocation || 'current_name';
          const lst = node.inventoryList || 'main';
          lines.push(`listring[${loc};${lst}]`);
          break;
        }

        case 'tabheader': {
          const items = (node.dropdownItems || []).map((i) => this.escape(i)).join(',');
          const selected = (node.selectedIdx ?? 0) + 1;
          lines.push(`tabheader[${node.x},${node.y};${node.name || 'tabs'};${items};${selected};false;true]`);
          break;
        }

        case 'container': {
          lines.push(`container[${node.x},${node.y}]`);
          if (node.children) {
            this.serializeNodes(node.children, lines);
          }
          lines.push('container_end[]');
          break;
        }

        default:
          break;
      }
    }
  }

  /**
   * Parses a raw Luanti Formspec string into an AST.
   */
  parse(raw: string): FormspecAST {
    const ast: FormspecAST = {
      version: 7,
      size: { w: 10, h: 8 },
      styles: [],
      children: [],
    };

    if (!raw || !raw.trim()) {
      return ast;
    }

    // Regex matcher for element[arg;arg;arg]
    const tagRegex = /([a-z_0-9]+)\s*\[([^\]]*)\]/gi;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(raw)) !== null) {
      const tag = match[1].toLowerCase();
      const rawArgs = match[2];
      const args = this.splitArgs(rawArgs, ';');

      switch (tag) {
        case 'formspec_version': {
          const v = parseInt(args[0], 10);
          if (!isNaN(v)) ast.version = v;
          break;
        }

        case 'size': {
          const dims = this.splitArgs(args[0] || '10,8', ',');
          const w = parseFloat(dims[0]);
          const h = parseFloat(dims[1]);
          if (!isNaN(w) && !isNaN(h)) {
            ast.size = { w, h, fixed: args[1] === 'true' };
          }
          break;
        }

        case 'padding': {
          const pad = this.splitArgs(args[0] || '0,0', ',');
          const px = parseFloat(pad[0]);
          const py = parseFloat(pad[1]);
          if (!isNaN(px) && !isNaN(py)) {
            ast.padding = { x: px, y: py };
          }
          break;
        }

        case 'no_prepend': {
          ast.noPrepend = true;
          break;
        }

        case 'button':
        case 'button_exit': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: tag as 'button' | 'button_exit',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            name: args[2] || '',
            label: this.unescape(args[3] || ''),
          });
          break;
        }

        case 'field':
        case 'pwdfield': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: tag as 'field' | 'pwdfield',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            name: args[2] || '',
            label: this.unescape(args[3] || ''),
            defaultVal: this.unescape(args[4] || ''),
          });
          break;
        }

        case 'textarea': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'textarea',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            name: args[2] || '',
            label: this.unescape(args[3] || ''),
            defaultVal: this.unescape(args[4] || ''),
          });
          break;
        }

        case 'checkbox': {
          const coords = this.splitCoords(args[0]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'checkbox',
            x: coords.x,
            y: coords.y,
            w: 3,
            h: 0.8,
            name: args[1] || '',
            label: this.unescape(args[2] || ''),
            checked: args[3] === 'true',
          });
          break;
        }

        case 'label': {
          const coords = this.splitCoords(args[0]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'label',
            x: coords.x,
            y: coords.y,
            w: 4,
            h: 0.5,
            label: this.unescape(args[1] || ''),
          });
          break;
        }

        case 'box': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'box',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            color: args[2] || '#000000',
          });
          break;
        }

        case 'list': {
          const loc = args[0] || 'current_name';
          const lst = args[1] || 'main';
          const coords = this.splitCoords(args[2]);
          const dims = this.splitCoords(args[3]);
          const idx = parseInt(args[4] || '0', 10);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'list',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            inventoryLocation: loc,
            inventoryList: lst,
            startingIndex: isNaN(idx) ? 0 : idx,
          });
          break;
        }

        default:
          break;
      }
    }

    return ast;
  }

  private splitCoords(str: string | undefined): { x: number; y: number } {
    if (!str) return { x: 0, y: 0 };
    const parts = str.split(',');
    return {
      x: parseFloat(parts[0]) || 0,
      y: parseFloat(parts[1]) || 0,
    };
  }

  private splitArgs(str: string, delimiter: string): string[] {
    const res: string[] = [];
    let current = '';
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (escaped) {
        current += char;
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === delimiter) {
        res.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    res.push(current.trim());
    return res;
  }
}
