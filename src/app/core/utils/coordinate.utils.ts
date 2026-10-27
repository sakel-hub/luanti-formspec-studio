export const DEFAULT_SLOT_SIZE_PX = 48;

/**
 * Converts formspec real coordinate slot units into viewport pixels.
 */
export function slotToPixel(slots: number, slotSizePx: number = DEFAULT_SLOT_SIZE_PX): number {
  return Math.round(slots * slotSizePx);
}

/**
 * Converts viewport pixels back to formspec real coordinate slot units.
 */
export function pixelToSlot(pixels: number, slotSizePx: number = DEFAULT_SLOT_SIZE_PX): number {
  return Math.round((pixels / slotSizePx) * 100) / 100;
}

/**
 * Snaps a slot value to the nearest step increment (e.g. 0.1, 0.25, 0.5, 1.0).
 */
export function snapSlot(value: number, step: number): number {
  if (step <= 0) return value;
  const snapped = Math.round(value / step) * step;
  return Math.round(snapped * 100) / 100;
}

/**
 * Clamps a number between min and max boundaries.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
