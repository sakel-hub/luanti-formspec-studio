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
});
