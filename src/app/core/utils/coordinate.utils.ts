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

export interface ScreenCapacity {
  viewportWidthPx: number;
  viewportHeightPx: number;
  maxSlotsW: number;
  maxSlotsH: number;
}

/**
 * Returns the usable viewport dimensions and slot capacities for a device breakpoint.
 */
export function getScreenCapacity(breakpoint: 'mobile' | 'tablet' | 'desktop'): ScreenCapacity {
  switch (breakpoint) {
    case 'mobile':
      // 390px wide, 680px usable height (720 minus notch & bottom bar)
      // At 48px/slot, width is ~8.125 slots, height is ~14.16 slots
      return {
        viewportWidthPx: 390,
        viewportHeightPx: 680,
        maxSlotsW: 8.125,
        maxSlotsH: 14.16,
      };
    case 'tablet':
      // 768px wide, 576px usable height (600 minus title bar)
      return {
        viewportWidthPx: 768,
        viewportHeightPx: 576,
        maxSlotsW: 16.0,
        maxSlotsH: 12.0,
      };
    case 'desktop':
      // 1152px wide, 696px usable height (720 minus title bar)
      return {
        viewportWidthPx: 1152,
        viewportHeightPx: 696,
        maxSlotsW: 24.0,
        maxSlotsH: 14.5,
      };
  }
}

export interface FormspecPlacement {
  w: number;
  h: number;
  position?: { x: number; y: number };
  anchor?: { x: number; y: number };
}

export interface OverflowResult {
  isOverflowing: boolean;
  overflowsWidth: boolean;
  overflowsHeight: boolean;
  overflowsLeft: boolean;
  overflowsRight: boolean;
  overflowsTop: boolean;
  overflowsBottom: boolean;
  maxSlotsW: number;
  maxSlotsH: number;
  message: string;
}

/**
 * Accurately determines if a formspec with its size, position and anchor
 * exceeds the visible screen bounds for the simulated breakpoint.
 */
export function checkFormspecOverflow(
  breakpoint: 'mobile' | 'tablet' | 'desktop',
  formspec: FormspecPlacement
): OverflowResult {
  const cap = getScreenCapacity(breakpoint);
  const w = formspec.w;
  const h = formspec.h;

  const posX = formspec.position !== undefined ? formspec.position.x : 0.5;
  const posY = formspec.position !== undefined ? formspec.position.y : 0.5;
  const ancX = formspec.anchor !== undefined ? formspec.anchor.x : 0.5;
  const ancY = formspec.anchor !== undefined ? formspec.anchor.y : 0.5;

  // Calculate actual left, right, top, bottom edges of the formspec on screen in slot units
  const screenLeftSlots = posX * cap.maxSlotsW - ancX * w;
  const screenRightSlots = screenLeftSlots + w;

  const screenTopSlots = posY * cap.maxSlotsH - ancY * h;
  const screenBottomSlots = screenTopSlots + h;

  // Tolerance margin (0.05 slots ~ 2.4px) to avoid precision errors
  const EPSILON = 0.05;
  const overflowsLeft = screenLeftSlots < -EPSILON;
  const overflowsRight = screenRightSlots > cap.maxSlotsW + EPSILON;
  const overflowsTop = screenTopSlots < -EPSILON;
  const overflowsBottom = screenBottomSlots > cap.maxSlotsH + EPSILON;

  const overflowsWidth = w > cap.maxSlotsW + EPSILON || overflowsLeft || overflowsRight;
  const overflowsHeight = h > cap.maxSlotsH + EPSILON || overflowsTop || overflowsBottom;

  const isOverflowing = overflowsWidth || overflowsHeight;

  let message = `This formspec fits inside the simulated ${breakpoint} screen.`;
  if (isOverflowing) {
    if (overflowsWidth && overflowsHeight) {
      message = `This formspec (${w}×${h} slots) exceeds both width (~${cap.maxSlotsW.toFixed(1)} slots) and height (~${cap.maxSlotsH.toFixed(1)} slots) on ${breakpoint}.`;
    } else if (overflowsWidth) {
      if (w > cap.maxSlotsW + EPSILON) {
        message = `This formspec width (${w} slots) exceeds the ${breakpoint} screen width capacity (~${cap.maxSlotsW.toFixed(1)} slots).`;
      } else {
        message = `This formspec extends past the ${overflowsLeft ? 'left' : 'right'} screen edge due to its anchor/position offset.`;
      }
    } else if (overflowsHeight) {
      if (h > cap.maxSlotsH + EPSILON) {
        message = `This formspec height (${h} slots) exceeds the ${breakpoint} screen height capacity (~${cap.maxSlotsH.toFixed(1)} slots).`;
      } else {
        message = `This formspec extends past the ${overflowsTop ? 'top' : 'bottom'} screen edge due to its anchor/position offset.`;
      }
    }
  }

  return {
    isOverflowing,
    overflowsWidth,
    overflowsHeight,
    overflowsLeft,
    overflowsRight,
    overflowsTop,
    overflowsBottom,
    maxSlotsW: Math.round(cap.maxSlotsW * 10) / 10,
    maxSlotsH: Math.round(cap.maxSlotsH * 10) / 10,
    message,
  };
}
