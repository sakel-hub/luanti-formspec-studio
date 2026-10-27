import { describe, it, expect } from 'vitest';
import { slotToPixel, pixelToSlot, snapSlot, clamp } from './coordinate.utils';

describe('CoordinateUtils', () => {
  it('converts slots to pixels accurately', () => {
    expect(slotToPixel(1.0, 48)).toBe(48);
    expect(slotToPixel(0.5, 48)).toBe(24);
    expect(slotToPixel(2.5, 40)).toBe(100);
  });

  it('converts pixels to slots with 2 decimal precision', () => {
    expect(pixelToSlot(48, 48)).toBe(1.0);
    expect(pixelToSlot(24, 48)).toBe(0.5);
    expect(pixelToSlot(36, 48)).toBe(0.75);
  });

  it('snaps slot values to chosen increments', () => {
    expect(snapSlot(1.23, 0.5)).toBe(1.0);
    expect(snapSlot(1.26, 0.5)).toBe(1.5);
    expect(snapSlot(1.23, 0.1)).toBe(1.2);
    expect(snapSlot(1.24, 0.25)).toBe(1.25);
  });

  it('clamps values within bounds', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
