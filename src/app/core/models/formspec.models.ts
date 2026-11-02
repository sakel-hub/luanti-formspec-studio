export type FormspecElementType =
  | 'button'
  | 'button_exit'
  | 'button_url'
  | 'button_url_exit'
  | 'image_button'
  | 'image_button_exit'
  | 'item_image_button'
  | 'field'
  | 'pwdfield'
  | 'textarea'
  | 'checkbox'
  | 'dropdown'
  | 'label'
  | 'vertlabel'
  | 'hypertext'
  | 'tooltip'
  | 'hypertip'
  | 'box'
  | 'background'
  | 'background9'
  | 'image'
  | 'animated_image'
  | 'item_image'
  | 'model'
  | 'list'
  | 'listring'
  | 'listcolors'
  | 'listimages'
  | 'container'
  | 'scroll_container'
  | 'tabheader'
  | 'scrollbar'
  | 'table'
  | 'textlist'
  | 'allow_close'
  | 'set_focus';

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
  url?: string;
  inventoryLocation?: string;
  inventoryList?: string;
  startingIndex?: number;
  dropdownItems?: string[];
  selectedIdx?: number;
  checked?: boolean;
  editable?: boolean;
  mesh?: string;
  meshTextures?: string;
  meshRotation?: string;
  animationSpeed?: number;
  continuous?: boolean;
  mouseControl?: boolean;
  frameCount?: number;
  frameDuration?: number;
  frameStart?: number;
  tooltipText?: string;
  tooltipBgColor?: string;
  tooltipFontColor?: string;
  orientation?: 'vertical' | 'horizontal';
  scrollbarName?: string;
  scrollFactor?: number;
  contentPadding?: number;
  middle?: string;
  areaLabel?: boolean;
  allowClose?: boolean;
  focusTarget?: string;
  forceFocus?: boolean;
  tableOptions?: string;
  locked?: boolean;
  hidden?: boolean;
  noclip?: boolean;
  drawborder?: boolean;
  closeOnEnter?: boolean;
  autoScale?: boolean;
  wordwrap?: boolean;
  indexEvent?: boolean;
  min?: number;
  max?: number;
  step?: number;
  thumbsize?: number;
  pressedTexture?: string;
  children?: FormspecNode[];
}

export interface SimulatorEvent {
  id: string;
  timestamp: string;
  eventType: 'click' | 'change' | 'submit' | 'close';
  widgetName: string;
  widgetType: FormspecElementType;
  fields: Record<string, string>;
}

export interface FormspecAST {
  version: number; // e.g. 7 or up to 12
  size: { w: number; h: number; fixed?: boolean };
  position?: { x: number; y: number };
  anchor?: { x: number; y: number };
  padding?: { x: number; y: number };
  noPrepend?: boolean;
  allowClose?: boolean;
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

export interface WidgetMetadata {
  type: FormspecElementType;
  name: string;
  syntax: string;
  description: string;
  formspecVersion: number;
  luantiVersion: string;
  category: 'buttons' | 'inputs' | 'inventories' | 'visuals' | 'containers' | 'data' | 'tooltips' | 'meta';
  notes?: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  widgetCount: number;
  dimensions: { w: number; h: number };
}

export interface ProjectFile {
  version: number; // schema version e.g. 1
  metadata: ProjectMetadata;
  ast: FormspecAST;
  viewport?: {
    zoom: number;
    pan: { x: number; y: number };
    breakpoint: 'mobile' | 'tablet' | 'desktop';
  };
}

