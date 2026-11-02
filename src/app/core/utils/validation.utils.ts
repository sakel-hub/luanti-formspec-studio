import { FormspecNode, FormspecElementType } from '../models/formspec.models';

export interface ValidationError {
  property: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Checks if a property is mandatory for a given Luanti formspec element type.
 */
export function isPropertyMandatory(type: FormspecElementType, prop: string): boolean {
  switch (prop) {
    case 'name':
      return [
        'button',
        'button_exit',
        'button_url',
        'button_url_exit',
        'image_button',
        'image_button_exit',
        'item_image_button',
        'field',
        'pwdfield',
        'textarea',
        'checkbox',
        'dropdown',
        'table',
        'textlist',
        'scrollbar',
      ].includes(type);

    case 'label':
      return ['label', 'vertlabel'].includes(type);

    case 'texture':
      return ['image', 'image_button', 'image_button_exit', 'background9', 'animated_image'].includes(type);

    case 'url':
      return ['button_url', 'button_url_exit'].includes(type);

    case 'inventoryLocation':
    case 'inventoryList':
      return ['list', 'listring'].includes(type);

    case 'mesh':
      return type === 'model';

    case 'tooltipText':
      return ['tooltip', 'hypertip'].includes(type);

    case 'dropdownItems':
      return type === 'dropdown';

    case 'w':
    case 'h':
      // All visual elements require valid width and height except 0-sized meta elements
      return !['listring', 'listcolors', 'allow_close', 'set_focus'].includes(type);

    default:
      return false;
  }
}

/**
 * Validates a FormspecNode and returns a list of validation errors and warnings.
 */
export function validateFormspecNode(node: FormspecNode): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Mandatory property checks
  if (isPropertyMandatory(node.type, 'name')) {
    if (!node.name || !node.name.trim()) {
      errors.push({
        property: 'name',
        message: 'Field Name is required for Lua callback event identification',
        severity: 'error',
      });
    } else if (/\s/.test(node.name)) {
      errors.push({
        property: 'name',
        message: 'Field Name contains spaces; use underscores (e.g. "btn_submit") for clean Lua code',
        severity: 'warning',
      });
    }
  }

  if (isPropertyMandatory(node.type, 'label')) {
    if (!node.label || !node.label.trim()) {
      errors.push({
        property: 'label',
        message: 'Label text caption is required',
        severity: 'error',
      });
    }
  }

  if (isPropertyMandatory(node.type, 'texture')) {
    if (!node.texture || !node.texture.trim()) {
      errors.push({
        property: 'texture',
        message: 'Texture filename is required (e.g. "gui_formspec_bg.png")',
        severity: 'error',
      });
    }
  }

  if (isPropertyMandatory(node.type, 'url')) {
    if (!node.url || !node.url.trim()) {
      errors.push({
        property: 'url',
        message: 'Web URL is required (must start with http:// or https://)',
        severity: 'error',
      });
    } else if (!/^https?:\/\//i.test(node.url)) {
      errors.push({
        property: 'url',
        message: 'URL should start with "https://" or "http://"',
        severity: 'warning',
      });
    }
  }

  if (isPropertyMandatory(node.type, 'inventoryLocation')) {
    if (!node.inventoryLocation || !node.inventoryLocation.trim()) {
      errors.push({
        property: 'inventoryLocation',
        message: 'Inventory location is required (e.g. "current_player" or "current_name")',
        severity: 'error',
      });
    }
  }

  if (isPropertyMandatory(node.type, 'inventoryList')) {
    if (!node.inventoryList || !node.inventoryList.trim()) {
      errors.push({
        property: 'inventoryList',
        message: 'Inventory list name is required (e.g. "main")',
        severity: 'error',
      });
    }
  }

  if (isPropertyMandatory(node.type, 'mesh')) {
    if (!node.mesh || !node.mesh.trim()) {
      errors.push({
        property: 'mesh',
        message: 'Mesh filename is required (.b3d, .obj, or .gltf)',
        severity: 'error',
      });
    }
  }

  if (isPropertyMandatory(node.type, 'tooltipText')) {
    if (!node.tooltipText || !node.tooltipText.trim()) {
      errors.push({
        property: 'tooltipText',
        message: 'Tooltip message text is required',
        severity: 'error',
      });
    }
  }

  if (isPropertyMandatory(node.type, 'dropdownItems')) {
    if (!node.dropdownItems || node.dropdownItems.length === 0 || !node.dropdownItems.some((s) => s.trim())) {
      errors.push({
        property: 'dropdownItems',
        message: 'Dropdown requires at least one item choice',
        severity: 'error',
      });
    }
  }

  // 2. Dimension and Bounds validation
  if (!['listring', 'listcolors', 'allow_close', 'set_focus'].includes(node.type)) {
    if (typeof node.w !== 'number' || isNaN(node.w) || node.w <= 0) {
      errors.push({
        property: 'w',
        message: 'Width must be greater than 0 slot units',
        severity: 'error',
      });
    }
    if (typeof node.h !== 'number' || isNaN(node.h) || node.h <= 0) {
      errors.push({
        property: 'h',
        message: 'Height must be greater than 0 slot units',
        severity: 'error',
      });
    }
  }

