import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorStore } from '../../core/state/editor.store';
import { LucideTrash2, LucideSliders, LucideLayers } from '@lucide/angular';

@Component({
  selector: 'app-inspector',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideTrash2, LucideSliders, LucideLayers],
  template: `
    <div class="h-full flex flex-col bg-[#18181c] border-l border-[#282830] select-none overflow-hidden">
      <!-- Section Header -->
      <div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2">
          <svg lucideSliders class="w-4 h-4 text-emerald-400"></svg>
          <h2 class="text-xs font-bold uppercase tracking-wider text-zinc-300">Properties</h2>
        </div>

        @if (store.selectedNode(); as node) {
          <button
            (click)="store.deleteNode(node.id)"
            class="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 text-[11px] flex items-center gap-1 transition"
            title="Delete Widget"
          >
            <svg lucideTrash2 class="w-3.5 h-3.5"></svg>
            <span>Delete</span>
          </button>
        }
      </div>

      <!-- Properties Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5 text-xs">
        @if (store.selectedNode(); as node) {
          <!-- Widget Info Header -->
          <div class="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <span class="text-[10px] text-zinc-500 font-mono block">ELEMENT IDENTIFIER</span>
            <div class="text-xs font-bold text-zinc-200 mt-0.5 font-mono">
              {{ node.name || node.id }}
            </div>
            <span class="inline-block mt-1 px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded text-[10px] font-mono">
              {{ node.type }}[]
            </span>
          </div>

          <!-- Position & Dimensions in Real Coordinates -->
          <div>
            <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Transform (Slot Units)
            </span>
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[10px] text-zinc-400 font-mono mb-1">X Position</label>
                <input
                  type="number"
                  step="0.1"
                  [ngModel]="node.x"
                  (ngModelChange)="updateProp('x', $event)"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] text-zinc-400 font-mono mb-1">Y Position</label>
                <input
                  type="number"
                  step="0.1"
                  [ngModel]="node.y"
                  (ngModelChange)="updateProp('y', $event)"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] text-zinc-400 font-mono mb-1">Width (W)</label>
                <input
                  type="number"
                  step="0.1"
                  [ngModel]="node.w"
                  (ngModelChange)="updateProp('w', $event)"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] text-zinc-400 font-mono mb-1">Height (H)</label>
                <input
                  type="number"
                  step="0.1"
                  [ngModel]="node.h"
                  (ngModelChange)="updateProp('h', $event)"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Specific Attributes -->
          <div class="space-y-3">
            <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Widget Attributes
            </span>

            @if (node.name !== undefined) {
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">Field Name (Lua fields key)</label>
                <input
                  type="text"
                  [ngModel]="node.name"
                  (ngModelChange)="updateProp('name', $event)"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            }

            @if (node.label !== undefined) {
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">Label Caption</label>
                <input
                  type="text"
                  [ngModel]="node.label"
                  (ngModelChange)="updateProp('label', $event)"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            }

            @if (node.defaultVal !== undefined) {
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">Default Input Value</label>
                <input
                  type="text"
                  [ngModel]="node.defaultVal"
                  (ngModelChange)="updateProp('defaultVal', $event)"
                  class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            }

            @if (node.type === 'list') {
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">Inventory Location</label>
                  <input
                    type="text"
                    [ngModel]="node.inventoryLocation"
                    (ngModelChange)="updateProp('inventoryLocation', $event)"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">List Name</label>
                  <input
                    type="text"
                    [ngModel]="node.inventoryList"
                    (ngModelChange)="updateProp('inventoryList', $event)"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            }

            @if (node.type === 'box') {
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">Color (Hex)</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    [ngModel]="node.color || '#000000'"
                    (ngModelChange)="updateProp('color', $event)"
                    class="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    [ngModel]="node.color"
                    (ngModelChange)="updateProp('color', $event)"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200 font-mono"
                  />
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Empty State: Canvas Global Settings -->
          <div class="space-y-4">
            <div class="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
              <svg lucideLayers class="w-6 h-6 text-zinc-500 mx-auto mb-1"></svg>
              <div class="text-xs font-semibold text-zinc-300">Canvas Master Settings</div>
              <p class="text-[10px] text-zinc-500">Select any element on the canvas to inspect its parameters</p>
            </div>

            <div>
              <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Dialog Size (size[W,H])
              </span>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] text-zinc-400 font-mono mb-1">Canvas Width</label>
                  <input
                    type="number"
                    step="0.5"
                    [ngModel]="store.ast().size.w"
                    (ngModelChange)="updateCanvasSize($event, store.ast().size.h)"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 font-mono mb-1">Canvas Height</label>
                  <input
                    type="number"
                    step="0.5"
                    [ngModel]="store.ast().size.h"
                    (ngModelChange)="updateCanvasSize(store.ast().size.w, $event)"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono"
                  />
                </div>
              </div>
            </div>

            <div class="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
              <span class="text-emerald-400 font-semibold text-xs block mb-1">Formspec Version 7</span>
              <p class="text-[11px] text-zinc-400 leading-relaxed">
                Using version 7 real coordinates with zero arbitrary margin distortion. Compatible with all modern Luanti clients.
              </p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class InspectorComponent {
  readonly store = inject(EditorStore);

  updateProp(key: string, value: any): void {
    const node = this.store.selectedNode();
    if (!node) return;
    this.store.updateNode(node.id, { [key]: value });
  }

  updateCanvasSize(w: number, h: number): void {
    this.store.updateSize(w, h);
  }
}
