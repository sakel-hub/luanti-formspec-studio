import { ResponsiveBreakpointConfig } from './formspec.models';

export const DEFAULT_BREAKPOINTS: ResponsiveBreakpointConfig[] = [
  {
    id: 'mobile',
    name: 'Mobile / Touch',
    maxSlotsW: 10,
    maxSlotsH: 12,
    isTouch: true,
    description: 'Narrow compact screen (smartphones) with touch controls enabled (< 14 slots)',
  },
  {
    id: 'tablet',
    name: 'Tablet / Medium',
    maxSlotsW: 14,
    maxSlotsH: 10,
    isTouch: true,
    description: 'Medium screen (Steam Deck, tablets) (14 to 18 slots)',
  },
  {
    id: 'desktop',
    name: 'Desktop / Wide',
    maxSlotsW: 18,
    maxSlotsH: 10,
    isTouch: false,
    description: 'Standard desktop window or widescreen display (> 18 slots)',
  },
];
