import { Injectable, signal, computed, inject } from '@angular/core';
import {
  FormspecAST,
  FormspecNode,
  FormspecElementType,
  SimulatorEvent,
  ProjectMetadata,
  ProjectFile,
} from '../models/formspec.models';
import { FormspecParserService } from '../services/formspec-parser.service';
import { LuaGeneratorService } from '../services/lua-generator.service';
import { TemplateRegistryService } from '../services/template-registry.service';
import { StorageService } from '../services/storage.service';
import { snapSlot } from '../utils/coordinate.utils';

export const STORAGE_PROJECTS_INDEX = 'luanti_fs_projects_index';
export const STORAGE_PROJECT_PREFIX = 'luanti_fs_project_';
export const STORAGE_ACTIVE_ID = 'luanti_fs_active_id';
export const STORAGE_SETTINGS = 'luanti_fs_settings';

export interface EditorSettings {
  snapToGrid: boolean;
  snapStep: number;
  leftPanelWidth: number;
  rightPanelWidth: number;
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  autoSaveEnabled: boolean;
}

export const DEFAULT_SETTINGS: EditorSettings = {
  snapToGrid: true,
  snapStep: 0.5,
  leftPanelWidth: 280,
  rightPanelWidth: 320,
  activeBreakpoint: 'desktop',
  autoSaveEnabled: true,
};

@Injectable({
  providedIn: 'root',
})
export class EditorStore {
  private readonly parser: FormspecParserService;
  private readonly luaGen: LuaGeneratorService;
  private readonly templateRegistry: TemplateRegistryService;
  private readonly storage: StorageService;

  // Project Management Signals
  readonly currentProjectId = signal<string>('default');
  readonly projects = signal<ProjectMetadata[]>([]);
  readonly saveStatus = signal<'saved' | 'saving' | 'unsaved'>('saved');
  readonly isProjectsModalOpen = signal<boolean>(false);
  readonly projectsModalTab = signal<'projects' | 'templates' | 'import'>('templates');
  readonly isShortcutsModalOpen = signal<boolean>(false);
  readonly isHelpModalOpen = signal<boolean>(false);
  readonly isShareModalOpen = signal<boolean>(false);
  readonly isSettingsModalOpen = signal<boolean>(false);
  readonly shareToastMessage = signal<string | null>(null);

  // Backward compatibility alias for isTemplateModalOpen
  readonly isTemplateModalOpen = computed(() => this.isProjectsModalOpen());

  // State Signals
  readonly projectName = signal<string>('reinforced_chest');
  readonly activeBreakpoint = signal<'mobile' | 'tablet' | 'desktop'>('desktop');
  readonly activeTab = signal<'canvas' | 'palette' | 'inspector' | 'code'>('canvas');
  readonly selectedNodeId = signal<string | null>(null);
  readonly zoom = signal<number>(1.0);
  readonly snapStep = signal<number>(0.5);
  readonly snapToGrid = signal<boolean>(true);
  readonly autoSaveEnabled = signal<boolean>(true);

  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  // Interactive Prototype Mode & Event Simulator
  readonly isInteractiveMode = signal<boolean>(false);
  readonly simulatorLogs = signal<SimulatorEvent[]>([]);

  // Canvas Pan Offset
  readonly panOffset = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  // Resizable Panel Widths (Desktop)
  readonly leftPanelWidth = signal<number>(280);
  readonly rightPanelWidth = signal<number>(320);

  // Undo / Redo Stacks
  private readonly undoStack = signal<FormspecAST[]>([]);
  private readonly redoStack = signal<FormspecAST[]>([]);

  // The Master Document AST
  readonly ast: ReturnType<typeof signal<FormspecAST>>;

  // Computed Values
  readonly selectedNode = computed(() => {
    const id = this.selectedNodeId();
    if (!id) return null;
    return this.findNode(this.ast().children, id);
  });

  readonly serializedFormspec = computed(() => {
    return this.parser.serialize(this.ast());
  });

  readonly generatedFormspec = computed(() => {
    return this.serializedFormspec();
  });

  readonly generatedLuaMod = computed(() => {
    return this.luaGen.generateResponsiveMod(this.projectName(), this.ast());
  });

  constructor(
    parser?: FormspecParserService,
    luaGen?: LuaGeneratorService,
    templateRegistry?: TemplateRegistryService,
    storage?: StorageService,
  ) {
    this.parser = parser ?? inject(FormspecParserService);
    this.luaGen = luaGen ?? inject(LuaGeneratorService);
    this.templateRegistry = templateRegistry ?? inject(TemplateRegistryService);
    this.storage = storage ?? inject(StorageService);

    this.ast = signal<FormspecAST>(
      this.templateRegistry.getClonedAST('chest-storage') || {
        version: 7,
        size: { w: 10, h: 8 },
        padding: { x: 0, y: 0 },
        styles: [],
        children: [],
      },
    );

    this.initStorageAndProjects();
  }

  // Panel Resizing Actions
  setLeftPanelWidth(w: number): void {
    const clamped = Math.min(Math.max(w, 200), 520);
    this.leftPanelWidth.set(clamped);
    this.saveSettingsDirectly();
  }

