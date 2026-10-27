import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStore } from '../../core/state/editor.store';
import { FormspecElementType } from '../../core/models/formspec.models';
import { LucidePlus } from '@lucide/angular';

interface WidgetDef {
  type: FormspecElementType;
  name: string;
  syntax: string;
  description: string;
}

@Component({
  selector: 'app-palette',
  standalone: true,
  imports: [CommonModule, LucidePlus],
  template: `
    <div class="h-full flex flex-col bg-[#18181c] border-r border-[#282830] select-none overflow-hidden">
      <!-- Section Header -->
      <div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-zinc-300">Widget Palette</h2>
          <p class="text-[10px] text-zinc-500">Tap to add into formspec</p>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-emerald-400 border border-zinc-700">
          v2+
        </span>
      </div>

      <!-- Categories Scrollable Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        <!-- Buttons & Inputs -->
        <div>
          <span class="text-[11px] font-bold text-emerald-400 tracking-wide block mb-2">
            Buttons & Triggers
          </span>
          <div class="grid grid-cols-1 gap-1.5">
            @for (w of buttonWidgets; track w.type) {
              <button
                (click)="store.addNode(w.type)"
                class="p-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-emerald-500/50 text-left transition flex items-center justify-between group active:scale-[0.98]"
              >
                <div>
                  <div class="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 font-mono">
                    {{ w.syntax }}
                  </div>
                  <div class="text-[10px] text-zinc-500 leading-tight">
                    {{ w.description }}
                  </div>
                </div>
                <svg lucidePlus class="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors"></svg>
              </button>
            }
          </div>
        </div>

        <!-- Form Inputs -->
        <div>
          <span class="text-[11px] font-bold text-sky-400 tracking-wide block mb-2">
            Text & Data Inputs
          </span>
          <div class="grid grid-cols-1 gap-1.5">
            @for (w of inputWidgets; track w.type) {
              <button
                (click)="store.addNode(w.type)"
                class="p-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-sky-500/50 text-left transition flex items-center justify-between group active:scale-[0.98]"
              >
                <div>
                  <div class="text-xs font-semibold text-zinc-200 group-hover:text-sky-400 font-mono">
                    {{ w.syntax }}
                  </div>
                  <div class="text-[10px] text-zinc-500 leading-tight">
                    {{ w.description }}
                  </div>
                </div>
                <svg lucidePlus class="w-4 h-4 text-zinc-500 group-hover:text-sky-400 transition-colors"></svg>
              </button>
            }
          </div>
        </div>

        <!-- Storage & Inventories -->
        <div>
          <span class="text-[11px] font-bold text-amber-400 tracking-wide block mb-2">
            Storage & Inventory Grids
          </span>
          <div class="grid grid-cols-1 gap-1.5">
            @for (w of inventoryWidgets; track w.type) {
              <button
                (click)="store.addNode(w.type)"
                class="p-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-amber-500/50 text-left transition flex items-center justify-between group active:scale-[0.98]"
              >
                <div>
                  <div class="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 font-mono">
                    {{ w.syntax }}
                  </div>
                  <div class="text-[10px] text-zinc-500 leading-tight">
                    {{ w.description }}
                  </div>
                </div>
                <svg lucidePlus class="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors"></svg>
              </button>
            }
          </div>
        </div>

        <!-- Visuals & Framing -->
        <div>
          <span class="text-[11px] font-bold text-purple-400 tracking-wide block mb-2">
            Framing & Labels
          </span>
          <div class="grid grid-cols-1 gap-1.5">
            @for (w of visualWidgets; track w.type) {
              <button
                (click)="store.addNode(w.type)"
                class="p-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-purple-500/50 text-left transition flex items-center justify-between group active:scale-[0.98]"
              >
                <div>
                  <div class="text-xs font-semibold text-zinc-200 group-hover:text-purple-400 font-mono">
                    {{ w.syntax }}
                  </div>
                  <div class="text-[10px] text-zinc-500 leading-tight">
                    {{ w.description }}
                  </div>
                </div>
                <svg lucidePlus class="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors"></svg>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PaletteComponent {
  readonly store = inject(EditorStore);

  readonly buttonWidgets: WidgetDef[] = [
    { type: 'button', name: 'Button', syntax: 'button[]', description: 'Standard clickable UI button' },
    { type: 'button_exit', name: 'Button Exit', syntax: 'button_exit[]', description: 'Closes dialog on click' },
    { type: 'checkbox', name: 'Checkbox', syntax: 'checkbox[]', description: 'Boolean toggle with checkmark' },
  ];

  readonly inputWidgets: WidgetDef[] = [
    { type: 'field', name: 'Field', syntax: 'field[]', description: 'Single-line text input' },
    { type: 'textarea', name: 'Textarea', syntax: 'textarea[]', description: 'Multi-line text editor box' },
  ];

  readonly inventoryWidgets: WidgetDef[] = [
    { type: 'list', name: 'Inventory Grid', syntax: 'list[]', description: 'Interactive item slot matrix' },
    { type: 'listring', name: 'List Ring', syntax: 'listring[]', description: 'Shift-click inventory transfer' },
  ];

  readonly visualWidgets: WidgetDef[] = [
    { type: 'label', name: 'Label', syntax: 'label[]', description: 'Single-line text title' },
    { type: 'box', name: 'Box Rectangle', syntax: 'box[]', description: 'Colored rectangular background' },
    { type: 'background9', name: '9-Slice Panel', syntax: 'background9[]', description: '9-slice stretch texture' },
  ];
}