  if (node.type === 'animated_image') {
    if (node.frameCount !== undefined && node.frameCount < 1) {
      errors.push({
        property: 'frameCount',
        message: 'Frame count must be at least 1',
        severity: 'error',
      });
    }
    if (node.frameDuration !== undefined && node.frameDuration <= 0) {
      errors.push({
        property: 'frameDuration',
        message: 'Frame duration must be greater than 0ms',
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Detailed documentation for formspec properties in Luanti 5.18.
 */
export interface PropertyDoc {
  title: string;
  syntax: string;
  description: string;
  luantiVersion: string;
  defaultVal?: string;
}

export const PROPERTY_DOCS: Record<string, PropertyDoc> = {
  x: {
    title: 'X Position',
    syntax: 'x',
    description: 'Horizontal position from the top-left origin of parent container in real slot coordinates.',
    luantiVersion: 'v7+',
    defaultVal: '0.0s',
  },
  y: {
    title: 'Y Position',
    syntax: 'y',
    description: 'Vertical position from the top-left origin of parent container in real slot coordinates.',
    luantiVersion: 'v7+',
    defaultVal: '0.0s',
  },
  w: {
    title: 'Width (W)',
    syntax: 'w',
    description: 'Element width in slot units (or number of slot columns for inventory grids).',
    luantiVersion: 'v7+',
    defaultVal: '1.0s',
  },
  h: {
    title: 'Height (H)',
    syntax: 'h',
    description: 'Element height in slot units (or number of slot rows for inventory grids).',
    luantiVersion: 'v7+',
    defaultVal: '1.0s',
  },
  name: {
    title: 'Field Name (Lua Callback Key)',
    syntax: 'name',
    description: 'Identifier sent in the fields table to minetest.register_on_player_receive_fields(player, formname, fields).',
    luantiVersion: '0.4+',
  },
  label: {
    title: 'Caption / Content',
    syntax: 'label',
    description: 'Visible text caption displayed on the button, checkbox, or label element.',
    luantiVersion: '0.4+',
  },
  texture: {
    title: 'Texture Filename',
    syntax: 'texture name',
    description: 'Image texture filename loaded from mod textures/ directory or standard Luanti assets.',
    luantiVersion: '0.4+',
  },
  inventoryLocation: {
    title: 'Inventory Location',
    syntax: 'inventory location',
    description: 'Location of the target inventory: "current_player" for player, "current_name" for node, or "context".',
    luantiVersion: 'v7+',
    defaultVal: 'current_player',
  },
  inventoryList: {
    title: 'List Name',
    syntax: 'list name',
    description: 'Identifier of the inventory list (e.g. "main" for storage/hotbar, "craft" for crafting).',
    luantiVersion: '0.4+',
    defaultVal: 'main',
  },
  noclip: {
    title: 'No Clip (noclip)',
    syntax: 'noclip[] / element noclip',
    description: 'If true, element is not clipped to formspec or container dialog boundaries.',
    luantiVersion: 'v7+',
    defaultVal: 'false',
  },
  drawborder: {
    title: 'Draw Border (drawborder)',
    syntax: 'drawborder',
    description: 'If true, draws standard 3D beveled button border. Set false for flat transparent icon buttons.',
    luantiVersion: '0.4+',
    defaultVal: 'true',
  },
  closeOnEnter: {
    title: 'Close on Enter',
    syntax: 'close_on_enter',
    description: 'If true, pressing Enter in field submits and closes the formspec.',
    luantiVersion: 'v7+',
    defaultVal: 'true',
  },
  autoScale: {
    title: 'Auto Scale (auto_scale)',
    syntax: 'auto_scale',
    description: 'Automatically scales background image to fit the complete formspec size.',
    luantiVersion: '5.1+',
    defaultVal: 'false',
  },
  wordwrap: {
    title: 'Word Wrap',
    syntax: 'wordwrap',
    description: 'Enables automatic text wrapping across lines in textarea elements.',
    luantiVersion: '5.2+',
    defaultVal: 'true',
  },
  indexEvent: {
    title: 'Index Event',
    syntax: 'index_event',
    description: 'Sends field event immediately when user changes dropdown selection without pressing a button.',
    luantiVersion: '5.14.0+',
    defaultVal: 'false',
  },
  mesh: {
    title: '3D Mesh Model',
    syntax: 'mesh[name]',
    description: '3D model file (.b3d, .obj, .gltf) rendered inside the formspec dialog.',
    luantiVersion: '5.4.0+',
  },
  orientation: {
    title: 'Orientation',
    syntax: 'orientation',
    description: 'Orientation of scrollbar or scroll container (vertical or horizontal).',
    luantiVersion: '5.10.0+',
    defaultVal: 'vertical',
  },
};
