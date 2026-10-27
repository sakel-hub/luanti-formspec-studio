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
  });
});
