import { Injectable, signal, computed, inject } from '@angular/core';
import { FormspecAST, FormspecNode, FormspecElementType } from '../models/formspec.models';
import { FormspecParserService } from '../services/formspec-parser.service';
import { LuaGeneratorService } from '../services/lua-generator.service';
import { TemplateRegistryService } from '../services/template-registry.service';
import { StorageService } from '../services/storage.service';
import { snapSlot } from '../utils/coordinate.utils';

@Injectable({
  providedIn: 'root',
})
export class EditorStore {
  private readonly parser: FormspecParserService;
  private readonly luaGen: LuaGeneratorService;
  private readonly templateRegistry: TemplateRegistryService;
  private readonly storage: StorageService;

  // State Signals
  readonly projectName = signal<string>('reinforced_chest');
  readonly activeBreakpoint = signal<'mobile' | 'tablet' | 'desktop'>('desktop');
  readonly activeTab = signal<'canvas' | 'palette' | 'inspector' | 'code'>('canvas');
  readonly selectedNodeId = signal<string | null>(null);
  readonly zoom = signal<number>(1.0);
  readonly snapStep = signal<number>(0.5);
  readonly isTemplateModalOpen = signal<boolean>(false);

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

  readonly generatedLuaMod = computed(() => {
    return this.luaGen.generateResponsiveMod(this.projectName(), this.ast());
  });

  constructor(
    parser?: FormspecParserService,
    luaGen?: LuaGeneratorService,
    templateRegistry?: TemplateRegistryService,
    storage?: StorageService
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
      }
    );
  }

  // Actions
  selectNode(id: string | null): void {
    this.selectedNodeId.set(id);
  }

  setBreakpoint(mode: 'mobile' | 'tablet' | 'desktop'): void {
    this.activeBreakpoint.set(mode);
  }

  setActiveTab(tab: 'canvas' | 'palette' | 'inspector' | 'code'): void {
    this.activeTab.set(tab);
  }

  setZoom(val: number): void {
    this.zoom.set(Math.min(Math.max(val, 0.5), 2.5));
  }

  setSnapStep(step: number): void {
    this.snapStep.set(step);
  }

  openTemplateModal(): void {
    this.isTemplateModalOpen.set(true);
  }

  closeTemplateModal(): void {
    this.isTemplateModalOpen.set(false);
  }

  loadTemplate(templateId: string): void {
    const cloned = this.templateRegistry.getClonedAST(templateId);
    if (cloned) {
      this.pushHistory();
      this.ast.set(cloned);
      this.selectedNodeId.set(null);
      this.closeTemplateModal();
      this.activeTab.set('canvas');
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

  updateSize(w: number, h: number): void {
    this.pushHistory();
    this.ast.update((current) => ({
      ...current,
      size: { ...current.size, w: Math.max(w, 2), h: Math.max(h, 2) },
    }));
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
        newNode.label = 'Click Me';
        newNode.w = 3;
        newNode.h = 0.8;
        break;

      case 'field':
        newNode.name = `field_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label = 'Text Input';
        newNode.defaultVal = '';
        newNode.w = 5;
        newNode.h = 0.8;
        break;

      case 'checkbox':
        newNode.name = `cb_${Math.random().toString(36).substring(2, 6)}`;
        newNode.label = 'Enable Option';
        newNode.checked = false;
        newNode.w = 3;
        newNode.h = 0.8;
        break;

      case 'label':
        newNode.label = 'Information Label';
        newNode.w = 4;
        newNode.h = 0.5;
        break;

      case 'list':
        newNode.inventoryLocation = 'current_name';
        newNode.inventoryList = 'main';
        newNode.startingIndex = 0;
        newNode.w = 8;
        newNode.h = 2;
        break;

      case 'box':
        newNode.color = '#38bdf8';
        newNode.w = 4;
        newNode.h = 2;
        break;

      case 'background9':
        newNode.texture = 'gui_formspec_bg.png';
        newNode.w = 8;
        newNode.h = 6;
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

  undo(): void {
    const history = this.undoStack();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    this.undoStack.set(history.slice(0, -1));
    this.redoStack.update((stack) => [...stack, JSON.parse(JSON.stringify(this.ast()))]);
    this.ast.set(previous);
  }

  redo(): void {
    const future = this.redoStack();
    if (future.length === 0) return;

    const next = future[future.length - 1];
    this.redoStack.set(future.slice(0, -1));
    this.undoStack.update((stack) => [...stack, JSON.parse(JSON.stringify(this.ast()))]);
    this.ast.set(next);
  }

  private pushHistory(): void {
    this.undoStack.update((stack) => [...stack.slice(-20), JSON.parse(JSON.stringify(this.ast()))]);
    this.redoStack.set([]);
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
}
