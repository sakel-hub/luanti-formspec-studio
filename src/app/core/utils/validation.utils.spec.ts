import { describe, it, expect } from 'vitest';
import { isPropertyMandatory, validateFormspecNode } from './validation.utils';
import { FormspecNode } from '../models/formspec.models';

describe('validation.utils', () => {
  describe('isPropertyMandatory', () => {
    it('identifies name as mandatory for interactive widgets', () => {
      expect(isPropertyMandatory('button', 'name')).toBe(true);
      expect(isPropertyMandatory('field', 'name')).toBe(true);
      expect(isPropertyMandatory('checkbox', 'name')).toBe(true);
      expect(isPropertyMandatory('dropdown', 'name')).toBe(true);
      expect(isPropertyMandatory('label', 'name')).toBe(false);
    });

    it('identifies label as mandatory for text labels', () => {
      expect(isPropertyMandatory('label', 'label')).toBe(true);
      expect(isPropertyMandatory('vertlabel', 'label')).toBe(true);
      expect(isPropertyMandatory('button', 'label')).toBe(false);
    });

    it('identifies texture as mandatory for images and image buttons', () => {
      expect(isPropertyMandatory('image', 'texture')).toBe(true);
      expect(isPropertyMandatory('animated_image', 'texture')).toBe(true);
      expect(isPropertyMandatory('button', 'texture')).toBe(false);
    });

    it('identifies inventoryList as mandatory for inventory lists', () => {
      expect(isPropertyMandatory('list', 'inventoryList')).toBe(true);
      expect(isPropertyMandatory('listring', 'inventoryList')).toBe(true);
      expect(isPropertyMandatory('button', 'inventoryList')).toBe(false);
    });

    it('identifies dimensions w and h as mandatory for visual widgets', () => {
      expect(isPropertyMandatory('button', 'w')).toBe(true);
      expect(isPropertyMandatory('button', 'h')).toBe(true);
      expect(isPropertyMandatory('listring', 'w')).toBe(false);
      expect(isPropertyMandatory('listring', 'h')).toBe(false);
    });
  });

  describe('validateFormspecNode', () => {
    it('detects missing name for button', () => {
      const node: FormspecNode = {
        id: 'btn1',
        type: 'button',
        x: 1,
        y: 1,
        w: 2,
        h: 0.8,
        label: 'Click Me',
      };
      const errors = validateFormspecNode(node);
      expect(errors.some((e) => e.property === 'name' && e.severity === 'error')).toBe(true);
    });

    it('warns about spaces in field names for Luanti compatibility', () => {
      const node: FormspecNode = {
        id: 'btn1',
        type: 'button',
        name: 'my button',
        x: 1,
        y: 1,
        w: 2,
        h: 0.8,
        label: 'Click Me',
      };
      const errors = validateFormspecNode(node);
      expect(errors.some((e) => e.property === 'name' && e.severity === 'warning')).toBe(true);
    });

    it('flags non-positive dimensions as errors', () => {
      const node: FormspecNode = {
        id: 'btn1',
        type: 'button',
        name: 'btn_test',
        x: 0,
        y: 0,
        w: 0,
        h: -1,
      };
      const errors = validateFormspecNode(node);
      expect(errors.some((e) => e.property === 'w' && e.severity === 'error')).toBe(true);
      expect(errors.some((e) => e.property === 'h' && e.severity === 'error')).toBe(true);
    });

    it('returns empty error list for completely valid button', () => {
      const node: FormspecNode = {
        id: 'btn1',
        type: 'button',
        name: 'btn_submit',
        label: 'Submit',
        x: 0,
        y: 0,
        w: 2.5,
        h: 0.8,
      };
      const errors = validateFormspecNode(node);
      expect(errors.filter((e) => e.severity === 'error')).toHaveLength(0);
    });
  });
});
