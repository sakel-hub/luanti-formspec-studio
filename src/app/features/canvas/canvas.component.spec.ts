import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { CanvasComponent } from './canvas.component';
import { EditorStore } from '../../core/state/editor.store';
import { FormspecParserService } from '../../core/services/formspec-parser.service';
import { LuaGeneratorService } from '../../core/services/lua-generator.service';
import { TemplateRegistryService } from '../../core/services/template-registry.service';
import { StorageService } from '../../core/services/storage.service';

describe('CanvasComponent Simulator Frame', () => {
  let component: CanvasComponent;
  let store: EditorStore;

  beforeEach(() => {
    const parser = new FormspecParserService();
    const luaGen = new LuaGeneratorService(parser);
    const templateRegistry = new TemplateRegistryService();
    const storage = new StorageService();
    store = new EditorStore(parser, luaGen, templateRegistry, storage);

    const injector = Injector.create({
      providers: [
        { provide: EditorStore, useValue: store },
      ],
    });

    runInInjectionContext(injector, () => {
      component = new CanvasComponent();
    });
  });

  it('provides exact simulator frame dimensions for mobile breakpoint', () => {
    store.setBreakpoint('mobile');
    expect(component.getSimulatorWidth()).toBe(390);
    expect(component.getSimulatorHeight()).toBe(720);
    expect(component.getSimulatorBorderRadius()).toBe(36);
  });

  it('provides exact simulator frame dimensions for tablet breakpoint', () => {
    store.setBreakpoint('tablet');
    expect(component.getSimulatorWidth()).toBe(768);
    expect(component.getSimulatorHeight()).toBe(600);
    expect(component.getSimulatorBorderRadius()).toBe(20);
  });

  it('provides exact simulator frame dimensions for desktop breakpoint', () => {
    store.setBreakpoint('desktop');
    expect(component.getSimulatorWidth()).toBe(1152);
    expect(component.getSimulatorHeight()).toBe(720);
    expect(component.getSimulatorBorderRadius()).toBe(16);
  });

  it('detects overflow correctly on mobile breakpoint', () => {
    store.setBreakpoint('mobile');
    // Default size is 10x8 which exceeds mobile width (~8.1 slots)
    expect(component.isOverflowingViewport()).toBe(true);

    // Resize formspec to 7x8 which fits mobile screen (capacity ~8.1x14.1 slots)
    store.updateSize(7, 8);
    expect(component.isOverflowingViewport()).toBe(false);

    // Resize formspec to 9x8 which exceeds mobile width capacity
    store.updateSize(9, 8);
    expect(component.isOverflowingViewport()).toBe(true);
  });
});
