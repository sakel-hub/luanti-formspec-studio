import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EditorStore } from '../../core/state/editor.store';
import { FormspecNode } from '../../core/models/formspec.models';
import { DEFAULT_SLOT_SIZE_PX, slotToPixel, checkFormspecOverflow } from '../../core/utils/coordinate.utils';
import { resolveTextureUrl } from '../../core/utils/texture.utils';
import { parseHypertext, HypertextGlobalStyles } from '../../core/utils/hypertext-parser.utils';
import {
  LucideZoomIn,
  LucideZoomOut,
  LucideExternalLink,
  LucideMove,
  LucideBox,
  LucidePlay,
  LucideSquare,
  LucideTrash2,
  LucideLock,
  LucideTerminal,
  LucideX,
  LucideUpload,
  LucideMonitor,
  LucideTablet,
  LucideTriangleAlert,
  LucideCheck,
  LucideLightbulb,
} from '@lucide/angular';

interface GuideLines {
  x: number | null;
  y: number | null;
}

interface AltDistanceInfo {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
  label: string;
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideZoomIn,
    LucideZoomOut,
    LucideExternalLink,
    LucideMove,
    LucideBox,
    LucidePlay,
    LucideSquare,
    LucideTrash2,
    LucideLock,
    LucideTerminal,
    LucideX,
    LucideUpload,
    LucideMonitor,
    LucideTablet,
    LucideTriangleAlert,
    LucideCheck,
    LucideLightbulb,
  ],
  template: `
    <div
      class="w-full h-full relative grid-pattern overflow-hidden flex items-center justify-center p-4 select-none"
      [style.cursor]="isSpacePressed() ? (isPanning() ? 'grabbing' : 'grab') : 'default'"
      (mousedown)="onCanvasMouseDown($event)"
      (wheel)="onCanvasWheel($event)"
      (touchstart)="onCanvasTouchStart($event)"
      (touchmove)="onCanvasTouchMove($event)"
      (touchend)="onCanvasTouchEnd()"
      (click)="onBackgroundClick($event)"
      (dragover)="onCanvasDragOver($event)"
      (dragleave)="onCanvasDragLeave($event)"
      (drop)="onCanvasDrop($event)"
    >
      <!-- Canvas Pan Wrapper -->
      <div
        class="transition-transform duration-75 relative flex items-center justify-center"
        [style.transform]="
          'translate(' + store.panOffset().x + 'px, ' + store.panOffset().y + 'px)'
        "
      >
        <!-- Device Viewport Simulator Outer Frame -->
        <div
          [style.width.px]="getSimulatorWidth()"
          [style.height.px]="getSimulatorHeight()"
          [style.borderRadius.px]="getSimulatorBorderRadius()"
          [style.borderWidth.px]="store.activeBreakpoint() === 'mobile' ? 4 : 2"
          [style.borderColor]="'#2c2c34'"
          style="border-style: solid;"
          class="bg-[#121214] flex flex-col overflow-hidden relative shadow-2xl transition-all duration-300 shrink-0"
          (click)="onBackgroundClick($event)"
        >
          <!-- Mobile Phone Notch Simulator -->
          @if (store.activeBreakpoint() === 'mobile') {
            <div
              class="h-6 w-full bg-[#121214] flex justify-between items-center px-6 pt-1 text-[11px] text-zinc-500 shrink-0"
            >
              <span>09:41</span>
              <div class="w-16 h-3 bg-[#24242c] rounded-full mx-auto"></div>
              <span>5G 100%</span>
            </div>
          } @else {
            <!-- Desktop / Tablet Screen Title Bar -->
            <div
              class="h-6 w-full bg-[#161619] border-b border-zinc-800/80 flex items-center justify-between px-3 text-[10px] text-zinc-500 font-mono shrink-0 select-none"
            >
              <span class="flex items-center gap-1.5 text-zinc-400">
                @if (store.activeBreakpoint() === 'desktop') {
                  <svg lucideMonitor class="w-3.5 h-3.5 text-zinc-400"></svg>
                  <span>Desktop Screen</span>
                } @else {
                  <svg lucideTablet class="w-3.5 h-3.5 text-zinc-400"></svg>
                  <span>Tablet Screen</span>
                }
                <span class="text-zinc-600">•</span>
                <span class="text-zinc-500">{{
                  store.activeBreakpoint() === 'desktop'
                    ? '1152×720px (~18×11.25 slots)'
                    : '768×600px (~12×9.4 slots)'
                }}</span>
              </span>
              <span class="text-zinc-500">In-Game Viewport</span>
            </div>
          }

          <!-- Canvas Inner Viewport (Player Screen Simulation) -->
          <div
            class="flex-1 w-full min-h-0 overflow-hidden relative"
            (click)="onBackgroundClick($event)"
          >
            <!-- In-Game Viewport Target Crosshair -->
            <div
              class="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10"
            >
              <div class="w-6 h-0.5 bg-emerald-400"></div>
              <div class="h-6 w-0.5 bg-emerald-400 absolute"></div>
            </div>

            <!-- Position & Overflow Indicator Badge -->
            <div
              class="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/65 border border-zinc-800/80 text-[10px] text-zinc-400 font-mono pointer-events-none z-30 flex items-center gap-2 backdrop-blur-xs"
            >
              <span class="text-zinc-300">
                pos: [{{
                  store.ast().position
                    ? store.ast().position!.x + ',' + store.ast().position!.y
                    : '0.5,0.5'
                }}]
              </span>
              <span>•</span>
              <span class="text-zinc-400">
                anc: [{{
                  store.ast().anchor
                    ? store.ast().anchor!.x + ',' + store.ast().anchor!.y
                    : '0.5,0.5'
                }}]
              </span>
              @if (isOverflowingViewport()) {
                <span class="text-amber-400 font-bold ml-1 flex items-center gap-1">
                  <svg lucideTriangleAlert class="w-3 h-3 shrink-0"></svg>
                  <span>Overflows screen</span>
                </span>
              }
            </div>

            <!-- The Formspec Modal Container -->
            <div
              class="absolute bg-[#252528] border-2 border-[#3d3d46] rounded-md shadow-2xl transition-all duration-150"
              [style.width.px]="getCanvasPixelWidth()"
              [style.height.px]="getCanvasPixelHeight()"
              [style.left]="getFormspecLeft()"
              [style.top]="getFormspecTop()"
              [style.transform]="getFormspecTransform()"
              (click)="onBackgroundClick($event)"
            >
              <!-- Smart Alignment Guidelines (Dynamic Red Dashed Lines) -->
              @if (activeGuides(); as guides) {
                @if (guides.x !== null) {
                  <div
                    class="absolute top-0 bottom-0 border-l-2 border-red-500 border-dashed z-40 pointer-events-none"
                    [style.left.px]="slotToPx(guides.x)"
                  ></div>
                }
                @if (guides.y !== null) {
                  <div
                    class="absolute left-0 right-0 border-t-2 border-red-500 border-dashed z-40 pointer-events-none"
                    [style.top.px]="slotToPx(guides.y)"
                  ></div>
                }
              }

              <!-- Alt Distance Inspector Overlay -->
              @if (altDistance(); as dist) {
                <div
                  class="absolute border border-red-400/80 bg-red-500/10 z-40 pointer-events-none flex items-center justify-center"
                  [style.left.px]="dist.leftPx"
                  [style.top.px]="dist.topPx"
                  [style.width.px]="dist.widthPx"
                  [style.height.px]="dist.heightPx"
                >
                  <span
                    class="bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow"
                  >
                    {{ dist.label }}
                  </span>
                </div>
              }

              <!-- Formspec Window Header Bar -->
              <div
                class="h-6 px-2.5 bg-[#1e1e22] border-b border-[#34343c] flex items-center justify-between text-[11px] text-zinc-300 rounded-t-sm"
                (click)="onBackgroundClick($event)"
              >
                <span class="font-semibold flex items-center gap-1.5">
                  <span>{{ store.projectName() }}</span>
                  <span class="text-[9px] px-1 bg-zinc-800 text-zinc-400 rounded"
                    >v{{ store.ast().version || 7 }}</span
                  >
                  @if (store.isInteractiveMode()) {
                    <span
                      class="text-[9px] px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-mono animate-pulse"
                    >
                      ● LIVE INTERACTIVE
                    </span>
                  }
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-emerald-400/80 font-mono">
                    Snap: {{ store.snapStep() }}
                  </span>
                  <span class="text-[10px] text-zinc-400 font-mono">
                    size[{{ store.ast().size.w }},{{ store.ast().size.h }}]
                  </span>
                </div>
              </div>

              <!-- Children Render Area -->
              <div
                class="relative w-full h-[calc(100%-24px)] overflow-hidden"
                (click)="onBackgroundClick($event)"
              >
                @for (node of store.ast().children; track node.id) {
                  @if (!node.hidden || !store.isInteractiveMode()) {
                    <div
                      (mouseenter)="onNodeMouseEnter(node)"
                      (mouseleave)="onNodeMouseLeave()"
                      (mousedown)="startDrag(node, $event)"
                      (click)="onWidgetClick(node, $event)"
                      class="absolute transition-shadow group/widget"
                      [class.opacity-30]="node.hidden"
                      [class.border-dashed]="node.hidden"
                      [class.cursor-grab]="
                        !store.isInteractiveMode() && draggingNodeId() !== node.id && !node.locked
                      "
                      [class.cursor-grabbing]="draggingNodeId() === node.id"
                      [class.cursor-not-allowed]="node.locked"
                      [class.z-30]="store.selectedNodeId() === node.id"
                      [class.z-10]="store.selectedNodeId() !== node.id"
                      [style.left.px]="slotToPx(node.x)"
                      [style.top.px]="slotToPx(node.y)"
                      [style.width.px]="slotToPx(node.w)"
                      [style.height.px]="slotToPx(node.h)"
                    >
                      <!-- 1. Button Render (Standard, Exit, URL) -->
                      @if (node.type === 'button' || node.type === 'button_exit') {
                        <button
                          (click)="handleSimulatorClick(node, $event)"
                          [class.pointer-events-none]="!store.isInteractiveMode()"
                          class="w-full h-full luanti-button rounded text-xs font-semibold text-zinc-100 flex items-center justify-center px-2 truncate active:scale-98 transition"
                        >
                          {{ node.label || 'Button' }}
                        </button>
                      } @else if (node.type === 'button_url' || node.type === 'button_url_exit') {
                        <button
                          (click)="handleSimulatorClick(node, $event)"
                          [class.pointer-events-none]="!store.isInteractiveMode()"
                          class="w-full h-full luanti-button rounded text-xs font-semibold text-sky-200 flex items-center justify-center gap-1.5 px-2 truncate active:scale-98 transition"
                        >
                          <span class="truncate">{{ node.label || 'Web Link' }}</span>
                          <svg lucideExternalLink class="w-3.5 h-3.5 text-sky-400 shrink-0"></svg>
                        </button>
                      }

                      <!-- 2. Image Buttons -->
                      @else if (node.type === 'image_button' || node.type === 'image_button_exit') {
                        <button
                          (click)="handleSimulatorClick(node, $event)"
                          [class.pointer-events-none]="!store.isInteractiveMode()"
                          class="w-full h-full luanti-button rounded text-xs font-semibold text-zinc-100 flex items-center justify-center gap-1.5 px-2 active:scale-98 transition border border-zinc-600 relative overflow-hidden"
                        >
                          <img
                            [src]="getTextureUrl(node.texture || 'default_chest_front.png')"
                            class="w-4 h-4 object-contain shrink-0"
                          />
                          <span class="truncate">{{ node.label || 'Icon Button' }}</span>
                        </button>
                      } @else if (node.type === 'item_image_button') {
                        <button
                          (click)="handleSimulatorClick(node, $event)"
                          [class.pointer-events-none]="!store.isInteractiveMode()"
                          class="w-full h-full luanti-slot rounded flex flex-col items-center justify-center p-1 active:scale-98 transition border border-emerald-500/40"
                        >
                          <img
                            [src]="getTextureUrl(node.texture || 'item_sword.png')"
                            class="w-5 h-5 object-contain"
                          />
                          @if (node.label) {
                            <span
                              class="text-[9px] text-zinc-300 truncate w-full text-center mt-0.5"
                              >{{ node.label }}</span
                            >
                          }
                        </button>
                      }

                      <!-- 3. Text Input & Password Render -->
                      @else if (node.type === 'field' || node.type === 'pwdfield') {
                        <div class="w-full h-full flex flex-col justify-end">
                          @if (node.label) {
                            <span class="text-[10px] text-zinc-400 mb-0.5 truncate">{{
                              node.label
                            }}</span>
                          }
                          <input
                            [type]="node.type === 'pwdfield' ? 'password' : 'text'"
                            [value]="node.defaultVal || ''"
                            [disabled]="!store.isInteractiveMode() || node.editable === false"
                            [readOnly]="node.editable === false"
                            (input)="handleSimulatorInputChange(node, $event)"
                            [class.opacity-60]="node.editable === false"
                            [class.cursor-not-allowed]="node.editable === false"
                            class="h-7 w-full luanti-field px-2 rounded text-xs text-zinc-200 disabled:opacity-90 disabled:cursor-grab focus:outline-emerald-500 font-mono"
                          />
                        </div>
                      }

                      <!-- 4. Textarea Render -->
                      @else if (node.type === 'textarea') {
                        <div class="w-full h-full flex flex-col">
                          @if (node.label) {
                            <span class="text-[10px] text-zinc-400 mb-0.5">{{ node.label }}</span>
                          }
                          <textarea
                            [disabled]="!store.isInteractiveMode() || node.editable === false"
                            [readOnly]="node.editable === false"
                            (input)="handleSimulatorInputChange(node, $event)"
                            [class.opacity-60]="node.editable === false"
                            [class.cursor-not-allowed]="node.editable === false"
                            class="flex-1 w-full luanti-field p-2 rounded text-xs text-zinc-300 font-mono overflow-auto resize-none disabled:opacity-90 disabled:cursor-grab focus:outline-emerald-500"
                            >{{ node.defaultVal || '' }}</textarea>
                        </div>
                      }

                      <!-- 5. Checkbox Render -->
                      @else if (node.type === 'checkbox') {
                        <div
                          (click)="node.editable !== false && handleSimulatorCheckboxToggle(node)"
                          [class.cursor-pointer]="store.isInteractiveMode() && node.editable !== false"
                          [class.opacity-60]="node.editable === false"
                          [class.cursor-not-allowed]="node.editable === false"
                          class="w-full h-full flex items-center gap-2"
                        >
                          <div
                            class="w-4 h-4 rounded border flex items-center justify-center transition"
                            [ngClass]="
                              node.checked
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'bg-zinc-800 border-zinc-600'
                            "
                          >
                            @if (node.checked) {
                              <svg lucideCheck class="w-3 h-3 text-white"></svg>
                            }
                          </div>
                          <span class="text-xs text-zinc-200 select-none truncate">{{
                            node.label || 'Checkbox'
                          }}</span>
                        </div>
                      }

                      <!-- 6. Dropdown Render -->
                      @else if (node.type === 'dropdown') {
                        <div class="w-full h-full flex items-center">
                          <select
                            [disabled]="!store.isInteractiveMode()"
                            (change)="handleSimulatorDropdownChange(node, $event)"
                            class="w-full h-7 luanti-field px-2 rounded text-xs text-zinc-200 cursor-pointer disabled:cursor-grab border border-zinc-700 bg-zinc-900"
                          >
                            @for (item of node.dropdownItems || []; track item; let i = $index) {
                              <option [value]="item" [selected]="i === (node.selectedIdx || 0)">
                                {{ item }}
                              </option>
                            }
                          </select>
                        </div>
                      }

                      <!-- 7. Labels & Hypertext -->
                      @else if (node.type === 'label') {
                        <div
                          class="w-full h-full flex items-center text-xs text-zinc-200 select-none truncate"
                        >
                          {{ node.label || 'Information Label' }}
                        </div>
                      } @else if (node.type === 'vertlabel') {
                        <div
                          class="w-full h-full flex flex-col justify-center items-center text-xs font-mono font-bold select-none tracking-widest uppercase"
                          [style.color]="node.color || '#d4d4d8'"
                        >
                          {{ node.label || 'VERTICAL' }}
                        </div>
                      } @else if (node.type === 'hypertext') {
                        @let parsed = getHypertextStyles(node.label);
                        <div
                          class="w-full h-full p-2 rounded border border-zinc-700/80 text-xs overflow-auto custom-scrollbar select-text leading-relaxed"
                          [style.backgroundColor]="parsed.backgroundColor || 'rgba(24, 24, 28, 0.75)'"
                          [style.color]="parsed.color || '#e4e4e7'"
                          [style.textAlign]="parsed.halign || 'left'"
                          [style.fontSize]="parsed.fontSize || '12px'"
                          [style.fontFamily]="parsed.fontFamily || 'inherit'"
                          [innerHTML]="getSafeHypertext(node.label)"
                        ></div>
                      }

                      <!-- 8. Tooltips & Hypertips -->
                      @else if (node.type === 'tooltip' || node.type === 'hypertip') {
                        @let tipStyles = getHypertextStyles(node.tooltipText || node.label);
                        <div
                          class="w-full h-full rounded-md shadow-2xl p-2 flex flex-col justify-start relative overflow-hidden transition-all border select-text"
                          [style.backgroundColor]="node.tooltipBgColor || tipStyles.backgroundColor || 'rgba(16, 16, 22, 0.95)'"
                          [style.color]="node.tooltipFontColor || tipStyles.color || '#e4e4e7'"
                          [style.borderColor]="'rgba(52, 211, 153, 0.5)'"
                          [style.textAlign]="tipStyles.halign || 'left'"
                        >
                          <!-- Tooltip Identification Header Pill -->
                          <div class="flex items-center justify-between text-[9px] font-mono pb-1 mb-1 border-b border-white/10 shrink-0 select-none">
                            <span class="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider">
                              <svg lucideLightbulb class="w-3 h-3 text-amber-400"></svg>
                              <span>{{ node.type }}</span>
                              @if (node.name) {
                                <span class="text-zinc-400 font-normal">({{ node.name }})</span>
                              }
                            </span>
                            <span class="text-[8px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                              {{ node.type === 'hypertip' ? 'v11 Rich' : 'Hover Tooltip' }}
                            </span>
                          </div>

                          <!-- Rendered Rich Hypertext Body -->
                          <div
                            class="flex-1 overflow-auto custom-scrollbar text-[11px] leading-snug"
                            [style.fontSize]="tipStyles.fontSize || '11px'"
                            [innerHTML]="getSafeHypertext(node.tooltipText || node.label || 'Hint message')"
                          ></div>
                        </div>
                      }

                      <!-- 9. Images (image & item_image) -->
                      @else if (node.type === 'image') {
                        <div
                          class="w-full h-full rounded overflow-hidden flex items-center justify-center relative"
                        >
                          <img
                            [src]="getTextureUrl(node.texture || 'gui_formspec_bg.png')"
                            class="w-full h-full object-contain pointer-events-none"
                          />
                        </div>
                      } @else if (node.type === 'item_image') {
                        <div
                          class="w-full h-full luanti-slot rounded flex items-center justify-center p-1 relative"
                        >
                          <img
                            [src]="getTextureUrl(node.texture || 'item_sword.png')"
                            class="w-3/4 h-3/4 object-contain pointer-events-none"
                          />
                        </div>
                      }

                      <!-- 10. Backgrounds (background9 & background) -->
                      @else if (node.type === 'background9' || node.type === 'background') {
                        <div
                          class="w-full h-full rounded border border-[#2e2e38] bg-[#1e1e24] shadow-inner relative overflow-hidden pointer-events-none"
                        >
                          <img
                            [src]="getTextureUrl(node.texture || 'gui_formspec_bg.png')"
                            class="absolute inset-0 w-full h-full object-cover opacity-75"
                          />
                        </div>
                      }

                      <!-- 11. Inventory Slots (list) - Exact Luanti 1:1 Square Slots Layout -->
                      @else if (node.type === 'list') {
                        <div class="w-full h-full relative group/list select-none">
                          <!-- Editor Location/List Badge (Floating above, 0px space inside slots) -->
                          @if (!store.isInteractiveMode()) {
                            <div
                              class="absolute left-0 z-20 flex items-center pointer-events-none select-none opacity-85 group-hover/widget:opacity-100 transition-opacity"
                              [class.-top-5]="node.y >= 0.4"
                              [class.top-0.5]="node.y < 0.4"
                              [class.left-0.5]="node.y < 0.4"
                            >
                              <span
                                class="px-1.5 py-0.5 rounded bg-black/90 border border-zinc-700/80 text-[8px] font-mono text-zinc-300 flex items-center gap-1 shadow-lg whitespace-nowrap"
                              >
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                {{ node.inventoryLocation || 'current_player' }}:
                                {{ node.inventoryList || 'main' }}
                                <span class="text-zinc-500"
                                  >({{ getCols(node.w) }}×{{ getRows(node.h) }})</span
                                >
                              </span>
                            </div>
                          }

                          <!-- True Square Slots Grid -->
                          <div
                            class="w-full h-full grid gap-1 p-0.5"
                            [style.grid-template-columns]="
                              'repeat(' + getCols(node.w) + ', minmax(0, 1fr))'
                            "
                            [style.grid-template-rows]="
                              'repeat(' + getRows(node.h) + ', minmax(0, 1fr))'
                            "
                          >
                            @for (slot of getSlotArray(node.w, node.h); track slot) {
                              <div
                                class="luanti-slot w-full h-full aspect-square flex items-center justify-center relative rounded-[2px] transition hover:brightness-125"
                                [style.background-image]="
                                  'url(' + getSlotBackgroundTexture() + ')'
                                "
                                style="background-size: 100% 100%; image-rendering: pixelated;"
                              >
                                <span
                                  class="text-[9px] font-mono text-zinc-400/50 font-bold pointer-events-none drop-shadow"
                                >
                                  {{ (node.startingIndex || 0) + slot + 1 }}
                                </span>
                              </div>
                            }
                          </div>
                        </div>
                      }

                      <!-- 12. Non-visual Metadata (listring, listcolors, listimages, allow_close, set_focus) -->
                      @else if (
                        node.type === 'listring' ||
                        node.type === 'listcolors' ||
                        node.type === 'listimages' ||
                        node.type === 'allow_close' ||
                        node.type === 'set_focus'
                      ) {
                        @if (store.selectedNodeId() === node.id && !store.isInteractiveMode()) {
                          <div
                            class="w-full h-full border border-dashed border-emerald-500/80 bg-emerald-500/10 rounded flex items-center justify-center text-[9px] font-mono text-emerald-300 p-0.5 pointer-events-none"
                          >
                            {{ node.type }}
                          </div>
                        }
                      }

                      <!-- 13. 3D Model Render -->
                      @else if (node.type === 'model') {
                        <div
                          class="w-full h-full bg-cyan-950/30 border border-cyan-500/50 rounded-lg flex flex-col items-center justify-center p-2 text-cyan-300 relative overflow-hidden"
                        >
                          <svg lucideBox class="w-8 h-8 text-cyan-400 animate-spin-slow mb-1"></svg>
                          <span class="text-[10px] font-bold font-mono"
                            >3D: {{ node.mesh || 'character.b3d' }}</span
                          >
                          <span class="text-[9px] text-cyan-400/80 font-mono"
                            >Rot: {{ node.meshRotation || '0,180' }}</span
                          >
                        </div>
                      }

                      <!-- 14. Animated Image -->
                      @else if (node.type === 'animated_image') {
                        <div
                          class="w-full h-full bg-zinc-900 border border-amber-500/60 rounded flex flex-col items-center justify-center p-1 text-amber-300 relative overflow-hidden"
                        >
                          <img
                            [src]="getTextureUrl(node.texture || 'spritesheet_sample.png')"
                            class="w-full h-full object-cover animate-pulse"
                          />
                          <div
                            class="absolute bottom-1 right-1 px-1 bg-black/70 rounded text-[8px] font-mono text-amber-300"
                          >
                            {{ node.frameCount || 8 }}f • {{ node.frameDuration || 100 }}ms
                          </div>
                        </div>
                      }

                      <!-- 15. Scrollbar -->
                      @else if (node.type === 'scrollbar') {
                        <div
                          class="w-full h-full bg-zinc-900 border border-zinc-700 rounded flex items-center justify-center"
                          [class.flex-col]="node.orientation !== 'horizontal'"
                        >
                          <div class="w-2 h-2 bg-zinc-600 rounded-full"></div>
                          <div class="flex-1 bg-zinc-800 w-1 rounded mx-0.5"></div>
                          <div class="w-2 h-2 bg-zinc-600 rounded-full"></div>
                        </div>
                      }

                      <!-- 16. Table & Textlist -->
                      @else if (node.type === 'table' || node.type === 'textlist') {
                        <div
                          class="w-full h-full bg-zinc-900 border border-zinc-700 rounded flex flex-col overflow-hidden text-[10px] font-mono"
                        >
                          <div
                            class="bg-zinc-800 px-2 py-0.5 text-zinc-400 border-b border-zinc-700 flex justify-between"
                          >
                            <span>{{ node.type }} ({{ node.name }})</span>
                            <span>#{{ (node.dropdownItems || []).length }} rows</span>
                          </div>
                          <div class="flex-1 overflow-auto divide-y divide-zinc-800/80">
                            @for (row of node.dropdownItems || []; track row; let i = $index) {
                              <div
                                (click)="handleSimulatorTableRow(node, row)"
                                [class.bg-emerald-950/60]="i === (node.selectedIdx || 0)"
                                [class.text-emerald-300]="i === (node.selectedIdx || 0)"
                                [class.cursor-pointer]="store.isInteractiveMode()"
                                class="px-2 py-1 text-zinc-300 hover:bg-zinc-800/50 truncate"
                              >
                                {{ row }}
                              </div>
                            }
                          </div>
                        </div>
                      }

                      <!-- 17. Box Decorator -->
                      @else if (node.type === 'box') {
                        <div
                          class="w-full h-full rounded border border-zinc-600/60"
                          [style.backgroundColor]="node.color || '#333338'"
                        ></div>
                      }

                      <!-- 18. Default Fallback -->
                      @else {
                        <div
                          class="w-full h-full bg-zinc-800/80 border border-zinc-600 rounded p-1 flex items-center justify-center text-zinc-300 text-[10px] font-mono truncate"
                        >
                          {{ node.type }}: {{ node.name || node.label || 'elem' }}
                        </div>
                      }

                      <!-- ================= FIGMA 8-POINT BOUNDING BOX RESIZE HANDLES ================= -->
                      @if (
                        store.selectedNodeId() === node.id &&
                        !node.locked &&
                        !store.isInteractiveMode()
                      ) {
                        <div
                          class="absolute inset-0 pointer-events-none border-2 border-emerald-400 bg-emerald-400/5 rounded shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                        >
                          <!-- Dimension Pill HUD -->
                          <div
                            class="absolute -top-5 left-0 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-t flex items-center gap-1 shadow pointer-events-none font-mono"
                          >
                            <svg lucideMove class="w-2.5 h-2.5"></svg>
                            <span>{{ node.type }}</span>
                            <span class="text-emerald-200"
                              >({{ node.x }}, {{ node.y }}) • {{ node.w }}×{{ node.h }}</span
                            >
                          </div>

                          <!-- 8 Point Handles: Corners & Edges -->
                          <!-- NW -->
                          <div
                            (mousedown)="startResize(node, 'nw', $event)"
                            class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs shadow cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
                            title="Resize North-West (Shift=Lock Ratio)"
                          ></div>
                          <!-- N -->
                          <div
                            (mousedown)="startResize(node, 'n', $event)"
                            class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs shadow cursor-ns-resize pointer-events-auto hover:scale-125 transition-transform"
                            title="Resize Height North"
                          ></div>
                          <!-- NE -->
                          <div
                            (mousedown)="startResize(node, 'ne', $event)"
                            class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs shadow cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
                            title="Resize North-East"
                          ></div>
                          <!-- E -->
                          <div
                            (mousedown)="startResize(node, 'e', $event)"
                            class="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs shadow cursor-ew-resize pointer-events-auto hover:scale-125 transition-transform"
                            title="Resize Width East"
                          ></div>
                          <!-- SE -->
                          <div
                            (mousedown)="startResize(node, 'se', $event)"
                            class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs shadow cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
                            title="Resize South-East"
                          ></div>
                          <!-- S -->
                          <div
                            (mousedown)="startResize(node, 's', $event)"
                            class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs shadow cursor-ns-resize pointer-events-auto hover:scale-125 transition-transform"
                            title="Resize Height South"
                          ></div>
                          <!-- SW -->
                          <div
                            (mousedown)="startResize(node, 'sw', $event)"
                            class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs shadow cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
                            title="Resize South-West"
                          ></div>
                          <!-- W -->
                          <div
                            (mousedown)="startResize(node, 'w', $event)"
                            class="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-500 rounded-xs shadow cursor-ew-resize pointer-events-auto hover:scale-125 transition-transform"
                            title="Resize Width West"
                          ></div>
                        </div>
                      }

                      <!-- Locked Badge -->
                      @if (node.locked && !store.isInteractiveMode()) {
                        <div
                          class="absolute top-1 right-1 p-0.5 rounded bg-zinc-900/90 text-amber-400 shadow"
                        >
                          <svg lucideLock class="w-2.5 h-2.5"></svg>
                        </div>
                      }
                    </div>
                  }
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
      </div>

      <!-- ================= FLOATING HUD: RESIZING / DRAGGING PILL ================= -->
      @if (resizingHandle() && resizeDimensions(); as dims) {
        <div
          class="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-emerald-400"
        >
          <span
            >Resizing: W={{ dims.w.toFixed(2) }} × H={{ dims.h.toFixed(2) }} (Snap
            {{ store.snapStep() }})</span
          >
        </div>
      } @else if (draggingNodeId() && dragCoords(); as coords) {
        <div
          class="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold shadow-2xl flex items-center gap-2 border border-emerald-400"
        >
          <svg lucideMove class="w-3.5 h-3.5"></svg>
          <span
            >Moving: X={{ coords.x.toFixed(2) }}, Y={{ coords.y.toFixed(2) }} (Snap
            {{ store.snapStep() }})</span
          >
        </div>
      }

      <!-- ================= FLOATING TOOL HUD ================= -->
      <div class="absolute bottom-4 right-4 flex flex-col gap-1.5 z-30">
        <!-- Interactive Prototype Play Toggle -->
        <button
          (click)="store.toggleInteractiveMode()"
          [class.bg-emerald-600]="store.isInteractiveMode()"
          [class.bg-zinc-800]="!store.isInteractiveMode()"
          class="w-10 h-10 rounded-full text-white shadow-lg flex items-center justify-center active:scale-95 transition border border-emerald-500/40"
          [title]="
            store.isInteractiveMode()
              ? 'Exit Interactive Prototype'
              : 'Play / Test Interactive Prototype'
          "
        >
          @if (store.isInteractiveMode()) {
            <svg lucideSquare class="w-4 h-4"></svg>
          } @else {
            <svg lucidePlay class="w-4 h-4 ml-0.5"></svg>
          }
        </button>

        <!-- Zoom Controls -->
        <button
          (click)="zoomIn()"
          class="w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-300 shadow flex items-center justify-center hover:bg-zinc-700 transition"
          title="Zoom In (Cmd +)"
        >
          <svg lucideZoomIn class="w-4 h-4"></svg>
        </button>

        <button
          (click)="zoomOut()"
          class="w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-300 shadow flex items-center justify-center hover:bg-zinc-700 transition"
          title="Zoom Out (Cmd -)"
        >
          <svg lucideZoomOut class="w-4 h-4"></svg>
        </button>

        <!-- Toggle Event Console (HUD) -->
        <button
          (click)="isConsoleOpen.set(!isConsoleOpen())"
          [class.bg-emerald-600]="isConsoleOpen()"
          [class.text-white]="isConsoleOpen()"
          [class.bg-zinc-800/90]="!isConsoleOpen()"
          [class.text-zinc-300]="!isConsoleOpen()"
          class="w-8 h-8 rounded-full border border-zinc-700 shadow flex items-center justify-center hover:bg-zinc-700 transition"
          title="Toggle Luanti Event Console (Cmd+~ / Ctrl+~)"
        >
          <svg lucideTerminal class="w-4 h-4"></svg>
        </button>

        <button
          (click)="resetView()"
          class="w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-300 shadow flex items-center justify-center text-[10px] font-mono hover:bg-zinc-700 transition"
          title="Reset Zoom & Pan (Shift+0)"
        >
          1x
        </button>
      </div>

      <!-- ================= LUANTI EVENT SIMULATOR DRAWER & DOCKED PILL ================= -->
      @if (isConsoleOpen()) {
        <div
          class="absolute bottom-4 left-4 w-96 max-h-72 bg-[#161619] border border-zinc-700/80 rounded-xl shadow-2xl z-40 flex flex-col overflow-hidden text-xs"
        >
          <!-- Console Header -->
          <div
            class="px-3 py-2 bg-[#1a1a1f] border-b border-zinc-800 flex items-center justify-between shrink-0"
          >
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-bold text-zinc-200 font-mono text-[11px]"
                >Luanti Event Console</span
              >
              <span
                class="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[9px]"
              >
                {{ store.simulatorLogs().length }}
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button
                (click)="store.clearSimulatorLogs()"
                class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition"
                title="Clear Logs"
              >
                <svg lucideTrash2 class="w-3.5 h-3.5"></svg>
              </button>
              <button
                (click)="isConsoleOpen.set(false)"
                class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                title="Close / Minimize Console (Cmd+~ / Ctrl+~)"
              >
                <svg lucideX class="w-3.5 h-3.5"></svg>
              </button>
            </div>
          </div>

          <!-- Console Body (Event Feed) -->
          <div
            class="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-56 custom-scrollbar font-mono text-[11px]"
          >
            @if (store.simulatorLogs().length === 0) {
              <div class="p-3 text-center text-zinc-500 italic">
                Interact with buttons, fields, or checkboxes to inspect live fields payloads
                received by Luanti.
              </div>
            }

            @for (log of store.simulatorLogs(); track log.id) {
              <div class="p-2 rounded bg-zinc-900 border border-zinc-800 space-y-1">
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-zinc-500">{{ log.timestamp }}</span>
                  <span
                    class="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase text-[9px]"
                  >
                    {{ log.eventType }}
                  </span>
                </div>
                <div class="text-zinc-300 font-semibold">
                  Target: <span class="text-emerald-400">{{ log.widgetName }}</span> ({{
                    log.widgetType
                  }})
                </div>
                <div
                  class="p-1.5 bg-black/50 rounded text-emerald-300/90 text-[10px] whitespace-pre overflow-x-auto"
                >
                  {{ formatLuaFields(log.fields) }}
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Minimized Floating Console Pill (Bottom-Left) -->
        <button
          (click)="isConsoleOpen.set(true)"
          class="absolute bottom-4 left-4 z-40 px-3 py-1.5 rounded-lg bg-[#161619] hover:bg-[#1e1e24] border border-zinc-700/80 shadow-xl flex items-center gap-2 text-zinc-300 hover:text-white transition active:scale-95 group font-mono text-[11px]"
          title="Open Luanti Event Console (Cmd+~ / Ctrl+~)"
        >
          <svg
            lucideTerminal
            class="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform"
          ></svg>
          <span class="font-bold">Event Console</span>
          @if (store.simulatorLogs().length > 0) {
            <span
              class="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-bold"
            >
              {{ store.simulatorLogs().length }}
            </span>
          }
        </button>
      }

      <!-- Canvas File Drag & Drop Overlay -->
      @if (isDraggingFileOver()) {
        <div
          class="absolute inset-4 z-50 bg-[#121214]/90 backdrop-blur-sm border-2 border-dashed border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-3 animate-fade-in pointer-events-none"
        >
          <div
            class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-950/40"
          >
            <svg lucideUpload class="w-8 h-8"></svg>
          </div>
          <div class="text-base font-bold text-zinc-100">Drop Formspec File to Load</div>
          <div class="text-xs text-zinc-400 font-mono">
            Supports .formspec.json, .json, and .txt files
          </div>
        </div>
      }
    </div>
  `,
})
export class CanvasComponent {
  readonly store = inject(EditorStore);
  private readonly sanitizer = inject(DomSanitizer, { optional: true });

