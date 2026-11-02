import { describe, it, expect } from 'vitest';
import {
  slotToPixel,
  pixelToSlot,
  snapSlot,
  clamp,
  getScreenCapacity,
  checkFormspecOverflow,
} from './coordinate.utils';

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

  it('correctly calculates screen capacity for all breakpoints', () => {
    const mobile = getScreenCapacity('mobile');
    expect(mobile.maxSlotsW).toBeCloseTo(8.125, 2);
    expect(mobile.maxSlotsH).toBeCloseTo(14.16, 2);

    const tablet = getScreenCapacity('tablet');
    expect(tablet.maxSlotsW).toBe(16.0);
    expect(tablet.maxSlotsH).toBe(12.0);

    const desktop = getScreenCapacity('desktop');
    expect(desktop.maxSlotsW).toBe(24.0);
    expect(desktop.maxSlotsH).toBe(14.5);
  });

  it('correctly reports NO overflow when a 7x8 formspec is centered on mobile', () => {
    const res = checkFormspecOverflow('mobile', {
      w: 7,
      h: 8,
      position: { x: 0.5, y: 0.5 },
      anchor: { x: 0.5, y: 0.5 },
    });
    expect(res.isOverflowing).toBe(false);
    expect(res.overflowsWidth).toBe(false);
    expect(res.overflowsHeight).toBe(false);
  });

  it('correctly reports overflow when a formspec width exceeds screen capacity', () => {
    const res = checkFormspecOverflow('mobile', {
      w: 9,
      h: 8,
      position: { x: 0.5, y: 0.5 },
      anchor: { x: 0.5, y: 0.5 },
    });
    expect(res.isOverflowing).toBe(true);
    expect(res.overflowsWidth).toBe(true);
  });

  it('correctly reports overflow when formspec anchor/position places it off-screen', () => {
    // 7-slot wide formspec with left edge pinned at the right edge of screen (posX=1, ancX=0)
    const res = checkFormspecOverflow('mobile', {
      w: 7,
      h: 8,
      position: { x: 1.0, y: 0.5 },
      anchor: { x: 0, y: 0.5 },
    });
    expect(res.isOverflowing).toBe(true);
    expect(res.overflowsRight).toBe(true);
  });
});
