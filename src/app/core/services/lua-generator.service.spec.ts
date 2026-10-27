import { describe, it, expect } from 'vitest';
import { LuaGeneratorService } from './lua-generator.service';
import { FormspecParserService } from './formspec-parser.service';
import { FormspecAST } from '../models/formspec.models';

describe('LuaGeneratorService', () => {
  const parser = new FormspecParserService();
  const service = new LuaGeneratorService(parser);

  it('generates a full Luanti mod with responsive window checks and chatcommands', () => {
    const ast: FormspecAST = {
      version: 7,
      size: { w: 10, h: 8 },
      padding: { x: 0, y: 0 },
      styles: [],
      children: [
        {
          id: 'b1',
          type: 'button',
          x: 2,
          y: 4,
          w: 3,
          h: 1,
          name: 'btn_confirm',
          label: 'Confirm',
        },
      ],
    };

    const lua = service.generateResponsiveMod('custom_vault', ast);

    expect(lua).toContain('MODNAME = "custom_vault"');
    expect(lua).toContain('core.get_player_window_information(player_name)');
    expect(lua).toContain('if max_size.x < 14 or is_touch then');
    expect(lua).toContain('core.register_on_player_receive_fields');
    expect(lua).toContain('fields.btn_confirm');
    expect(lua).toContain('core.register_chatcommand("open_" .. MODNAME');
  });
});
