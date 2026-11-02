import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { PaletteComponent } from './palette.component';
import { EditorStore } from '../../core/state/editor.store';
import { FormspecParserService } from '../../core/services/formspec-parser.service';
import { LuaGeneratorService } from '../../core/services/lua-generator.service';
import { TemplateRegistryService } from '../../core/services/template-registry.service';
import { StorageService } from '../../core/services/storage.service';

describe('PaletteComponent Widget Search & Filters', () => {
  let component: PaletteComponent;
  let store: EditorStore;

  beforeEach(() => {
    const parser = new FormspecParserService();
    const luaGen = new LuaGeneratorService(parser);
    const templateRegistry = new TemplateRegistryService();
    const storage = new StorageService();
    store = new EditorStore(parser, luaGen, templateRegistry, storage);

    const injector = Injector.create({
      providers: [{ provide: EditorStore, useValue: store }],
    });

    runInInjectionContext(injector, () => {
      component = new PaletteComponent();
    });
  });

  it('initializes with all widgets displayed and search query empty', () => {
    expect(component.searchQuery()).toBe('');
    expect(component.selectedCategory()).toBe('all');
    expect(component.filteredWidgets().length).toBe(component.widgets.length);
    expect(component.filteredWidgets().length).toBeGreaterThan(25);
  });

  it('reactively filters widgets when searchQuery signal changes', () => {
    // Search for button widgets
    component.searchQuery.set('button');
    const buttonResults = component.filteredWidgets();
    expect(buttonResults.length).toBeGreaterThan(0);
    expect(buttonResults.length).toBeLessThan(component.widgets.length);
    expect(buttonResults.every((w) => w.name.toLowerCase().includes('button') || w.syntax.includes('button'))).toBe(true);

    // Search for Luanti 5.18 listimages
    component.searchQuery.set('listimages');
    const listimagesResults = component.filteredWidgets();
    expect(listimagesResults.length).toBe(1);
    expect(listimagesResults[0].type).toBe('listimages');
    expect(listimagesResults[0].syntax).toBe('listimages[<slot_bgimg_normal>;<slot_bgimg_hover>]');

    // Search for 3D model
    component.searchQuery.set('model');
    const modelResults = component.filteredWidgets();
    expect(modelResults.length).toBe(1);
    expect(modelResults[0].type).toBe('model');
  });

  it('returns empty list when no widgets match the search query', () => {
    component.searchQuery.set('nonexistent_widget_xyz_123');
    expect(component.filteredWidgets().length).toBe(0);
  });

  it('resets filtered widgets when search is cleared', () => {
    component.searchQuery.set('hypertext');
    expect(component.filteredWidgets().length).toBe(1);

    component.searchQuery.set('');
    expect(component.filteredWidgets().length).toBe(component.widgets.length);
  });

  it('combines category filtering with search query', () => {
    component.selectedCategory.set('inventories');
    const allInv = component.filteredWidgets();
    expect(allInv.every((w) => w.category === 'inventories')).toBe(true);

    component.searchQuery.set('listring');
    const listringOnly = component.filteredWidgets();
    expect(listringOnly.length).toBe(1);
    expect(listringOnly[0].type).toBe('listring');

    // Search for something outside of inventories while category is 'inventories'
    component.searchQuery.set('button');
    expect(component.filteredWidgets().length).toBe(0);
  });
});