  setRightPanelWidth(w: number): void {
    const clamped = Math.min(Math.max(w, 240), 600);
    this.rightPanelWidth.set(clamped);
    this.saveSettingsDirectly();
  }

  // Actions
  selectNode(id: string | null): void {
    this.selectedNodeId.set(id);
  }

  setBreakpoint(mode: 'mobile' | 'tablet' | 'desktop'): void {
    this.activeBreakpoint.set(mode);
    this.saveSettingsDirectly();
    this.scheduleAutoSave();
  }

  setActiveTab(tab: 'canvas' | 'palette' | 'inspector' | 'code'): void {
    this.activeTab.set(tab);
  }

  setZoom(val: number): void {
    this.zoom.set(Math.min(Math.max(val, 0.5), 2.5));
  }

  setSnapStep(step: number): void {
    this.snapStep.set(step);
    this.saveSettingsDirectly();
  }

  setSnapToGrid(enabled: boolean): void {
    this.snapToGrid.set(enabled);
    this.saveSettingsDirectly();
  }

  setAutoSaveEnabled(enabled: boolean): void {
    this.autoSaveEnabled.set(enabled);
    this.saveSettingsDirectly();
  }

  openProjectsModal(tab: 'projects' | 'templates' | 'import' = 'projects'): void {
    this.projectsModalTab.set(tab);
    this.isProjectsModalOpen.set(true);
  }

  closeProjectsModal(): void {
    this.isProjectsModalOpen.set(false);
  }

  openSettingsModal(): void {
    this.isSettingsModalOpen.set(true);
  }

  closeSettingsModal(): void {
    this.isSettingsModalOpen.set(false);
  }

  updateSettings(partial: Partial<EditorSettings>): void {
    if (typeof partial.snapToGrid === 'boolean') this.snapToGrid.set(partial.snapToGrid);
    if (typeof partial.snapStep === 'number') this.snapStep.set(partial.snapStep);
    if (typeof partial.leftPanelWidth === 'number') this.leftPanelWidth.set(partial.leftPanelWidth);
    if (typeof partial.rightPanelWidth === 'number')
      this.rightPanelWidth.set(partial.rightPanelWidth);
    if (partial.activeBreakpoint) this.activeBreakpoint.set(partial.activeBreakpoint);
    if (typeof partial.autoSaveEnabled === 'boolean')
      this.autoSaveEnabled.set(partial.autoSaveEnabled);
    this.saveSettingsDirectly();
  }

  resetSettingsToDefault(): void {
    this.updateSettings(DEFAULT_SETTINGS);
  }

