import { describe, it, expect } from 'vitest';
import { FormspecParserService } from './core/services/formspec-parser.service';
import { LuaGeneratorService } from './core/services/lua-generator.service';
import { TemplateRegistryService } from './core/services/template-registry.service';

describe('AppSanityChecks', () => {
  it('loads starter templates correctly', () => {
    const registry = new TemplateRegistryService();
    const templates = registry.getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(5);

    const chest = registry.getTemplateById('chest-storage');
    expect(chest).toBeDefined();
    expect(chest?.title).toContain('Reinforced Storage Chest');

    // Minetest Game templates
    const mtgInv = registry.getTemplateById('mtg-player-inventory');
    expect(mtgInv).toBeDefined();
    expect(mtgInv?.category).toBe('minetest_game');
    expect(mtgInv?.ast.children.some((c) => c.type === 'list' && c.inventoryList === 'craft')).toBe(
      true,
    );

    const mtgFurnace = registry.getTemplateById('mtg-furnace');
    expect(mtgFurnace).toBeDefined();
    expect(mtgFurnace?.category).toBe('minetest_game');
    expect(
      mtgFurnace?.ast.children.some((c) => c.type === 'list' && c.inventoryList === 'fuel'),
    ).toBe(true);

    const mtgChest = registry.getTemplateById('mtg-chest');
    expect(mtgChest).toBeDefined();
    expect(mtgChest?.category).toBe('minetest_game');
    expect(mtgChest?.ast.size.w).toBe(8);
    expect(mtgChest?.ast.size.h).toBe(9);
  });

  it('generates valid Lua mod code from starter templates', () => {
    const registry = new TemplateRegistryService();
    const parser = new FormspecParserService();
    const luaGen = new LuaGeneratorService(parser);

    const chest = registry.getClonedAST('chest-storage');
    expect(chest).not.toBeNull();
    if (chest) {
      const lua = luaGen.generateResponsiveMod('reinforced_chest', chest);
      expect(lua).toContain('MODNAME = "reinforced_chest"');
      expect(lua).toContain('core.get_player_window_information');
      expect(lua).toContain('formspec_version[7]');
    }

    const furnace = registry.getClonedAST('mtg-furnace');
    expect(furnace).not.toBeNull();
    if (furnace) {
      const lua = luaGen.generateResponsiveMod('default_furnace', furnace);
      expect(lua).toContain('MODNAME = "default_furnace"');
      expect(lua).toContain('list[context;src;2.75,0.5;1,1;0]');
      expect(lua).toContain('list[context;fuel;2.75,2.5;1,1;0]');
      expect(lua).toContain('image[2.75,1.5;1,1;default_furnace_fire_bg.png]');
    }
  });
});
