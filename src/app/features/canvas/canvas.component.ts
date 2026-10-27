import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStore } from '../../core/state/editor.store';
import { FormspecNode } from '../../core/models/formspec.models';
import { DEFAULT_SLOT_SIZE_PX, slotToPixel } from '../../core/utils/coordinate.utils';
import { LucideZoomIn, LucideZoomOut, LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, LucideZoomIn, LucideZoomOut, LucidePlus],
  template: `
    <div
      class="w-full h-full relative grid-pattern overflow-auto flex items-center justify-center p-4 select-none"
      (click)="store.selectNode(null)"
    >
      <!-- Device Viewport Simulator Outer Frame -->
      <div
        [ngClass]="{
          'w-[390px] h-[720px] rounded-[36px] border-4 border-[#2c2c34] shadow-2xl': store.activeBreakpoint() === 'mobile',
          'w-[768px] h-[600px] rounded-[20px] border-2 border-[#2c2c34] shadow-xl': store.activeBreakpoint() === 'tablet',
          'w-full h-full rounded-none border-0': store.activeBreakpoint() === 'desktop'
        }"
        class="bg-[#121214] flex flex-col overflow-hidden relative transition-all duration-300"
        (click)="$event.stopPropagation()"
      >
        <!-- Mobile Phone Notch Simulator -->
        @if (store.activeBreakpoint() === 'mobile') {
          <div class="h-6 w-full bg-[#121214] flex justify-between items-center px-6 pt-1 text-[11px] text-zinc-500 shrink-0">
            <span>09:41</span>
            <div class="w-16 h-3 bg-[#24242c] rounded-full mx-auto"></div>
            <span>5G 100%</span>
          </div>
        }

        <!-- Canvas Inner Viewport (Scrollable/Centerable) -->
        <div class="flex-1 w-full h-full overflow-auto flex items-center justify-center p-4 relative">
          <!-- The Formspec Modal Container -->
          <div
            class="relative bg-[#252528] border-2 border-[#3d3d46] rounded-md shadow-2xl transition-all duration-150"
            [style.width.px]="getCanvasPixelWidth()"
            [style.height.px]="getCanvasPixelHeight()"
            (click)="$event.stopPropagation()"
          >
            <!-- Formspec Window Header Bar -->
            <div class="h-6 px-2.5 bg-[#1e1e22] border-b border-[#34343c] flex items-center justify-between text-[11px] text-zinc-300 rounded-t-sm">
              <span class="font-semibold">{{ store.projectName() }}</span>
              <span class="text-[10px] text-zinc-500 font-mono">
                size[{{ store.ast().size.w }},{{ store.ast().size.h }}]
              </span>
            </div>

            <!-- Children Render Area -->
            <div class="relative w-full h-[calc(100%-24px)] overflow-hidden">
              @for (node of store.ast().children; track node.id) {
                <div
                  (click)="onSelect(node, $event)"
                  class="absolute cursor-pointer transition-shadow"
                  [style.left.px]="slotToPx(node.x)"
                  [style.top.px]="slotToPx(node.y)"
                  [style.width.px]="slotToPx(node.w)"
                  [style.height.px]="slotToPx(node.h)"
                >
                  <!-- 1. Button Render -->
                  @if (node.type === 'button' || node.type === 'button_exit') {
                    <button class="w-full h-full luanti-button rounded text-xs font-semibold text-zinc-100 flex items-center justify-center px-2 truncate">
                      {{ node.label || 'Button' }}
                    </button>
                  }

                  <!-- 2. Text Input Render -->
                  @else if (node.type === 'field' || node.type === 'pwdfield') {
                    <div class="w-full h-full flex flex-col justify-end">
                      @if (node.label) {
                        <span class="text-[10px] text-zinc-400 mb-0.5 truncate">{{ node.label }}</span>
                      }
                      <div class="h-7 luanti-field px-2 rounded flex items-center text-xs text-zinc-200">
                        <span class="truncate">{{ node.defaultVal || '' }}</span>
                      </div>
                    </div>
                  }

                  <!-- 3. Textarea Render -->
                  @else if (node.type === 'textarea') {
                    <div class="w-full h-full flex flex-col">
                      @if (node.label) {
                        <span class="text-[10px] text-zinc-400 mb-0.5">{{ node.label }}</span>
                      }
                      <div class="flex-1 luanti-field p-2 rounded text-xs text-zinc-300 font-mono overflow-auto">
                        {{ node.defaultVal || '' }}
                      </div>
                    </div>
                  }

                  <!-- 4. Checkbox Render -->
                  @else if (node.type === 'checkbox') {
                    <div class="w-full h-full flex items-center gap-2">
                      <div class="w-4 h-4 luanti-field rounded flex items-center justify-center text-emerald-400 text-xs font-bold">
                        {{ node.checked ? '✓' : '' }}
                      </div>
                      <span class="text-xs text-zinc-200">{{ node.label }}</span>
                    </div>
                  }

                  <!-- 5. Inventory Slot Grid Render -->
                  @else if (node.type === 'list') {
                    <div class="w-full h-full flex flex-col">
                      <div class="text-[10px] text-zinc-400 mb-1 font-mono">
                        {{ node.inventoryList }} ({{ node.w }}×{{ node.h }})
                      </div>
                      <div
                        class="grid gap-1 flex-1"
                        [style.gridTemplateColumns]="'repeat(' + node.w + ', minmax(0, 1fr))'"
                      >
                        @for (slot of getSlotArray(node.w, node.h); track $index) {
                          <div class="luanti-slot rounded flex items-center justify-center text-[10px] text-zinc-400">
                            <!-- Sample dummy item preview for first slots -->
                            @if ($index === 0 && node.inventoryList === 'main') {
                              <span>⛏️</span>
                            } @else if ($index === 1 && node.inventoryList === 'main') {
                              <span class="text-amber-300 font-bold">64</span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- 6. Box Rectangle -->
                  @else if (node.type === 'box') {
                    <div
                      class="w-full h-full rounded-sm"
                      [style.backgroundColor]="node.color || '#38bdf8'"
                    ></div>
                  }

                  <!-- 7. Background 9-Slice -->
                  @else if (node.type === 'background9') {
                    <div class="w-full h-full bg-[#2e2e34]/70 border border-[#444450] rounded pointer-events-none"></div>
                  }

                  <!-- 8. Label / Hypertext -->
                  @else if (node.type === 'label' || node.type === 'hypertext') {
                    <div class="w-full h-full text-xs text-zinc-200 leading-snug whitespace-pre-wrap">
                      {{ node.label }}
                    </div>
                  }

                  <!-- 9. Tabheader -->
                  @else if (node.type === 'tabheader') {
                    <div class="w-full h-full flex border-b border-zinc-700 bg-zinc-900/80">
                      @for (item of node.dropdownItems || ['Tab 1', 'Tab 2']; track $index) {
                        <div
                          class="px-3 py-1 text-xs border-r border-zinc-700"
                          [class.bg-emerald-900]="(node.selectedIdx || 0) === $index"
                          [class.text-emerald-300]="(node.selectedIdx || 0) === $index"
                          [class.text-zinc-400]="(node.selectedIdx || 0) !== $index"
                        >
                          {{ item }}
                        </div>
                      }
                    </div>
                  }

                  <!-- Default fallback -->
                  @else {
                    <div class="w-full h-full border border-dashed border-zinc-500 rounded p-1 text-[10px] text-zinc-400">
                      {{ node.type }}
                    </div>
                  }

                  <!-- Visual Selection Highlight Border -->
                  @if (store.selectedNodeId() === node.id) {
                    <div class="absolute inset-0 pointer-events-none border-2 border-emerald-400 bg-emerald-400/10 rounded">
                      <div class="absolute -top-3.5 -right-0.5 bg-emerald-500 text-black text-[9px] font-bold px-1 rounded shadow">
                        {{ node.type }}
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Mobile Phone Bottom Bar Simulator -->
        @if (store.activeBreakpoint() === 'mobile') {
          <div class="h-4 w-full bg-[#121214] flex justify-center items-center pb-1 shrink-0">
            <div class="w-24 h-1 bg-zinc-600 rounded-full"></div>
          </div>
        }
      </div>

      <!-- Floating Zoom & Quick-Add Tool HUD -->
      <div class="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
        <button
          (click)="store.setActiveTab('palette')"
          class="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition"
          title="Add New Widget"
        >
          <svg lucidePlus class="w-5 h-5"></svg>
        </button>

        <button
          (click)="zoomIn()"
          class="w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-300 shadow flex items-center justify-center hover:bg-zinc-700 transition"
          title="Zoom In"
        >
          <svg lucideZoomIn class="w-4 h-4"></svg>
        </button>

        <button
          (click)="zoomOut()"
          class="w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-300 shadow flex items-center justify-center hover:bg-zinc-700 transition"
          title="Zoom Out"
        >
          <svg lucideZoomOut class="w-4 h-4"></svg>
        </button>

        <button
          (click)="resetZoom()"
          class="w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-300 shadow flex items-center justify-center text-[10px] font-mono hover:bg-zinc-700 transition"
          title="Reset Zoom (1x)"
        >
          1x
        </button>
      </div>
    </div>
  `,
})
export class CanvasComponent {
  readonly store = inject(EditorStore);

  slotToPx(slotVal: number): number {
    return slotToPixel(slotVal, DEFAULT_SLOT_SIZE_PX * this.store.zoom());
  }

  getCanvasPixelWidth(): number {
    return this.slotToPx(this.store.ast().size.w);
  }

  getCanvasPixelHeight(): number {
    return this.slotToPx(this.store.ast().size.h) + 24; // +24px for top window bar
  }

  getSlotArray(w: number, h: number): number[] {
    const total = Math.min(Math.max(w * h, 1), 64);
    return Array.from({ length: total }, (_, i) => i);
  }

  onSelect(node: FormspecNode, event: MouseEvent): void {
    event.stopPropagation();
    this.store.selectNode(node.id);
  }

  zoomIn(): void {
    this.store.setZoom(this.store.zoom() + 0.15);
  }

  zoomOut(): void {
    this.store.setZoom(this.store.zoom() - 0.15);
  }

  resetZoom(): void {
    this.store.setZoom(1.0);
  }
}