  saveSettingsDirectly(): void {
    const s: EditorSettings = {
      snapToGrid: this.snapToGrid(),
      snapStep: this.snapStep(),
      leftPanelWidth: this.leftPanelWidth(),
      rightPanelWidth: this.rightPanelWidth(),
      activeBreakpoint: this.activeBreakpoint(),
      autoSaveEnabled: this.autoSaveEnabled(),
    };
    try {
      this.storage.setItem(STORAGE_SETTINGS, JSON.stringify(s));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  clearAllStorageAndReset(): void {
    try {
      for (const p of this.projects()) {
        this.storage.removeItem(STORAGE_PROJECT_PREFIX + p.id);
      }
      this.storage.removeItem(STORAGE_PROJECTS_INDEX);
      this.storage.removeItem(STORAGE_ACTIVE_ID);
      this.storage.removeItem(STORAGE_SETTINGS);
      this.resetSettingsToDefault();
      this.loadTemplate('chest-storage');
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  }

  openTemplateModal(tab: 'projects' | 'templates' | 'import' = 'templates'): void {
    this.openProjectsModal(tab);
  }

  closeTemplateModal(): void {
    this.closeProjectsModal();
  }

  openShortcutsModal(): void {
    this.isShortcutsModalOpen.set(true);
  }

  closeShortcutsModal(): void {
    this.isShortcutsModalOpen.set(false);
  }

  openHelpModal(): void {
    this.isHelpModalOpen.set(true);
  }

  closeHelpModal(): void {
    this.isHelpModalOpen.set(false);
  }

  openShareModal(): void {
    this.isShareModalOpen.set(true);
  }

  closeShareModal(): void {
    this.isShareModalOpen.set(false);
  }

  loadTemplate(templateId: string): void {
    const cloned = this.templateRegistry.getClonedAST(templateId);
    if (cloned) {
      this.pushHistory();
      this.ast.set(cloned);
      this.selectedNodeId.set(null);
      this.closeProjectsModal();
      this.activeTab.set('canvas');
      this.scheduleAutoSave();
    }
  }

  updateNode(id: string, partial: Partial<FormspecNode>): void {
    this.pushHistory();
    this.ast.update((current) => {
      const node = this.findNode(current.children, id);
      if (node) {
        Object.assign(node, partial);
        if (partial.x !== undefined) node.x = snapSlot(partial.x, this.snapStep());
        if (partial.y !== undefined) node.y = snapSlot(partial.y, this.snapStep());
      }
      return { ...current };
    });
  }

  moveNode(id: string, x: number, y: number, recordHistory = false): void {
    if (recordHistory) {
      this.pushHistory();
    }
    const snap = this.snapStep();
    const snappedX = Math.max(0, snapSlot(x, snap));
    const snappedY = Math.max(0, snapSlot(y, snap));

    this.ast.update((current) => {
      const node = this.findNode(current.children, id);
      if (node) {
        node.x = snappedX;
        node.y = snappedY;
      }
      return { ...current };
    });
  }

  updateSize(w: number, h: number): void {
    this.pushHistory();
    this.ast.update((current) => ({
      ...current,
      size: { ...current.size, w: Math.max(w, 2), h: Math.max(h, 2) },
    }));
  }

  updatePosition(x: number, y: number): void {
    this.pushHistory();
    this.ast.update((current) => ({
      ...current,
      position: { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 },
    }));
  }

  updateAnchor(x: number, y: number): void {
    this.pushHistory();
    this.ast.update((current) => ({
      ...current,
      anchor: { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 },
    }));
  }

  updatePadding(x: number, y: number): void {
    this.pushHistory();
    this.ast.update((current) => ({
      ...current,
      padding: {
        x: Math.max(0, Math.round(x * 100) / 100),
        y: Math.max(0, Math.round(y * 100) / 100),
      },
    }));
  }

  toggleNoPrepend(val: boolean): void {
    this.pushHistory();
    this.ast.update((current) => ({
      ...current,
      noPrepend: val,
    }));
  }

  resetPositionAndAnchor(): void {
    this.pushHistory();
    this.ast.update((current) => {
      const copy = { ...current };
      delete copy.position;
      delete copy.anchor;
      return copy;
    });
  }

  addNode(type: FormspecElementType): void {
    this.pushHistory();
    const snap = this.snapStep();
    const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let newNode: FormspecNode = {
      id,
      type,
      x: snapSlot(1, snap),
      y: snapSlot(1, snap),
      w: snapSlot(3, snap),
      h: snapSlot(1, snap),
    };

    switch (type) {
      case 'button':
      case 'button_exit':
        newNode.name = `btn_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label = type === 'button_exit' ? 'Close & Save' : 'Click Me';
        newNode.w = 3;
        newNode.h = 0.8;
        break;

      case 'button_url':
      case 'button_url_exit':
        newNode.name = `btn_url_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label = 'Visit Docs';
        newNode.url = 'https://luanti.org';
        newNode.w = 3.5;
        newNode.h = 0.8;
        break;

      case 'image_button':
      case 'image_button_exit':
        newNode.name = `img_btn_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label = 'Icon Action';
        newNode.texture = 'gui_button.png';
        newNode.w = 3;
        newNode.h = 1;
        break;

      case 'item_image_button':
        newNode.name = `item_btn_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label = 'Steel Pick';
        newNode.texture = 'default:pick_steel';
        newNode.w = 1.2;
        newNode.h = 1.2;
        break;

      case 'field':
      case 'pwdfield':
        newNode.name = `field_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label = type === 'pwdfield' ? 'Password' : 'Text Input';
        newNode.defaultVal = '';
        newNode.w = 5;
        newNode.h = 0.8;
        break;

      case 'textarea':
        newNode.name = `ta_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label = 'Multi-line Description';
        newNode.defaultVal =
          'Welcome to Luanti Formspec Studio!\nVisual v7 editor for responsive UI.';
        newNode.w = 6;
        newNode.h = 2.5;
        break;

      case 'checkbox':
        newNode.name = `cb_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label = 'Enable Option';
        newNode.checked = false;
        newNode.w = 3.5;
        newNode.h = 0.6;
        break;

      case 'dropdown':
        newNode.name = `dd_${Math.random().toString(36).substring(2, 6)}`;
        newNode.dropdownItems = ['Option Alpha', 'Option Beta', 'Option Gamma'];
        newNode.selectedIdx = 0;
        newNode.w = 4;
        newNode.h = 0.8;
        break;

      case 'label':
        newNode.label = 'Information Label';
        newNode.w = 4;
        newNode.h = 0.5;
        break;

      case 'vertlabel':
        newNode.label = 'VERTICAL TITLE';
        newNode.w = 0.6;
        newNode.h = 4;
        break;

      case 'hypertext':
        newNode.name = `ht_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label =
          '<global color=#38bdf8 size=16><b>Formatted Header</b></global>\nVisit <action name=info>docs</action> for guides.';
        newNode.w = 6;
        newNode.h = 2;
        break;

      case 'tooltip':
        newNode.name = 'btn_tooltip';
        newNode.tooltipText = 'Quick hint for this element';
        newNode.tooltipBgColor = '#18181c';
        newNode.tooltipFontColor = '#e4e4e7';
        newNode.w = 3;
        newNode.h = 0.8;
        break;

      case 'hypertip':
        newNode.name = 'item_hypertip';
        newNode.tooltipText =
          '<global color=#34d399><b>Mythic Sword</b></global>\nDamage: 12 HP\nDurability: 500';
        newNode.w = 3.5;
        newNode.h = 1;
        break;

      case 'list':
        newNode.inventoryLocation = 'current_name';
        newNode.inventoryList = 'main';
        newNode.startingIndex = 0;
        newNode.w = 8;
        newNode.h = 2;
        break;

      case 'listring':
        newNode.inventoryLocation = 'current_player';
        newNode.inventoryList = 'main';
        newNode.w = 2;
        newNode.h = 0.5;
        break;

      case 'listcolors':
        newNode.color = '#38383c';
        newNode.w = 2;
        newNode.h = 0.5;
        break;

      case 'listimages':
        newNode.texture = 'gui_hb_bg.svg';
        newNode.pressedTexture = 'gui_furnace_arrow_bg.svg';
        newNode.w = 2;
        newNode.h = 0.5;
        break;

      case 'box':
        newNode.color = '#38bdf8';
        newNode.w = 4;
        newNode.h = 2;
        break;

      case 'background':
        newNode.texture = 'gui_bg.png';
        newNode.w = 8;
        newNode.h = 6;
        break;

      case 'background9':
        newNode.texture = 'gui_formspec_bg.png';
        newNode.middle = '8';
        newNode.w = 8;
        newNode.h = 6;
        break;

      case 'image':
        newNode.texture = 'default_chest.png';
        newNode.w = 2;
        newNode.h = 2;
        break;

      case 'animated_image':
        newNode.name = `anim_${Math.random().toString(36).substring(2, 6)}`;
        newNode.texture = 'fire_animated.png';
        newNode.frameCount = 8;
        newNode.frameDuration = 100;
        newNode.w = 2;
        newNode.h = 2;
        break;

      case 'item_image':
        newNode.texture = 'default:diamondblock';
        newNode.w = 1.5;
        newNode.h = 1.5;
        break;

      case 'model':
        newNode.name = `model_${Math.random().toString(36).substring(2, 6)}`;
        newNode.mesh = 'character.b3d';
        newNode.meshTextures = 'character.png';
        newNode.meshRotation = '0,180';
        newNode.animationSpeed = 30;
        newNode.continuous = false;
        newNode.mouseControl = true;
        newNode.w = 3.5;
        newNode.h = 4.5;
        break;

      case 'tabheader':
        newNode.name = `tabs_${Math.random().toString(36).substring(2, 6)}`;
        newNode.dropdownItems = ['Inventory', 'Crafting', 'Log'];
        newNode.selectedIdx = 0;
        newNode.w = 8;
        newNode.h = 0.8;
        break;

      case 'scrollbar':
        newNode.name = `scr_${Math.random().toString(36).substring(2, 6)}`;
        newNode.orientation = 'vertical';
        newNode.defaultVal = '0';
        newNode.w = 0.5;
        newNode.h = 4;
        break;

      case 'scroll_container':
        newNode.scrollbarName = 'scr_main';
        newNode.orientation = 'vertical';
        newNode.scrollFactor = 0.1;
        newNode.contentPadding = 0.5;
        newNode.w = 8;
        newNode.h = 4;
        newNode.children = [];
        break;

      case 'table':
        newNode.name = `tbl_${Math.random().toString(36).substring(2, 6)}`;
        newNode.dropdownItems = [
          'Diamond Ore,64,Mine A',
          'Mese Crystal,16,Mine B',
          'Steel Ingot,99,Furnace 1',
        ];
        newNode.selectedIdx = 0;
        newNode.w = 6;
        newNode.h = 3;
        break;

      case 'textlist':
        newNode.name = `tl_${Math.random().toString(36).substring(2, 6)}`;
        newNode.dropdownItems = [
          '[SYSTEM] Server loaded in 0.42s',
          '[INFO] Player joined the game',
          '[WARN] Low mana warning',
        ];
        newNode.selectedIdx = 0;
        newNode.w = 6;
        newNode.h = 3;
        break;

      case 'allow_close':
        newNode.allowClose = false;
        newNode.w = 2;
        newNode.h = 0.5;
        break;

      case 'set_focus':
        newNode.focusTarget = 'btn_submit';
        newNode.forceFocus = false;
        newNode.w = 2;
        newNode.h = 0.5;
        break;

      default:
        break;
    }

    this.ast.update((current) => ({
      ...current,
      children: [...current.children, newNode],
    }));

    this.selectedNodeId.set(id);
    this.activeTab.set('canvas');
  }

  deleteNode(id: string): void {
    this.pushHistory();
    this.ast.update((current) => ({
      ...current,
      children: current.children.filter((n) => n.id !== id),
    }));
    if (this.selectedNodeId() === id) {
      this.selectedNodeId.set(null);
    }
  }

  reorderNode(id: string, direction: 'up' | 'down'): void {
    this.pushHistory();
    this.ast.update((current) => {
      const idx = current.children.findIndex((n) => n.id === id);
      if (idx === -1) return current;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= current.children.length) return current;

      const newChildren = [...current.children];
      const temp = newChildren[idx];
      newChildren[idx] = newChildren[targetIdx];
      newChildren[targetIdx] = temp;

      return { ...current, children: newChildren };
    });
  }

  duplicateNode(id: string): void {
    const node = this.findNode(this.ast().children, id);
    if (!node) return;

    this.pushHistory();
    const snap = this.snapStep();
    const cloned: FormspecNode = JSON.parse(JSON.stringify(node));
    cloned.id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    cloned.x = snapSlot(node.x + 0.5, snap);
    cloned.y = snapSlot(node.y + 0.5, snap);
    if (cloned.name) {
      cloned.name = `${cloned.name}_copy`;
    }

    this.ast.update((current) => ({
      ...current,
      children: [...current.children, cloned],
    }));
    this.selectedNodeId.set(cloned.id);
  }

  // Interactive Prototype Simulator Actions
  toggleInteractiveMode(): void {
    this.isInteractiveMode.update((v) => !v);
  }

  setInteractiveMode(val: boolean): void {
    this.isInteractiveMode.set(val);
  }

  clearSimulatorLogs(): void {
    this.simulatorLogs.set([]);
  }

  recordSimulatorEvent(event: Omit<SimulatorEvent, 'id' | 'timestamp'>): void {
    const newEvent: SimulatorEvent = {
      ...event,
      id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.simulatorLogs.update((logs) => [newEvent, ...logs.slice(0, 49)]);
  }

  // Canvas Pan Actions
  setPanOffset(x: number, y: number): void {
    this.panOffset.set({ x, y });
  }

  resetPan(): void {
    this.panOffset.set({ x: 0, y: 0 });
  }

  // Layer Locking & Visibility
  toggleLockNode(id: string): void {
    this.pushHistory();
    this.ast.update((current) => {
      const node = this.findNode(current.children, id);
      if (node) {
        node.locked = !node.locked;
      }
      return { ...current };
    });
  }

  toggleHideNode(id: string): void {
    this.pushHistory();
    this.ast.update((current) => {
      const node = this.findNode(current.children, id);
      if (node) {
        node.hidden = !node.hidden;
      }
      return { ...current };
    });
  }

  bringToFront(id: string): void {
    this.pushHistory();
    this.ast.update((current) => {
      const idx = current.children.findIndex((n) => n.id === id);
      if (idx === -1 || idx === current.children.length - 1) return current;
      const target = current.children[idx];
      const rest = current.children.filter((n) => n.id !== id);
      return { ...current, children: [...rest, target] };
    });
  }

  sendToBack(id: string): void {
    this.pushHistory();
    this.ast.update((current) => {
      const idx = current.children.findIndex((n) => n.id === id);
      if (idx <= 0) return current;
      const target = current.children[idx];
      const rest = current.children.filter((n) => n.id !== id);
      return { ...current, children: [target, ...rest] };
    });
  }

  // Bounding Box Resize
  resizeNode(
    id: string,
    w: number,
    h: number,
    x?: number,
    y?: number,
    recordHistory = false,
  ): void {
    if (recordHistory) {
      this.pushHistory();
    }
    const snap = this.snapStep();
    const clampedW = Math.max(snap, snapSlot(w, snap));
    const clampedH = Math.max(snap, snapSlot(h, snap));

    this.ast.update((current) => {
      const node = this.findNode(current.children, id);
      if (node) {
        node.w = clampedW;
        node.h = clampedH;
        if (x !== undefined) node.x = Math.max(0, snapSlot(x, snap));
        if (y !== undefined) node.y = Math.max(0, snapSlot(y, snap));
      }
      return { ...current };
    });
  }

  // Keyboard Nudge (<kbd>Arrow keys</kbd> + <kbd>Shift</kbd>)
  nudgeSelected(dx: number, dy: number): void {
    const id = this.selectedNodeId();
    if (!id) return;
    const node = this.selectedNode();
    if (!node || node.locked) return;

    this.pushHistory();
    const snap = this.snapStep();
    const newX = Math.max(0, snapSlot(node.x + dx * snap, snap));
    const newY = Math.max(0, snapSlot(node.y + dy * snap, snap));

    this.ast.update((current) => {
      const target = this.findNode(current.children, id);
      if (target) {
        target.x = newX;
        target.y = newY;
      }
      return { ...current };
    });
  }

  // Figma-Style Alignments (relative to Canvas or Margins)
  alignSelected(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
    const id = this.selectedNodeId();
    if (!id) return;
    const node = this.selectedNode();
    if (!node || node.locked) return;

    this.pushHistory();
    const canvasW = this.ast().size.w;
    const canvasH = this.ast().size.h;
    const snap = this.snapStep();

    let newX = node.x;
    let newY = node.y;

    switch (alignment) {
      case 'left':
        newX = snapSlot(0.5, snap);
        break;
      case 'center':
        newX = Math.max(0, snapSlot((canvasW - node.w) / 2, snap));
        break;
      case 'right':
        newX = Math.max(0, snapSlot(canvasW - node.w - 0.5, snap));
        break;
      case 'top':
        newY = snapSlot(0.5, snap);
        break;
      case 'middle':
        newY = Math.max(0, snapSlot((canvasH - node.h) / 2, snap));
        break;
      case 'bottom':
        newY = Math.max(0, snapSlot(canvasH - node.h - 0.5, snap));
        break;
    }

    this.ast.update((current) => {
      const target = this.findNode(current.children, id);
      if (target) {
        target.x = newX;
        target.y = newY;
      }
      return { ...current };
    });
  }

  // Tidy Up / Distribute Evenly
  distributeNodes(axis: 'horizontal' | 'vertical'): void {
    const children = this.ast().children.filter((n) => !n.hidden);
    if (children.length <= 2) return;

    this.pushHistory();
    const snap = this.snapStep();

    if (axis === 'horizontal') {
      const sorted = [...children].sort((a, b) => a.x - b.x);
      const minX = sorted[0].x;
      const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w;
      const totalWidth = sorted.reduce((sum, n) => sum + n.w, 0);
      const remainingSpace = maxX - minX - totalWidth;
      const gap = Math.max(0, remainingSpace / (sorted.length - 1));

      let currentX = minX;
      this.ast.update((current) => {
        sorted.forEach((item, i) => {
          if (i > 0) {
            const target = this.findNode(current.children, item.id);
            if (target && !target.locked) {
              target.x = snapSlot(currentX, snap);
            }
          }
          currentX += item.w + gap;
        });
        return { ...current };
      });
    } else {
      const sorted = [...children].sort((a, b) => a.y - b.y);
      const minY = sorted[0].y;
      const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h;
      const totalHeight = sorted.reduce((sum, n) => sum + n.h, 0);
      const remainingSpace = maxY - minY - totalHeight;
      const gap = Math.max(0, remainingSpace / (sorted.length - 1));

      let currentY = minY;
      this.ast.update((current) => {
        sorted.forEach((item, i) => {
          if (i > 0) {
            const target = this.findNode(current.children, item.id);
            if (target && !target.locked) {
              target.y = snapSlot(currentY, snap);
            }
          }
          currentY += item.h + gap;
        });
        return { ...current };
      });
    }
  }

  undo(): void {
    const history = this.undoStack();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    this.undoStack.set(history.slice(0, -1));
    this.redoStack.update((stack) => [...stack, JSON.parse(JSON.stringify(this.ast()))]);
    this.ast.set(previous);
    this.scheduleAutoSave();
  }

  redo(): void {
    const future = this.redoStack();
    if (future.length === 0) return;

    const next = future[future.length - 1];
    this.redoStack.set(future.slice(0, -1));
    this.undoStack.update((stack) => [...stack, JSON.parse(JSON.stringify(this.ast()))]);
    this.ast.set(next);
    this.scheduleAutoSave();
  }

  private pushHistory(): void {
    const snapshot = JSON.parse(JSON.stringify(this.ast()));
    this.undoStack.update((stack) => [...stack.slice(-30), snapshot]);
    this.redoStack.set([]);
    this.scheduleAutoSave();
  }

  private findNode(nodes: FormspecNode[], id: string): FormspecNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // =========================================================================
  // Project Management & Persistence Actions
  // =========================================================================

  setProjectName(name: string): void {
    const trimmed = name.trim();
    if (trimmed) {
      this.projectName.set(trimmed);
      this.scheduleAutoSave();
    }
  }

  createNewProject(name?: string, w = 10, h = 8): void {
    const id = 'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const projName = name?.trim() || `formspec_${this.projects().length + 1}`;
    const newAst: FormspecAST = {
      version: 7,
      size: { w, h },
      styles: [],
      children: [],
    };
    const meta: ProjectMetadata = {
      id,
      name: projName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      widgetCount: 0,
      dimensions: { w, h },
    };

    this.saveProjectDirectly(meta, newAst);
    this.projects.update((list) => [meta, ...list]);
    this.storage.setItem(STORAGE_PROJECTS_INDEX, JSON.stringify(this.projects()));
    this.storage.setItem(STORAGE_ACTIVE_ID, id);

    this.currentProjectId.set(id);
    this.projectName.set(projName);
    this.ast.set(newAst);
    this.selectedNodeId.set(null);
    this.undoStack.set([]);
    this.redoStack.set([]);
    this.closeProjectsModal();
    this.activeTab.set('canvas');
    this.saveStatus.set('saved');
  }

  switchProject(projectId: string): void {
    const projData = this.storage.getItem(STORAGE_PROJECT_PREFIX + projectId);
    if (!projData) return;
    try {
      const file: ProjectFile = JSON.parse(projData);
      if (file && file.ast) {
        this.currentProjectId.set(projectId);
        this.projectName.set(file.metadata.name);
        this.ast.set(file.ast);
        if (file.viewport?.zoom) this.zoom.set(file.viewport.zoom);
        if (file.viewport?.pan) this.panOffset.set(file.viewport.pan);
        if (file.viewport?.breakpoint) this.activeBreakpoint.set(file.viewport.breakpoint);
        this.selectedNodeId.set(null);
        this.undoStack.set([]);
        this.redoStack.set([]);
        this.storage.setItem(STORAGE_ACTIVE_ID, projectId);
        this.closeProjectsModal();
        this.activeTab.set('canvas');
      }
    } catch (e) {
      console.error('Failed to load project:', e);
    }
  }

  duplicateProject(projectId: string): void {
    const projData = this.storage.getItem(STORAGE_PROJECT_PREFIX + projectId);
    if (!projData) return;
    try {
      const file: ProjectFile = JSON.parse(projData);
      const newId =
        'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      const newName = `${file.metadata.name}_copy`;
      const clonedAst: FormspecAST = JSON.parse(JSON.stringify(file.ast));
      const meta: ProjectMetadata = {
        id: newId,
        name: newName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        widgetCount: file.metadata.widgetCount,
        dimensions: { ...file.metadata.dimensions },
      };
      this.saveProjectDirectly(meta, clonedAst);
      this.projects.update((list) => [meta, ...list]);
      this.storage.setItem(STORAGE_PROJECTS_INDEX, JSON.stringify(this.projects()));
    } catch (e) {
      console.error('Failed to duplicate project:', e);
    }
  }

  deleteProject(projectId: string): void {
    this.storage.removeItem(STORAGE_PROJECT_PREFIX + projectId);
    const updated = this.projects().filter((p) => p.id !== projectId);
    this.projects.set(updated);
    this.storage.setItem(STORAGE_PROJECTS_INDEX, JSON.stringify(updated));

    if (this.currentProjectId() === projectId) {
      if (updated.length > 0) {
        this.switchProject(updated[0].id);
      } else {
        this.createNewProject('default_formspec');
      }
    }
  }

  exportProjectJson(projectId?: string): void {
    const id = projectId || this.currentProjectId();
    let file: ProjectFile;
    if (id === this.currentProjectId()) {
      file = {
        version: 1,
        metadata: {
          id: this.currentProjectId(),
          name: this.projectName(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          widgetCount: this.countWidgets(this.ast().children),
          dimensions: { w: this.ast().size.w, h: this.ast().size.h },
        },
        ast: this.ast(),
        viewport: {
          zoom: this.zoom(),
          pan: this.panOffset(),
          breakpoint: this.activeBreakpoint(),
        },
      };
    } else {
      const data = this.storage.getItem(STORAGE_PROJECT_PREFIX + id);
      if (!data) return;
      file = JSON.parse(data);
    }
    const filename = `${file.metadata.name || 'formspec'}.formspec.json`;
    this.downloadFile(filename, JSON.stringify(file, null, 2), 'application/json');
  }

  importProjectJson(jsonContent: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      let targetAst: FormspecAST | null = null;
      let targetName = 'imported_project';

      if (parsed.ast && parsed.metadata) {
        targetAst = parsed.ast;
        targetName = parsed.metadata.name || targetName;
      } else if (parsed.version && Array.isArray(parsed.children)) {
        targetAst = parsed;
      }

      if (!targetAst) return false;

      const newId =
        'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      const meta: ProjectMetadata = {
        id: newId,
        name: targetName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        widgetCount: this.countWidgets(targetAst.children),
        dimensions: { w: targetAst.size.w, h: targetAst.size.h },
      };

      this.saveProjectDirectly(meta, targetAst);
      this.projects.update((list) => [meta, ...list]);
      this.storage.setItem(STORAGE_PROJECTS_INDEX, JSON.stringify(this.projects()));
      this.storage.setItem(STORAGE_ACTIVE_ID, newId);

      this.currentProjectId.set(newId);
      this.projectName.set(targetName);
      this.ast.set(targetAst);
      this.selectedNodeId.set(null);
      this.undoStack.set([]);
      this.redoStack.set([]);
      this.closeProjectsModal();
      this.activeTab.set('canvas');
      this.saveStatus.set('saved');
      return true;
    } catch (e) {
      console.error('Failed to import JSON project:', e);
      return false;
    }
  }

  importRawFormspec(formspecStr: string, name?: string): boolean {
    try {
      if (!formspecStr || !formspecStr.trim()) return false;
      const parsedAst = this.parser.parse(formspecStr.trim());
      const targetName = name?.trim() || `imported_${Date.now().toString(36).slice(-4)}`;
      const newId =
        'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      const meta: ProjectMetadata = {
        id: newId,
        name: targetName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        widgetCount: this.countWidgets(parsedAst.children),
        dimensions: { w: parsedAst.size.w, h: parsedAst.size.h },
      };

      this.saveProjectDirectly(meta, parsedAst);
      this.projects.update((list) => [meta, ...list]);
      this.storage.setItem(STORAGE_PROJECTS_INDEX, JSON.stringify(this.projects()));
      this.storage.setItem(STORAGE_ACTIVE_ID, newId);

      this.currentProjectId.set(newId);
      this.projectName.set(targetName);
      this.ast.set(parsedAst);
      this.selectedNodeId.set(null);
      this.undoStack.set([]);
      this.redoStack.set([]);
      this.closeProjectsModal();
      this.activeTab.set('canvas');
      this.saveStatus.set('saved');
      return true;
    } catch (e) {
      console.error('Failed to import raw formspec:', e);
      return false;
    }
  }

  exportLuaMod(): void {
    const luaCode = this.generatedLuaMod();
    const filename = `${
      this.projectName()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_') || 'formspec'
    }_init.lua`;
    this.downloadFile(filename, luaCode, 'text/plain');
  }

  generateShareUrl(): string {
    const rawFormspec = this.serializedFormspec();
    const origin =
      typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const shareUrl = `${origin}#formspec=${encodeURIComponent(rawFormspec)}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }

    this.shareToastMessage.set('Share link copied to clipboard!');
    setTimeout(() => {
      this.shareToastMessage.set(null);
    }, 3000);

    return shareUrl;
  }

  saveCurrentProject(): void {
    const currentId = this.currentProjectId();
    const count = this.countWidgets(this.ast().children);
    const existing = this.projects().find((p) => p.id === currentId);
    const meta: ProjectMetadata = {
      id: currentId,
      name: this.projectName(),
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      widgetCount: count,
      dimensions: { w: this.ast().size.w, h: this.ast().size.h },
    };

    this.saveProjectDirectly(meta, this.ast());

    this.projects.update((list) => {
      const idx = list.findIndex((p) => p.id === currentId);
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = meta;
        return copy;
      }
      return [meta, ...list];
    });

    this.storage.setItem(STORAGE_PROJECTS_INDEX, JSON.stringify(this.projects()));
    this.storage.setItem(STORAGE_ACTIVE_ID, currentId);
    this.saveStatus.set('saved');
  }

  private scheduleAutoSave(): void {
    if (!this.autoSaveEnabled()) return;
    this.saveStatus.set('saving');
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.saveCurrentProject();
      this.saveSettingsDirectly();
    }, 500);
  }

  private initStorageAndProjects(): void {
    // 0. Restore Persistent Settings
    try {
      const rawSettings = this.storage.getItem(STORAGE_SETTINGS);
      if (rawSettings) {
        const loaded: Partial<EditorSettings> = JSON.parse(rawSettings);
        if (typeof loaded.snapToGrid === 'boolean') this.snapToGrid.set(loaded.snapToGrid);
        if (typeof loaded.snapStep === 'number') this.snapStep.set(loaded.snapStep);
        if (typeof loaded.leftPanelWidth === 'number')
          this.leftPanelWidth.set(loaded.leftPanelWidth);
        if (typeof loaded.rightPanelWidth === 'number')
          this.rightPanelWidth.set(loaded.rightPanelWidth);
        if (loaded.activeBreakpoint) this.activeBreakpoint.set(loaded.activeBreakpoint);
        if (typeof loaded.autoSaveEnabled === 'boolean')
          this.autoSaveEnabled.set(loaded.autoSaveEnabled);
      }
    } catch (e) {
      console.warn('Failed to restore settings:', e);
    }

    // 1. Check URL hash first (e.g. #formspec=... or #project=...)
    if (typeof window !== 'undefined' && window.location?.hash) {
      const hash = window.location.hash;
      if (hash.startsWith('#formspec=')) {
        try {
          const raw = decodeURIComponent(hash.substring(10));
          if (raw.trim()) {
            const parsedAst = this.parser.parse(raw);
            this.ast.set(parsedAst);
            this.projectName.set('shared_formspec');
            return;
          }
        } catch (e) {
          console.warn('Failed to parse #formspec URL hash:', e);
        }
      } else if (hash.startsWith('#project=')) {
        try {
          const jsonStr = decodeURIComponent(hash.substring(9));
          const parsed = JSON.parse(jsonStr);
          if (parsed && (parsed.ast || parsed.children)) {
            const importedAst = parsed.ast || parsed;
            this.ast.set(importedAst);
            if (parsed.metadata?.name) {
              this.projectName.set(parsed.metadata.name);
            }
            return;
          }
        } catch (e) {
          console.warn('Failed to parse #project URL hash:', e);
        }
      }
    }

    // 2. Check local storage index
    try {
      const indexRaw = this.storage.getItem(STORAGE_PROJECTS_INDEX);
      if (indexRaw) {
        const list: ProjectMetadata[] = JSON.parse(indexRaw);
        if (Array.isArray(list) && list.length > 0) {
          this.projects.set(list);
          const activeId = this.storage.getItem(STORAGE_ACTIVE_ID) || list[0].id;
          const projData = this.storage.getItem(STORAGE_PROJECT_PREFIX + activeId);
          if (projData) {
            const projectFile: ProjectFile = JSON.parse(projData);
            if (projectFile && projectFile.ast) {
              this.currentProjectId.set(activeId);
              this.projectName.set(projectFile.metadata.name);
              this.ast.set(projectFile.ast);
              if (projectFile.viewport?.zoom) this.zoom.set(projectFile.viewport.zoom);
              if (projectFile.viewport?.pan) this.panOffset.set(projectFile.viewport.pan);
              if (projectFile.viewport?.breakpoint)
                this.activeBreakpoint.set(projectFile.viewport.breakpoint);
              return;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore projects from storage:', e);
    }

    // 3. Fallback: Initialize default project with current AST
    const defaultMeta: ProjectMetadata = {
      id: 'default',
      name: this.projectName(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      widgetCount: this.countWidgets(this.ast().children),
      dimensions: { w: this.ast().size.w, h: this.ast().size.h },
    };
    this.projects.set([defaultMeta]);
    this.saveProjectDirectly(defaultMeta, this.ast());
    this.storage.setItem(STORAGE_PROJECTS_INDEX, JSON.stringify([defaultMeta]));
    this.storage.setItem(STORAGE_ACTIVE_ID, 'default');
  }

  private saveProjectDirectly(meta: ProjectMetadata, ast: FormspecAST): void {
    const file: ProjectFile = {
      version: 1,
      metadata: meta,
      ast,
      viewport: {
        zoom: this.zoom(),
        pan: this.panOffset(),
        breakpoint: this.activeBreakpoint(),
      },
    };
    this.storage.setItem(STORAGE_PROJECT_PREFIX + meta.id, JSON.stringify(file));
  }

  countWidgets(nodes: FormspecNode[]): number {
    let count = nodes.length;
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        count += this.countWidgets(node.children);
      }
    }
    return count;
  }

  private downloadFile(filename: string, content: string, mimeType = 'text/plain'): void {
    if (typeof window === 'undefined') return;
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('File download failed:', err);
    }
  }
}
