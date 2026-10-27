export type FormspecElementType =
  | 'button'
  | 'button_exit'
  | 'image_button'
  | 'item_image_button'
  | 'field'
  | 'pwdfield'
  | 'textarea'
  | 'checkbox'
  | 'dropdown'
  | 'label'
  | 'vertlabel'
  | 'hypertext'
  | 'box'
  | 'background9'
  | 'image'
  | 'item_image'
  | 'list'
  | 'listring'
  | 'container'
  | 'scroll_container'
  | 'tabheader'
  | 'scrollbar';

export interface FormspecStyleRule {
  selector: string; // e.g. "button", "btn_sort:hovered"
  properties: Record<string, string>; // e.g. { bgcolor: "#006699", textcolor: "#ffffff" }
}

export interface FormspecNode {
  id: string;
  type: FormspecElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  name?: string;
  label?: string;
  defaultVal?: string;
  texture?: string;
  color?: string;
  inventoryLocation?: string;
  inventoryList?: string;
  startingIndex?: number;
  dropdownItems?: string[];
  selectedIdx?: number;
  checked?: boolean;
  children?: FormspecNode[];
}

export interface FormspecAST {
  version: number; // e.g. 7
  size: { w: number; h: number; fixed?: boolean };
  position?: { x: number; y: number };
  anchor?: { x: number; y: number };
  padding?: { x: number; y: number };
  noPrepend?: boolean;
  styles: FormspecStyleRule[];
  children: FormspecNode[];
}

export interface ResponsiveBreakpointConfig {
  id: 'mobile' | 'tablet' | 'desktop';
  name: string;
  maxSlotsW: number;
  maxSlotsH: number;
  isTouch: boolean;
  description: string;
}
