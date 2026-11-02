import { describe, it, expect } from 'vitest';
import { EditorStore } from './editor.store';
import { FormspecParserService } from '../services/formspec-parser.service';
import { LuaGeneratorService } from '../services/lua-generator.service';
import { TemplateRegistryService } from '../services/template-registry.service';
import { StorageService } from '../services/storage.service';

describe('EditorStore', () => {
  function createStore(): EditorStore {
    const parser = new FormspecParserService();
    const luaGen = new LuaGeneratorService(parser);
    const templateRegistry = new TemplateRegistryService();
    const storage = new StorageService();
    return new EditorStore(parser, luaGen, templateRegistry, storage);
  }

  it('initializes with default template and allows adding nodes', () => {
    const store = createStore();
    expect(store.ast().children.length).toBeGreaterThan(0);

    const initialCount = store.ast().children.length;
    store.addNode('button');
    expect(store.ast().children.length).toBe(initialCount + 1);
  });

  it('supports undo and redo operations', () => {
    const store = createStore();
    const initialCount = store.ast().children.length;

    store.addNode('button');
    expect(store.ast().children.length).toBe(initialCount + 1);

    store.undo();
    expect(store.ast().children.length).toBe(initialCount);

    store.redo();
    expect(store.ast().children.length).toBe(initialCount + 1);
  });

  it('switches breakpoints seamlessly', () => {
    const store = createStore();
    expect(store.activeBreakpoint()).toBe('desktop');

    store.setBreakpoint('mobile');
    expect(store.activeBreakpoint()).toBe('mobile');
  });

  it('updates screen position, anchor, and padding', () => {
    const store = createStore();
    expect(store.ast().position).toBeUndefined();

    store.updatePosition(0, 0.5);
    expect(store.ast().position).toEqual({ x: 0, y: 0.5 });

    store.updateAnchor(0, 0.5);
    expect(store.ast().anchor).toEqual({ x: 0, y: 0.5 });

    store.updatePadding(0.2, 0.2);
    expect(store.ast().padding).toEqual({ x: 0.2, y: 0.2 });

    store.resetPositionAndAnchor();
    expect(store.ast().position).toBeUndefined();
    expect(store.ast().anchor).toBeUndefined();
  });

  it('resizes a node with grid snapping', () => {
    const store = createStore();
    store.addNode('button');
    const nodeId = store.selectedNodeId()!;

    store.resizeNode(nodeId, 4.23, 1.87);
    const updated = store.selectedNode()!;
    // Default snapStep is 0.5
    expect(updated.w).toBe(4.0);
    expect(updated.h).toBe(2.0);
  });

  it('aligns selected node relative to container', () => {
    const store = createStore();
    store.addNode('button'); // w: 3, h: 0.8
    const nodeId = store.selectedNodeId()!;

    // Align left (0.5 margin)
    store.alignSelected('left');
    expect(store.selectedNode()!.x).toBe(0.5);

    // Align center: (size.w [9] - 3) / 2 = 3.0
    store.alignSelected('center');
    expect(store.selectedNode()!.x).toBe(3.0);

    // Align right: size.w [9] - 3 - 0.5 = 5.5
    store.alignSelected('right');
    expect(store.selectedNode()!.x).toBe(5.5);
  });

  it('nudges selected node with arrow keys', () => {
    const store = createStore();
    store.addNode('button');
    const startX = store.selectedNode()!.x;

    store.nudgeSelected(1, 0); // +1 snap step (0.5)
    expect(store.selectedNode()!.x).toBe(startX + 0.5);
  });

  it('toggles lock and hide flags on nodes', () => {
    const store = createStore();
    store.addNode('button');
    const nodeId = store.selectedNodeId()!;

    expect(store.selectedNode()!.locked).toBeFalsy();
    store.toggleLockNode(nodeId);
    expect(store.selectedNode()!.locked).toBe(true);

    expect(store.selectedNode()!.hidden).toBeFalsy();
    store.toggleHideNode(nodeId);
    expect(store.selectedNode()!.hidden).toBe(true);
  });

  it('brings node to front and sends to back in z-index render order', () => {
    const store = createStore();
    store.addNode('button');
    const firstId = store.selectedNodeId()!;
    store.addNode('label');
    const secondId = store.selectedNodeId()!;

    const lastIdx = store.ast().children.length - 1;
    expect(store.ast().children[lastIdx].id).toBe(secondId);

    // Send second node to back
    store.sendToBack(secondId);
    expect(store.ast().children[0].id).toBe(secondId);

    // Bring it back to front
    store.bringToFront(secondId);
    expect(store.ast().children[store.ast().children.length - 1].id).toBe(secondId);
  });

  it('records and clears simulator events', () => {
    const store = createStore();
    expect(store.simulatorLogs().length).toBe(0);

    store.recordSimulatorEvent({
      eventType: 'click',
      widgetName: 'btn_test',
      widgetType: 'button',
      fields: { btn_test: 'Submit' },
    });

    expect(store.simulatorLogs().length).toBe(1);
    expect(store.simulatorLogs()[0].widgetName).toBe('btn_test');

    store.clearSimulatorLogs();
    expect(store.simulatorLogs().length).toBe(0);
  });

  it('creates, duplicates, switches, and deletes projects', () => {
    const store = createStore();
    expect(store.projects().length).toBeGreaterThan(0);

    // Create project
    store.createNewProject('custom_dialogue', 12, 9);
    expect(store.projectName()).toBe('custom_dialogue');
    expect(store.ast().size.w).toBe(12);
    expect(store.ast().size.h).toBe(9);
    expect(store.ast().children.length).toBe(0);

    const dialogProjId = store.currentProjectId();

    // Duplicate project
    store.duplicateProject(dialogProjId);
    expect(store.projects().some((p) => p.name === 'custom_dialogue_copy')).toBe(true);

    // Switch back to original default project
    const defaultProj = store.projects().find((p) => p.id === 'default');
    if (defaultProj) {
      store.switchProject('default');
      expect(store.currentProjectId()).toBe('default');
    }

    // Delete custom dialogue project
    store.deleteProject(dialogProjId);
    expect(store.projects().some((p) => p.id === dialogProjId)).toBe(false);
  });

  it('imports and exports project JSON and raw formspec', () => {
    const store = createStore();

    // Import Raw Formspec String
    const rawFormspec = 'formspec_version[7]size[8,6]button[1,1;2,0.8;btn_hello;Hello]';
    const rawSuccess = store.importRawFormspec(rawFormspec, 'raw_test');
    expect(rawSuccess).toBe(true);
    expect(store.projectName()).toBe('raw_test');
    expect(store.ast().size.w).toBe(8);
    expect(store.ast().size.h).toBe(6);
    expect(store.ast().children.length).toBe(1);
    expect(store.ast().children[0].name).toBe('btn_hello');

    // Import Project JSON
    const jsonProject = JSON.stringify({
      version: 1,
      metadata: {
        id: 'imported_123',
        name: 'json_imported_shop',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        widgetCount: 1,
        dimensions: { w: 14, h: 10 },
      },
      ast: {
        version: 7,
        size: { w: 14, h: 10 },
        styles: [],
        children: [{ id: 'lbl_1', type: 'label', x: 2, y: 2, w: 4, h: 1, label: 'Shopkeeper' }],
      },
    });

    const jsonSuccess = store.importProjectJson(jsonProject);
    expect(jsonSuccess).toBe(true);
    expect(store.projectName()).toBe('json_imported_shop');
    expect(store.ast().size.w).toBe(14);
    expect(store.ast().children[0].label).toBe('Shopkeeper');
  });
});