  getSafeHypertext(markup?: string): SafeHtml {
    const parsed = parseHypertext(markup || '');
    return this.sanitizer
      ? this.sanitizer.bypassSecurityTrustHtml(parsed.html)
      : (parsed.html as unknown as SafeHtml);
  }

  getHypertextStyles(markup?: string): HypertextGlobalStyles {
    return parseHypertext(markup || '').globalStyles;
  }

  readonly draggingNodeId = signal<string | null>(null);
  readonly dragCoords = signal<{ x: number; y: number } | null>(null);

  readonly resizingNodeId = signal<string | null>(null);
  readonly resizingHandle = signal<string | null>(null);
  readonly resizeDimensions = signal<{ w: number; h: number } | null>(null);

  readonly activeGuides = signal<GuideLines | null>(null);
  readonly isPanning = signal<boolean>(false);
  readonly isSpacePressed = signal<boolean>(false);
  readonly isAltPressed = signal<boolean>(false);
  readonly hoveredNode = signal<FormspecNode | null>(null);
  readonly altDistance = signal<AltDistanceInfo | null>(null);

  readonly isConsoleOpen = signal<boolean>(true);
  readonly isDraggingFileOver = signal<boolean>(false);

  onCanvasDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types?.includes('Files')) {
      event.preventDefault();
      this.isDraggingFileOver.set(true);
    }
  }

  onCanvasDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFileOver.set(false);
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFileOver.set(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;
      if (file.name.endsWith('.json')) {
        this.store.importProjectJson(content);
      } else {
        const projName = file.name.replace(/\.[^/.]+$/, '');
        this.store.importRawFormspec(content, projName);
      }
    };

    reader.readAsText(file);
  }

  formatLuaFields(fields: Record<string, string>): string {
    const lines = Object.entries(fields).map(([k, v]) => `  ["${k}"] = "${v}"`);
    return `fields = {\n${lines.join(',\n')}\n}`;
  }

  slotToPx(slotVal: number): number {
    return slotToPixel(slotVal, DEFAULT_SLOT_SIZE_PX * this.store.zoom());
  }

  getCanvasPixelWidth(): number {
    return this.slotToPx(this.store.ast().size.w);
  }

  getCanvasPixelHeight(): number {
    return this.slotToPx(this.store.ast().size.h) + 24;
  }

  getFormspecLeft(): string {
    const pos = this.store.ast().position;
    const x = pos !== undefined ? pos.x : 0.5;
    return `${x * 100}%`;
  }

  getFormspecTop(): string {
    const pos = this.store.ast().position;
    const y = pos !== undefined ? pos.y : 0.5;
    return `${y * 100}%`;
  }

  getFormspecTransform(): string {
    const anc = this.store.ast().anchor;
    const x = anc !== undefined ? anc.x : 0.5;
    const y = anc !== undefined ? anc.y : 0.5;
    return `translate(-${x * 100}%, -${y * 100}%)`;
  }

  isOverflowingViewport(): boolean {
    const bp = this.store.activeBreakpoint();
    const ast = this.store.ast();
    const res = checkFormspecOverflow(bp, {
      w: ast.size.w,
      h: ast.size.h,
      position: ast.position,
      anchor: ast.anchor,
    });
    return res.isOverflowing;
  }

  getSimulatorWidth(): number {
    const bp = this.store.activeBreakpoint();
    if (bp === 'mobile') return 390;
    if (bp === 'tablet') return 768;
    return 1152;
  }

  getSimulatorHeight(): number {
    const bp = this.store.activeBreakpoint();
    if (bp === 'mobile') return 720;
    if (bp === 'tablet') return 600;
    return 720;
  }

  getSimulatorBorderRadius(): number {
    const bp = this.store.activeBreakpoint();
    if (bp === 'mobile') return 36;
    if (bp === 'tablet') return 20;
    return 16;
  }

  onCanvasWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const zoomDelta = event.deltaY < 0 ? 0.05 : -0.05;
      const nextZoom = Math.min(Math.max(this.store.zoom() + zoomDelta, 0.25), 3.0);
      this.store.setZoom(parseFloat(nextZoom.toFixed(2)));
    }
  }

  private touchStartPos: { x: number; y: number } | null = null;
  private touchInitialPan: { x: number; y: number } | null = null;

  onCanvasTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1 && !this.store.isInteractiveMode()) {
      const touch = event.touches[0];
      this.touchStartPos = { x: touch.clientX, y: touch.clientY };
      this.touchInitialPan = { ...this.store.panOffset() };
    }
  }

  onCanvasTouchMove(event: TouchEvent): void {
    if (this.touchStartPos && this.touchInitialPan && event.touches.length === 1) {
      const touch = event.touches[0];
      const dx = touch.clientX - this.touchStartPos.x;
      const dy = touch.clientY - this.touchStartPos.y;
      this.store.setPanOffset(this.touchInitialPan.x + dx, this.touchInitialPan.y + dy);
    }
  }

  onCanvasTouchEnd(): void {
    this.touchStartPos = null;
    this.touchInitialPan = null;
  }

  getCols(w: number): number {
    return Math.max(1, Math.round(w || 1));
  }

  getRows(h: number): number {
    return Math.max(1, Math.round(h || 1));
  }

  getSlotArray(w: number, h: number): number[] {
    const total = Math.min(Math.max(this.getCols(w) * this.getRows(h), 1), 128);
    return Array.from({ length: total }, (_, i) => i);
  }

  getTextureUrl(name?: string): string {
    return resolveTextureUrl(name);
  }

  getSlotBackgroundTexture(): string {
    const listImgNode = this.store.ast().children.find((c) => c.type === 'listimages');
    if (listImgNode?.texture) {
      return this.getTextureUrl(listImgNode.texture);
    }
    return this.getTextureUrl('gui_hb_bg.png');
  }

  getEntries(obj: Record<string, string>): Array<{ key: string; val: string }> {
    return Object.entries(obj).map(([key, val]) => ({ key, val }));
  }

  // Canvas Mouse Down: Pan vs Selection
  onCanvasMouseDown(event: MouseEvent): void {
    if (this.isSpacePressed() || event.button === 1) {
      event.preventDefault();
      this.startPan(event);
    }
  }

  startPan(event: MouseEvent): void {
    this.isPanning.set(true);
    const startX = event.clientX;
    const startY = event.clientY;
    const initialPan = { ...this.store.panOffset() };

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.store.setPanOffset(initialPan.x + dx, initialPan.y + dy);
    };

    const onMouseUp = () => {
      this.isPanning.set(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Node Dragging with Snapping and Alignment Guidelines
  startDrag(node: FormspecNode, event: MouseEvent): void {
    if (event.button !== 0 || this.store.isInteractiveMode() || node.locked) return;
    event.stopPropagation();
    this.store.selectNode(node.id);

    this.draggingNodeId.set(node.id);
    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const initialSlotX = node.x;
    const initialSlotY = node.y;
    const slotPx = DEFAULT_SLOT_SIZE_PX * this.store.zoom();

    let hasMoved = false;

    const onMouseMove = (e: MouseEvent) => {
      const deltaPxX = e.clientX - startMouseX;
      const deltaPxY = e.clientY - startMouseY;

      if (Math.abs(deltaPxX) > 2 || Math.abs(deltaPxY) > 2) {
        hasMoved = true;
      }

      const deltaSlotX = deltaPxX / slotPx;
      const deltaSlotY = deltaPxY / slotPx;

      let newSlotX = Math.max(0, initialSlotX + deltaSlotX);
      let newSlotY = Math.max(0, initialSlotY + deltaSlotY);

      // Check Smart Guidelines Alignment with Siblings
      const guides = this.calculateSmartGuides(node.id, newSlotX, newSlotY, node.w, node.h);
      if (guides.x !== null) newSlotX = guides.x;
      if (guides.y !== null) newSlotY = guides.y;
      this.activeGuides.set(guides);

      this.dragCoords.set({ x: newSlotX, y: newSlotY });
      this.store.moveNode(node.id, newSlotX, newSlotY, false);
    };

    const onMouseUp = () => {
      this.draggingNodeId.set(null);
      this.dragCoords.set(null);
      this.activeGuides.set(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (hasMoved) {
        const finalNode = this.store.selectedNode();
        if (finalNode) {
          this.store.moveNode(node.id, finalNode.x, finalNode.y, true);
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // 8-Point Bounding Box Interactive Resizing
  startResize(node: FormspecNode, handle: string, event: MouseEvent): void {
    if (event.button !== 0 || node.locked) return;
    event.stopPropagation();
    event.preventDefault();

    this.resizingNodeId.set(node.id);
    this.resizingHandle.set(handle);
    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startX = node.x;
    const startY = node.y;
    const startW = node.w;
    const startH = node.h;
    const aspectRatio = startW / Math.max(startH, 0.01);
    const slotPx = DEFAULT_SLOT_SIZE_PX * this.store.zoom();

    let hasMoved = false;

    const onMouseMove = (e: MouseEvent) => {
      const deltaSlotX = (e.clientX - startMouseX) / slotPx;
      const deltaSlotY = (e.clientY - startMouseY) / slotPx;

      if (Math.abs(deltaSlotX) > 0.02 || Math.abs(deltaSlotY) > 0.02) {
        hasMoved = true;
      }

      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;

      // Handle horizontal sizing
      if (handle.includes('e')) {
        newW = Math.max(0.2, startW + deltaSlotX);
      } else if (handle.includes('w')) {
        const candidateW = startW - deltaSlotX;
        if (candidateW >= 0.2) {
          newW = candidateW;
          newX = startX + deltaSlotX;
        }
      }

      // Handle vertical sizing
      if (handle.includes('s')) {
        newH = Math.max(0.2, startH + deltaSlotY);
      } else if (handle.includes('n')) {
        const candidateH = startH - deltaSlotY;
        if (candidateH >= 0.2) {
          newH = candidateH;
          newY = startY + deltaSlotY;
        }
      }

      // Shift Key: Aspect Ratio Lock
      if (e.shiftKey) {
        if (handle === 'e' || handle === 'w') {
          newH = newW / aspectRatio;
        } else {
          newW = newH * aspectRatio;
        }
      }

      this.resizeDimensions.set({ w: newW, h: newH });
      this.store.resizeNode(node.id, newW, newH, newX, newY, false);
    };

    const onMouseUp = () => {
      this.resizingNodeId.set(null);
      this.resizingHandle.set(null);
      this.resizeDimensions.set(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (hasMoved) {
        const finalNode = this.store.selectedNode();
        if (finalNode) {
          this.store.resizeNode(node.id, finalNode.w, finalNode.h, finalNode.x, finalNode.y, true);
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Smart Guides Calculation
  calculateSmartGuides(id: string, x: number, y: number, w: number, h: number): GuideLines {
    const threshold = 0.15;
    let guideX: number | null = null;
    let guideY: number | null = null;

    const canvasW = this.store.ast().size.w;
    const canvasH = this.store.ast().size.h;

    // Center alignment with container
    if (Math.abs(x + w / 2 - canvasW / 2) < threshold) guideX = canvasW / 2 - w / 2;
    if (Math.abs(y + h / 2 - canvasH / 2) < threshold) guideY = canvasH / 2 - h / 2;

    // Align with sibling elements
    for (const sibling of this.store.ast().children) {
      if (sibling.id === id || sibling.hidden) continue;

      // Align lefts
      if (Math.abs(x - sibling.x) < threshold) guideX = sibling.x;
      // Align rights
      if (Math.abs(x + w - (sibling.x + sibling.w)) < threshold) guideX = sibling.x + sibling.w - w;
      // Align tops
      if (Math.abs(y - sibling.y) < threshold) guideY = sibling.y;
      // Align bottoms
      if (Math.abs(y + h - (sibling.y + sibling.h)) < threshold) guideY = sibling.y + sibling.h - h;
    }

    return { x: guideX, y: guideY };
  }

  // Hover & Alt-Key Distance Measurement
  onNodeMouseEnter(node: FormspecNode): void {
    this.hoveredNode.set(node);
    this.updateAltDistance();
  }

  onNodeMouseLeave(): void {
    this.hoveredNode.set(null);
    this.altDistance.set(null);
  }

  updateAltDistance(): void {
    if (!this.isAltPressed()) {
      this.altDistance.set(null);
      return;
    }

    const selected = this.store.selectedNode();
    const hovered = this.hoveredNode();
    if (!selected || !hovered || selected.id === hovered.id) {
      this.altDistance.set(null);
      return;
    }

    const selLeft = this.slotToPx(selected.x);
    const selTop = this.slotToPx(selected.y);
    const hovLeft = this.slotToPx(hovered.x);
    const hovTop = this.slotToPx(hovered.y);

    const minX = Math.min(selLeft, hovLeft);
    const minY = Math.min(selTop, hovTop);
    const width =
      Math.max(selLeft + this.slotToPx(selected.w), hovLeft + this.slotToPx(hovered.w)) - minX;
    const height =
      Math.max(selTop + this.slotToPx(selected.h), hovTop + this.slotToPx(hovered.h)) - minY;

    const dx = Math.abs(selected.x - hovered.x);
    const dy = Math.abs(selected.y - hovered.y);

    this.altDistance.set({
      leftPx: minX,
      topPx: minY,
      widthPx: width,
      heightPx: height,
      label: `ΔX: ${dx.toFixed(2)}s | ΔY: ${dy.toFixed(2)}s`,
    });
  }

  onWidgetClick(node: FormspecNode, event: MouseEvent): void {
    if (this.store.isInteractiveMode()) return;
    event.stopPropagation();
    this.store.selectNode(node.id);
  }

  onBackgroundClick(event: MouseEvent): void {
    if (this.store.isInteractiveMode()) return;
    this.store.selectNode(null);
  }

  // Keyboard Shortcuts (<kbd>Arrow keys</kbd>, <kbd>Cmd+D</kbd>, <kbd>Del</kbd>, <kbd>Cmd+Z/Y</kbd>, <kbd>Esc</kbd>)
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    const targetTag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
      return;
    }

    if (event.key === 'Alt') {
      this.isAltPressed.set(true);
      this.updateAltDistance();
    }

    if (event.code === 'Space') {
      this.isSpacePressed.set(true);
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

    // Deselect on Escape
    if (event.key === 'Escape') {
      if (this.store.selectedNodeId()) {
        this.store.selectNode(null);
      }
      return;
    }

    // Arrow Key Nudging
    if (this.store.selectedNodeId()) {
      const step = event.shiftKey ? 4 : 1;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.store.nudgeSelected(-step, 0);
        return;
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.store.nudgeSelected(step, 0);
        return;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.store.nudgeSelected(0, -step);
        return;
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.store.nudgeSelected(0, step);
        return;
      }
    }

    // Duplicate Shortcut (Cmd+D / Ctrl+D)
    if (cmdOrCtrl && (event.key === 'd' || event.key === 'D')) {
      const selected = this.store.selectedNodeId();
      if (selected) {
        event.preventDefault();
        this.store.duplicateNode(selected);
      }
      return;
    }

    // Delete Shortcut (Del / Backspace)
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.store.selectedNodeId()) {
      event.preventDefault();
      this.store.deleteNode(this.store.selectedNodeId()!);
      return;
    }

    // Undo (Cmd+Z / Ctrl+Z)
    if (cmdOrCtrl && !event.shiftKey && (event.key === 'z' || event.key === 'Z')) {
      event.preventDefault();
      this.store.undo();
      return;
    }

    // Redo (Cmd+Shift+Z / Ctrl+Y)
    if (
      (cmdOrCtrl && event.shiftKey && (event.key === 'z' || event.key === 'Z')) ||
      (cmdOrCtrl && (event.key === 'y' || event.key === 'Y'))
    ) {
      event.preventDefault();
      this.store.redo();
      return;
    }

    // Toggle Console Shortcut (Cmd+` / Ctrl+`)
    if (cmdOrCtrl && (event.key === '`' || event.key === '~' || event.code === 'Backquote')) {
      event.preventDefault();
      this.isConsoleOpen.set(!this.isConsoleOpen());
      return;
    }

    // Zoom Shortcuts
    if (event.shiftKey && event.key === '!') {
      // Shift+1
      this.resetView();
    } else if (event.shiftKey && event.key === ')') {
      // Shift+0
      this.resetView();
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Alt') {
      this.isAltPressed.set(false);
      this.altDistance.set(null);
    }
    if (event.code === 'Space') {
      this.isSpacePressed.set(false);
    }
  }

  // Interactive Simulator Event Handlers
  handleSimulatorClick(node: FormspecNode, event: MouseEvent): void {
    if (!this.store.isInteractiveMode()) return;
    event.stopPropagation();
    const fieldKey = node.name || node.id;
    const fieldVal = node.label || 'pressed';
    this.store.recordSimulatorEvent({
      eventType: 'click',
      widgetName: fieldKey,
      widgetType: node.type,
      fields: { [fieldKey]: fieldVal },
    });
  }

  handleSimulatorInputChange(node: FormspecNode, event: Event): void {
    if (!this.store.isInteractiveMode()) return;
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const fieldKey = node.name || node.id;
    this.store.recordSimulatorEvent({
      eventType: 'change',
      widgetName: fieldKey,
      widgetType: node.type,
      fields: { [fieldKey]: input.value },
    });
  }

  handleSimulatorCheckboxToggle(node: FormspecNode): void {
    if (!this.store.isInteractiveMode()) return;
    const nextVal = !node.checked;
    this.store.updateNode(node.id, { checked: nextVal });
    const fieldKey = node.name || node.id;
    this.store.recordSimulatorEvent({
      eventType: 'change',
      widgetName: fieldKey,
      widgetType: node.type,
      fields: { [fieldKey]: String(nextVal) },
    });
  }

  handleSimulatorDropdownChange(node: FormspecNode, event: Event): void {
    if (!this.store.isInteractiveMode()) return;
    const select = event.target as HTMLSelectElement;
    const fieldKey = node.name || node.id;
    this.store.recordSimulatorEvent({
      eventType: 'change',
      widgetName: fieldKey,
      widgetType: node.type,
      fields: { [fieldKey]: select.value },
    });
  }

  handleSimulatorTableRow(node: FormspecNode, row: string): void {
    if (!this.store.isInteractiveMode()) return;
    const fieldKey = node.name || node.id;
    this.store.recordSimulatorEvent({
      eventType: 'click',
      widgetName: fieldKey,
      widgetType: node.type,
      fields: { [fieldKey]: `CHG:1:${row}` },
    });
  }

  zoomIn(): void {
    this.store.setZoom(this.store.zoom() + 0.15);
  }

  zoomOut(): void {
    this.store.setZoom(this.store.zoom() - 0.15);
  }

  resetView(): void {
    this.store.setZoom(1.0);
    this.store.resetPan();
  }
}
