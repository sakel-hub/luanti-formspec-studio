import { Injectable } from '@angular/core';
import { FormspecAST, FormspecNode } from '../models/formspec.models';

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

    if (ast.allowClose === false) {
      lines.push('allow_close[false]');
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
          lines.push(`${node.type}[${node.x},${node.y};${node.w},${node.h};${node.name || ''};${this.escape(node.label || '')}]`);
          break;
        }

        case 'button_url':
        case 'button_url_exit': {
          lines.push(`${node.type}[${node.x},${node.y};${node.w},${node.h};${node.name || ''};${this.escape(node.label || '')};${this.escape(node.url || 'https://luanti.org')}]`);
          break;
        }

        case 'image_button':
        case 'image_button_exit': {
          lines.push(`${node.type}[${node.x},${node.y};${node.w},${node.h};${node.texture || 'gui_button.png'};${node.name || ''};${this.escape(node.label || '')}]`);
          break;
        }

        case 'item_image_button': {
          lines.push(`item_image_button[${node.x},${node.y};${node.w},${node.h};${node.texture || 'default:sword_steel'};${node.name || ''};${this.escape(node.label || '')}]`);
          break;
        }

        case 'field':
        case 'pwdfield': {
          lines.push(`${node.type}[${node.x},${node.y};${node.w},${node.h};${node.name || ''};${this.escape(node.label || '')};${this.escape(node.defaultVal || '')}]`);
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

        case 'dropdown': {
          const items = (node.dropdownItems || ['Option 1', 'Option 2']).map((i) => this.escape(i)).join(',');
          const selected = (node.selectedIdx ?? 0) + 1;
          lines.push(`dropdown[${node.x},${node.y};${node.w},${node.h};${node.name || 'drop'};${items};${selected};true]`);
          break;
        }

        case 'label': {
          if (node.areaLabel && node.w && node.h) {
            lines.push(`label[${node.x},${node.y};${node.w},${node.h};${this.escape(node.label || '')}]`);
          } else {
            lines.push(`label[${node.x},${node.y};${this.escape(node.label || '')}]`);
          }
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

        case 'tooltip': {
          if (node.name) {
            lines.push(`tooltip[${node.name};${this.escape(node.tooltipText || node.label || '')};${node.tooltipBgColor || ''};${node.tooltipFontColor || ''}]`);
          } else {
            lines.push(`tooltip[${node.x},${node.y};${node.w},${node.h};${this.escape(node.tooltipText || node.label || '')};${node.tooltipBgColor || ''};${node.tooltipFontColor || ''}]`);
          }
          break;
        }

        case 'hypertip': {
          if (node.name) {
            lines.push(`hypertip[${node.name};;15;${node.name}_tip;${this.escape(node.tooltipText || node.label || '')}]`);
          } else {
            lines.push(`hypertip[${node.x},${node.y};${node.w},${node.h};;15;tip_${node.id.substring(0, 6)};${this.escape(node.tooltipText || node.label || '')}]`);
          }
          break;
        }

        case 'box': {
          lines.push(`box[${node.x},${node.y};${node.w},${node.h};${node.color || '#000000'}]`);
          break;
        }

        case 'background': {
          lines.push(`background[${node.x},${node.y};${node.w},${node.h};${node.texture || 'gui_bg.png'}]`);
          break;
        }

        case 'background9': {
          const middle = node.middle || '8';
          lines.push(`background9[${node.x},${node.y};${node.w},${node.h};${node.texture || 'gui_bg.png'};false;${middle}]`);
          break;
        }

        case 'image': {
          lines.push(`image[${node.x},${node.y};${node.w},${node.h};${node.texture || 'default_chest.png'}]`);
          break;
        }

        case 'animated_image': {
          const count = node.frameCount || 8;
          const duration = node.frameDuration || 100;
          lines.push(`animated_image[${node.x},${node.y};${node.w},${node.h};${node.name || 'anim'};${node.texture || 'fire_animated.png'};${count};${duration};1]`);
          break;
        }

        case 'item_image': {
          lines.push(`item_image[${node.x},${node.y};${node.w},${node.h};${node.texture || node.name || 'default:pick_diamond'}]`);
          break;
        }

        case 'model': {
          const mesh = node.mesh || 'character.b3d';
          const textures = node.meshTextures || 'character.png';
          const rot = node.meshRotation || '0,180';
          const speed = node.animationSpeed ?? 30;
          lines.push(`model[${node.x},${node.y};${node.w},${node.h};${node.name || 'player_mesh'};${mesh};${textures};${rot};false;true;0,79;${speed}]`);
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

        case 'listcolors': {
          lines.push(`listcolors[${node.color || '#333333'};#555555;#777777;#000000;#ffffff]`);
          break;
        }

        case 'listimages': {
          lines.push(`listimages[${node.texture || 'gui_slot.png'};gui_slot_hover.png]`);
          break;
        }

        case 'tabheader': {
          const items = (node.dropdownItems || ['Tab 1', 'Tab 2']).map((i) => this.escape(i)).join(',');
          const selected = (node.selectedIdx ?? 0) + 1;
          lines.push(`tabheader[${node.x},${node.y};${node.name || 'tabs'};${items};${selected};false;true]`);
          break;
        }

        case 'scrollbar': {
          const orient = node.orientation || 'horizontal';
          lines.push(`scrollbar[${node.x},${node.y};${node.w},${node.h};${orient};${node.name || 'scr'};${node.defaultVal || '0'}]`);
          break;
        }

        case 'table': {
          const cells = (node.dropdownItems || ['Item 1', 'Item 2', 'Item 3']).map((i) => this.escape(i)).join(',');
          const selected = (node.selectedIdx ?? 0) + 1;
          lines.push(`table[${node.x},${node.y};${node.w},${node.h};${node.name || 'tbl'};${cells};${selected}]`);
          break;
        }

        case 'textlist': {
          const items = (node.dropdownItems || ['Log Entry 1', 'Log Entry 2']).map((i) => this.escape(i)).join(',');
          const selected = (node.selectedIdx ?? 0) + 1;
          lines.push(`textlist[${node.x},${node.y};${node.w},${node.h};${node.name || 'tl'};${items};${selected};false]`);
          break;
        }

        case 'scroll_container': {
          const orient = node.orientation || 'vertical';
          const scrName = node.scrollbarName || 'scr';
          const factor = node.scrollFactor ?? 0.1;
          const pad = node.contentPadding ?? 0.5;
          lines.push(`scroll_container[${node.x},${node.y};${node.w},${node.h};${scrName};${orient};${factor};${pad}]`);
          if (node.children) {
            this.serializeNodes(node.children, lines);
          }
          lines.push('scroll_container_end[]');
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

        case 'allow_close': {
          lines.push(`allow_close[${node.allowClose ? 'true' : 'false'}]`);
          break;
        }

        case 'set_focus': {
          lines.push(`set_focus[${node.focusTarget || 'btn_ok'};${node.forceFocus ? 'true' : 'false'}]`);
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

        case 'position': {
          const pos = this.splitArgs(args[0] || '0.5,0.5', ',');
          const px = parseFloat(pos[0]);
          const py = parseFloat(pos[1]);
          if (!isNaN(px) && !isNaN(py)) {
            ast.position = { x: px, y: py };
          }
          break;
        }

        case 'anchor': {
          const anc = this.splitArgs(args[0] || '0.5,0.5', ',');
          const ax = parseFloat(anc[0]);
          const ay = parseFloat(anc[1]);
          if (!isNaN(ax) && !isNaN(ay)) {
            ast.anchor = { x: ax, y: ay };
          }
          break;
        }

        case 'no_prepend': {
          ast.noPrepend = true;
          break;
        }

        case 'allow_close': {
          ast.allowClose = args[0] !== 'false';
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

        case 'button_url':
        case 'button_url_exit': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: tag as 'button_url' | 'button_url_exit',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            name: args[2] || '',
            label: this.unescape(args[3] || ''),
            url: this.unescape(args[4] || 'https://luanti.org'),
          });
          break;
        }

        case 'image_button':
        case 'image_button_exit': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: tag as 'image_button' | 'image_button_exit',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            texture: args[2] || '',
            name: args[3] || '',
            label: this.unescape(args[4] || ''),
          });
          break;
        }

        case 'item_image_button': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'item_image_button',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            texture: args[2] || 'default:sword_steel',
            name: args[3] || '',
            label: this.unescape(args[4] || ''),
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

        case 'dropdown': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          const rawItems = (args[3] || '').split(',').map((s) => this.unescape(s));
          const sel = parseInt(args[4] || '1', 10) - 1;
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'dropdown',
            x: coords.x,
            y: coords.y,
            w: dims.x || 4,
            h: dims.y || 0.8,
            name: args[2] || '',
            dropdownItems: rawItems,
            selectedIdx: Math.max(sel, 0),
          });
          break;
        }

        case 'label': {
          const coords = this.splitCoords(args[0]);
          // Check if area label: label[x,y;w,h;text] vs standard: label[x,y;text]
          if (args.length >= 3) {
            const dims = this.splitCoords(args[1]);
            ast.children.push({
              id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'label',
              areaLabel: true,
              x: coords.x,
              y: coords.y,
              w: dims.x || 4,
              h: dims.y || 1,
              label: this.unescape(args[2] || ''),
            });
          } else {
            ast.children.push({
              id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'label',
              x: coords.x,
              y: coords.y,
              w: 4,
              h: 0.5,
              label: this.unescape(args[1] || ''),
            });
          }
          break;
        }

        case 'vertlabel': {
          const coords = this.splitCoords(args[0]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'vertlabel',
            x: coords.x,
            y: coords.y,
            w: 0.8,
            h: 4,
            label: this.unescape(args[1] || ''),
          });
          break;
        }

        case 'hypertext': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'hypertext',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            name: args[2] || '',
            label: this.unescape(args[3] || ''),
          });
          break;
        }

        case 'tooltip':
        case 'hypertip': {
          const isArea = args[0]?.includes(',');
          if (isArea) {
            const coords = this.splitCoords(args[0]);
            const dims = this.splitCoords(args[1]);
            ast.children.push({
              id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: tag as 'tooltip' | 'hypertip',
              x: coords.x,
              y: coords.y,
              w: dims.x,
              h: dims.y,
              tooltipText: this.unescape(tag === 'hypertip' ? args[4] || '' : args[2] || ''),
              tooltipBgColor: args[3],
              tooltipFontColor: args[4],
            });
          } else {
            ast.children.push({
              id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: tag as 'tooltip' | 'hypertip',
              x: 1,
              y: 1,
              w: 3,
              h: 1,
              name: args[0],
              tooltipText: this.unescape(tag === 'hypertip' ? args[4] || '' : args[1] || ''),
            });
          }
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

        case 'background': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'background',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            texture: args[2] || '',
          });
          break;
        }

        case 'background9': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'background9',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            texture: args[2] || 'gui_bg.png',
            middle: args[4] || '8',
          });
          break;
        }

        case 'image': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'image',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            texture: args[2] || '',
          });
          break;
        }

        case 'animated_image': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'animated_image',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            name: args[2] || '',
            texture: args[3] || '',
            frameCount: parseInt(args[4] || '8', 10),
            frameDuration: parseInt(args[5] || '100', 10),
          });
          break;
        }

        case 'item_image': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'item_image',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            texture: args[2] || 'default:pick_diamond',
          });
          break;
        }

        case 'model': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'model',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            name: args[2] || '',
            mesh: args[3] || 'character.b3d',
            meshTextures: args[4] || 'character.png',
            meshRotation: args[5] || '0,180',
            animationSpeed: parseFloat(args[9] || '30'),
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

        case 'scrollbar': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'scrollbar',
            x: coords.x,
            y: coords.y,
            w: dims.x,
            h: dims.y,
            orientation: (args[2] as 'vertical' | 'horizontal') || 'horizontal',
            name: args[3] || 'scr',
            defaultVal: args[4] || '0',
          });
          break;
        }

        case 'table': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          const rawItems = (args[3] || '').split(',').map((s) => this.unescape(s));
          const sel = parseInt(args[4] || '1', 10) - 1;
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'table',
            x: coords.x,
            y: coords.y,
            w: dims.x || 6,
            h: dims.y || 4,
            name: args[2] || '',
            dropdownItems: rawItems,
            selectedIdx: Math.max(sel, 0),
          });
          break;
        }

        case 'textlist': {
          const coords = this.splitCoords(args[0]);
          const dims = this.splitCoords(args[1]);
          const rawItems = (args[3] || '').split(',').map((s) => this.unescape(s));
          const sel = parseInt(args[4] || '1', 10) - 1;
          ast.children.push({
            id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'textlist',
            x: coords.x,
            y: coords.y,
            w: dims.x || 6,
            h: dims.y || 4,
            name: args[2] || '',
            dropdownItems: rawItems,
            selectedIdx: Math.max(sel, 0),
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
