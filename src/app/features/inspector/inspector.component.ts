import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EditorStore } from '../../core/state/editor.store';
import { StorageService } from '../../core/services/storage.service';
import { FormspecNode } from '../../core/models/formspec.models';
import { resolveTextureUrl } from '../../core/utils/texture.utils';
import { checkFormspecOverflow, OverflowResult } from '../../core/utils/coordinate.utils';
import { parseHypertext, HypertextGlobalStyles } from '../../core/utils/hypertext-parser.utils';
import {
  validateFormspecNode,
  isPropertyMandatory,
  PROPERTY_DOCS,
  PropertyDoc,
  ValidationError,
} from '../../core/utils/validation.utils';
import {
  LucideTrash2,
  LucideSliders,
  LucideLayers,
  LucideArrowUp,
  LucideArrowDown,
  LucideArrowLeft,
  LucideArrowRight,
  LucideArrowUpLeft,
  LucideArrowUpRight,
  LucideArrowDownLeft,
  LucideArrowDownRight,
  LucideCircle,
  LucideCopy,
  LucideChevronRight,
  LucideEye,
  LucideEyeOff,
  LucideLock,
  LucideLockOpen,
  LucideAlignStartHorizontal,
  LucideAlignCenterHorizontal,
  LucideAlignEndHorizontal,
  LucideAlignStartVertical,
  LucideAlignCenterVertical,
  LucideAlignEndVertical,
  LucideAlignHorizontalDistributeCenter,
  LucideAlignVerticalDistributeCenter,
  LucideChevronsUp,
  LucideChevronsDown,
  LucideInfo,
  LucideAlertCircle,
  LucideCheckCircle2,
  LucideSparkles,
  LucideSmartphone,
  LucideTablet,
  LucideMonitor,
  LucideTriangleAlert,
  LucideMoveHorizontal,
} from '@lucide/angular';

@Component({
  selector: 'app-inspector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideTrash2,
    LucideSliders,
    LucideLayers,
    LucideArrowUp,
    LucideArrowDown,
    LucideArrowLeft,
    LucideArrowRight,
    LucideArrowUpLeft,
    LucideArrowUpRight,
    LucideArrowDownLeft,
    LucideArrowDownRight,
    LucideCircle,
    LucideCopy,
    LucideChevronRight,
    LucideEye,
    LucideEyeOff,
    LucideLock,
    LucideLockOpen,
    LucideAlignStartHorizontal,
    LucideAlignCenterHorizontal,
    LucideAlignEndHorizontal,
    LucideAlignStartVertical,
    LucideAlignCenterVertical,
    LucideAlignEndVertical,
    LucideAlignHorizontalDistributeCenter,
    LucideAlignVerticalDistributeCenter,
    LucideChevronsUp,
    LucideChevronsDown,
    LucideInfo,
    LucideAlertCircle,
    LucideCheckCircle2,
    LucideSparkles,
    LucideSmartphone,
    LucideTablet,
    LucideMonitor,
    LucideTriangleAlert,
    LucideMoveHorizontal,
  ],
  template: `
    <div class="inspector-container h-full flex flex-col bg-[#18181c] select-none overflow-hidden text-zinc-100 relative">
      <!-- ==================== TOP PANE: LAYOUT TREE ==================== -->
      <div
        class="flex flex-col min-h-[110px] overflow-hidden shrink-0"
        [style.height.%]="treeRatio()"
      >
        <!-- Top Pane Header: Layout Tree Title & Stats -->
        <div class="px-3 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#161619]">
          <div class="flex items-center gap-2">
            <svg lucideLayers class="w-4 h-4 text-emerald-400"></svg>
            <span class="font-bold text-xs text-zinc-200 uppercase tracking-wide">Layout Tree</span>
            <span class="px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-full text-[10px] font-mono">
              {{ store.ast().children.length }}
            </span>
          </div>

          @if (store.selectedNode(); as node) {
            <button
              (click)="deselectNode()"
              class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono transition shrink-0"
              title="Deselect active widget (Esc)"
            >
              Deselect
            </button>
          }
        </div>

        <!-- Layout Tree Scrollable Body -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2 min-h-0">
          <!-- Root Container Node Card -->
          <div
            (click)="deselectNode()"
            class="p-2 rounded-lg border transition cursor-pointer flex items-center justify-between group"
            [class.bg-emerald-950/40]="store.selectedNodeId() === null"
            [class.border-emerald-600]="store.selectedNodeId() === null"
            [class.bg-zinc-900/60]="store.selectedNodeId() !== null"
            [class.border-zinc-800]="store.selectedNodeId() !== null"
          >
            <div class="flex items-center gap-2">
              <svg lucideLayers class="w-3.5 h-3.5 text-emerald-400"></svg>
              <div>
                <div class="font-bold text-[11px] text-zinc-200">Root Formspec Container</div>
                <div class="text-[9px] text-zinc-500 font-mono">
                  size[{{ store.ast().size.w }},{{ store.ast().size.h }}] • v{{ store.ast().version || 7 }}
                </div>
              </div>
            </div>

            <span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              Canvas Root
            </span>
          </div>

          <!-- Hierarchy Tree Section Header -->
          <div class="flex items-center justify-between px-1 text-[10px] text-zinc-500 font-mono">
            <span>RENDER ORDER / Z-INDEX</span>
            <span>{{ store.ast().children.length }} items</span>
          </div>

          <!-- Widget Nodes List in Render Order -->
          <div class="space-y-1">
            @for (node of store.ast().children; track node.id; let idx = $index) {
              <div
                (click)="selectFromTree(node)"
                class="p-1.5 rounded-lg border transition cursor-pointer flex flex-col gap-1 group/item"
                [class.bg-emerald-950/40]="store.selectedNodeId() === node.id"
                [class.border-emerald-500]="store.selectedNodeId() === node.id"
                [class.shadow-md]="store.selectedNodeId() === node.id"
                [class.bg-zinc-900/70]="store.selectedNodeId() !== node.id"
                [class.border-zinc-800]="store.selectedNodeId() !== node.id"
                [class.hover:border-zinc-700]="store.selectedNodeId() !== node.id"
              >
                <!-- Node Header: Rank + Type + Name + Quick Actions -->
                <div class="flex items-center justify-between gap-1">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <!-- Render Layer Rank (Z-index) -->
                    <span class="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 shrink-0">
                      #{{ idx + 1 }}
                    </span>

                    <!-- Type Tag -->
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-800 text-emerald-400 shrink-0">
                      {{ node.type }}
                    </span>

                    <!-- Name or Label -->
                    <span class="text-[11px] font-semibold text-zinc-200 truncate group-hover/item:text-white">
                      {{ node.name || node.label || node.id }}
                    </span>
                  </div>

                  <!-- Action Controls: Visibility, Lock, Layer Reorder, Delete -->
                  <div class="flex items-center gap-0.5 opacity-80 group-hover/item:opacity-100 shrink-0">
                    <!-- Hide / Show Toggle -->
                    <button
                      (click)="toggleHide($event, node.id)"
                      class="p-1 rounded hover:bg-zinc-800 transition"
                      [class.text-zinc-600]="node.hidden"
                      [class.text-zinc-400]="!node.hidden"
                      [title]="node.hidden ? 'Show Widget on Canvas' : 'Hide Widget from Canvas'"
                    >
                      @if (node.hidden) {
                        <svg lucideEyeOff class="w-3 h-3 text-zinc-500"></svg>
                      } @else {
                        <svg lucideEye class="w-3 h-3 text-zinc-400"></svg>
                      }
                    </button>

                    <!-- Lock / Unlock Toggle -->
                    <button
                      (click)="toggleLock($event, node.id)"
                      class="p-1 rounded hover:bg-zinc-800 transition"
                      [title]="node.locked ? 'Unlock Widget' : 'Lock Widget against moving/selecting'"
                    >
                      @if (node.locked) {
                        <svg lucideLock class="w-3 h-3 text-amber-400"></svg>
                      } @else {
                        <svg lucideLockOpen class="w-3 h-3 text-zinc-500"></svg>
                      }
                    </button>

                    <!-- Send to Back (bottom layer) -->
                    <button
                      (click)="sendToBack($event, node.id)"
                      [disabled]="idx === 0"
                      class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      title="Send to Back (render at bottom)"
                    >
                      <svg lucideChevronsDown class="w-3 h-3"></svg>
                    </button>

                    <!-- Bring to Front (top layer) -->
                    <button
                      (click)="bringToFront($event, node.id)"
                      [disabled]="idx === store.ast().children.length - 1"
                      class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      title="Bring to Front (render on top)"
                    >
                      <svg lucideChevronsUp class="w-3 h-3"></svg>
                    </button>

                    <!-- Move Up in Render Order (Behind) -->
                    <button
                      (click)="reorder($event, node.id, 'up')"
                      [disabled]="idx === 0"
                      class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      title="Move Up in Render Order (Behind)"
                    >
                      <svg lucideArrowUp class="w-3 h-3"></svg>
                    </button>

                    <!-- Move Down in Render Order (In Front) -->
                    <button
                      (click)="reorder($event, node.id, 'down')"
                      [disabled]="idx === store.ast().children.length - 1"
                      class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                      title="Move Down in Render Order (In Front)"
                    >
                      <svg lucideArrowDown class="w-3 h-3"></svg>
                    </button>

                    <!-- Delete Element -->
                    <button
                      (click)="deleteFromTree($event, node.id)"
                      class="p-1 rounded hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition"
                      title="Delete Element"
                    >
                      <svg lucideTrash2 class="w-3 h-3"></svg>
                    </button>
                  </div>
                </div>

                <!-- Relationship & Parameters Subtitle -->
                <div class="flex items-center justify-between text-[9px] text-zinc-500 font-mono pl-5">
                  <span class="text-zinc-400">
                    pos: {{ node.x }},{{ node.y }} • size: {{ node.w }}×{{ node.h }}
                  </span>

                  @if (node.type === 'button_url' || node.type === 'button_url_exit') {
                    <span class="text-sky-400 truncate max-w-[110px]">URL: {{ node.url }}</span>
                  } @else if (node.type === 'model') {
                    <span class="text-cyan-400 truncate max-w-[110px]">3D: {{ node.mesh }}</span>
                  } @else if (node.type === 'list') {
                    <span class="text-amber-400 truncate max-w-[110px]">inv: {{ node.inventoryList }}</span>
                  } @else if (node.type === 'hypertip' || node.type === 'tooltip') {
                    <span class="text-emerald-400 truncate max-w-[110px]">tip: {{ node.tooltipText }}</span>
                  } @else if (node.type === 'scrollbar') {
                    <span class="text-purple-400">orient: {{ node.orientation }}</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ==================== DRAGGABLE RESIZER BAR ==================== -->
      <div
        (mousedown)="startResize($event)"
        (touchstart)="startTouchResize($event)"
        (dblclick)="resetSplitter()"
        class="h-2.5 bg-[#141417] hover:bg-emerald-500/20 active:bg-emerald-500/35 border-y border-zinc-800/90 cursor-row-resize flex items-center justify-center transition-colors group select-none shrink-0 z-30"
        title="Drag up/down to resize panels. Double-click to reset."
      >
        <div class="w-10 h-1 bg-zinc-600 rounded-full group-hover:bg-emerald-400 group-active:bg-emerald-300 transition-colors"></div>
      </div>

      <!-- ==================== BOTTOM PANE: PROPERTIES ==================== -->
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Properties Pane Header + Alignment/Distribute Toolbar -->
        <div class="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#161619]">
          <div class="flex items-center gap-1.5 min-w-0">
            <svg lucideSliders class="w-3.5 h-3.5 text-emerald-400 shrink-0"></svg>
            <span class="font-bold text-xs text-zinc-200 uppercase tracking-wide truncate">Properties</span>
          </div>

          <!-- Alignment & Distribution Toolbar -->
          <div class="flex items-center gap-0.5 shrink-0">
            <!-- Horizontal Alignment -->
            <button
              (click)="store.alignSelected('left')"
              [disabled]="!store.selectedNodeId()"
              class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
              title="Align Left"
            >
              <svg lucideAlignStartVertical class="w-3.5 h-3.5"></svg>
            </button>
            <button
              (click)="store.alignSelected('center')"
              [disabled]="!store.selectedNodeId()"
              class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
              title="Align Center Horizontally"
            >
              <svg lucideAlignCenterVertical class="w-3.5 h-3.5"></svg>
            </button>
            <button
              (click)="store.alignSelected('right')"
              [disabled]="!store.selectedNodeId()"
              class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
              title="Align Right"
            >
              <svg lucideAlignEndVertical class="w-3.5 h-3.5"></svg>
            </button>

            <div class="h-3 w-px bg-zinc-800 mx-0.5"></div>

            <!-- Vertical Alignment -->
            <button
              (click)="store.alignSelected('top')"
              [disabled]="!store.selectedNodeId()"
              class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
              title="Align Top"
            >
              <svg lucideAlignStartHorizontal class="w-3.5 h-3.5"></svg>
            </button>
            <button
              (click)="store.alignSelected('middle')"
              [disabled]="!store.selectedNodeId()"
              class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
              title="Align Middle Vertically"
            >
              <svg lucideAlignCenterHorizontal class="w-3.5 h-3.5"></svg>
            </button>
            <button
              (click)="store.alignSelected('bottom')"
              [disabled]="!store.selectedNodeId()"
              class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 transition"
              title="Align Bottom"
            >
              <svg lucideAlignEndHorizontal class="w-3.5 h-3.5"></svg>
            </button>

            <div class="h-3 w-px bg-zinc-800 mx-0.5"></div>

            <!-- Distribute -->
            <button
              (click)="store.distributeNodes('horizontal')"
              [disabled]="store.ast().children.length < 3"
              class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 disabled:opacity-20 transition"
              title="Distribute Evenly Horizontally"
            >
              <svg lucideAlignVerticalDistributeCenter class="w-3.5 h-3.5"></svg>
            </button>
            <button
              (click)="store.distributeNodes('vertical')"
              [disabled]="store.ast().children.length < 3"
              class="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 disabled:opacity-20 transition"
              title="Distribute Evenly Vertically"
            >
              <svg lucideAlignHorizontalDistributeCenter class="w-3.5 h-3.5"></svg>
            </button>
          </div>
        </div>

        <!-- Scrollable Properties Body -->
        <div (scroll)="hideTooltipImmediately()" class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 text-xs min-h-0">
          @if (store.selectedNode(); as node) {
            <!-- Breadcrumb Navigation Bar -->
            <div class="flex items-center gap-1 text-[10px] text-zinc-500 font-mono pb-1 border-b border-zinc-800/60">
              <span class="hover:text-emerald-400 cursor-pointer" (click)="deselectNode()">Formspec</span>
              <svg lucideChevronRight class="w-3 h-3 text-zinc-600"></svg>
              <span class="text-emerald-400 font-semibold truncate">{{ node.type }} ({{ node.name || node.id }})</span>
            </div>

            <!-- Widget Info Header & Version Compatibility -->
            <div class="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-zinc-500 font-mono">ELEMENT IDENTIFIER</span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  [ngClass]="{
                    'bg-amber-950 text-amber-300 border border-amber-800': getWidgetSpecVersion(node.type) >= 11,
                    'bg-sky-950 text-sky-300 border border-sky-800': getWidgetSpecVersion(node.type) >= 6 && getWidgetSpecVersion(node.type) < 11,
                    'bg-zinc-800 text-zinc-300 border border-zinc-700': getWidgetSpecVersion(node.type) < 6
                  }"
                >
                  v{{ getWidgetSpecVersion(node.type) }} ({{ getWidgetEngineVersion(node.type) }})
                </span>
              </div>

              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-zinc-100 font-mono truncate">
                  {{ node.name || node.id }}
                </div>

                <!-- Validation Status Pill -->
                @if (validationErrors().length === 0) {
                  <span class="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    <svg lucideCheckCircle2 class="w-3 h-3"></svg>
                    <span>Valid</span>
                  </span>
                } @else {
                  <span class="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 animate-pulse">
                    <svg lucideAlertCircle class="w-3 h-3"></svg>
                    <span>{{ validationErrors().length }} {{ validationErrors().length === 1 ? 'issue' : 'issues' }}</span>
                  </span>
                }
              </div>

              <!-- Quick Duplicate / Delete Actions -->
              <div class="flex items-center justify-between gap-1 pt-1 border-t border-zinc-800/60">
                <span class="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded text-[10px] font-mono">
                  {{ node.type }}[]
                </span>
                <div class="flex items-center gap-1">
                  <button
                    (click)="store.duplicateNode(node.id)"
                    class="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                    title="Duplicate Widget"
                  >
                    <svg lucideCopy class="w-3 h-3"></svg>
                  </button>
                  <button
                    (click)="store.deleteNode(node.id)"
                    class="p-1 rounded bg-red-950/50 hover:bg-red-900/80 text-red-400 transition"
                    title="Delete Widget"
                  >
                    <svg lucideTrash2 class="w-3 h-3"></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Validation Errors Summary (if any) -->
            @if (validationErrors().length > 0) {
              <div class="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-1">
                <div class="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <svg lucideAlertCircle class="w-3.5 h-3.5"></svg>
                  <span>Formspec Specification Notice</span>
                </div>
                <ul class="space-y-0.5 pl-5 list-disc text-[10px] text-amber-200/90 font-mono">
                  @for (err of validationErrors(); track err.property) {
                    <li>{{ err.message }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Position & Dimensions in Real Coordinates (Scrubbable & Math-Enabled) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Transform (Slot Units)
                </span>
                <span class="text-[9px] text-zinc-500 font-mono flex items-center gap-1">
                  <span>Drag label to scrub</span>
                  <svg lucideMoveHorizontal class="w-3 h-3 text-zinc-500"></svg>
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <!-- X Position -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label
                      (mousedown)="startScrub('x', $event)"
                      class="text-[10px] text-zinc-400 font-mono cursor-ew-resize hover:text-emerald-400 transition select-none flex items-center gap-1"
                      title="Drag horizontally to scrub X coordinate"
                    >
                      <span>X Pos</span>
                      <svg lucideMoveHorizontal class="w-2.5 h-2.5 text-zinc-500"></svg>
                    </label>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'x' }"></ng-container>
                  </div>
                  <input
                    type="text"
                    [ngModel]="node.x"
                    (blur)="onMathInput('x', $any($event.target).value)"
                    (keydown.enter)="onMathInput('x', $any($event.target).value)"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. 1.5 or 3-1"
                  />
                </div>

                <!-- Y Position -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label
                      (mousedown)="startScrub('y', $event)"
                      class="text-[10px] text-zinc-400 font-mono cursor-ew-resize hover:text-emerald-400 transition select-none flex items-center gap-1"
                      title="Drag horizontally to scrub Y coordinate"
                    >
                      <span>Y Pos</span>
                      <svg lucideMoveHorizontal class="w-2.5 h-2.5 text-zinc-500"></svg>
                    </label>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'y' }"></ng-container>
                  </div>
                  <input
                    type="text"
                    [ngModel]="node.y"
                    (blur)="onMathInput('y', $any($event.target).value)"
                    (keydown.enter)="onMathInput('y', $any($event.target).value)"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. 2.0 or 4/2"
                  />
                </div>

                <!-- Width -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label
                      (mousedown)="startScrub('w', $event)"
                      class="text-[10px] font-mono cursor-ew-resize hover:text-emerald-400 transition select-none flex items-center gap-1"
                      [class.text-red-400]="isPropertyError('w')"
                      [class.text-zinc-400]="!isPropertyError('w')"
                      title="Drag horizontally to scrub Width"
                    >
                      <span>Width (W)</span>
                      <svg lucideMoveHorizontal class="w-2.5 h-2.5 text-zinc-500"></svg>
                      @if (isMandatory('w')) {
                        <span class="text-red-400 font-bold">*</span>
                      }
                    </label>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'w' }"></ng-container>
                  </div>
                  <input
                    type="text"
                    [ngModel]="node.w"
                    (blur)="onMathInput('w', $any($event.target).value)"
                    (keydown.enter)="onMathInput('w', $any($event.target).value)"
                    [class.border-red-500]="isPropertyError('w')"
                    [class.border-zinc-700]="!isPropertyError('w')"
                    class="w-full bg-zinc-900 border rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. 3.0 or 2+1"
                  />
                </div>

                <!-- Height -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label
                      (mousedown)="startScrub('h', $event)"
                      class="text-[10px] font-mono cursor-ew-resize hover:text-emerald-400 transition select-none flex items-center gap-1"
                      [class.text-red-400]="isPropertyError('h')"
                      [class.text-zinc-400]="!isPropertyError('h')"
                      title="Drag horizontally to scrub Height"
                    >
                      <span>Height (H)</span>
                      <svg lucideMoveHorizontal class="w-2.5 h-2.5 text-zinc-500"></svg>
                      @if (isMandatory('h')) {
                        <span class="text-red-400 font-bold">*</span>
                      }
                    </label>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'h' }"></ng-container>
                  </div>
                  <input
                    type="text"
                    [ngModel]="node.h"
                    (blur)="onMathInput('h', $any($event.target).value)"
                    (keydown.enter)="onMathInput('h', $any($event.target).value)"
                    [class.border-red-500]="isPropertyError('h')"
                    [class.border-zinc-700]="!isPropertyError('h')"
                    class="w-full bg-zinc-900 border rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. 0.8 or 1.6/2"
                  />
                </div>
              </div>
            </div>

            <!-- Engine Flags (Checkboxes) -->
            <div class="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
              <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Luanti Engine Rendering Flags
              </span>

              <!-- noclip checkbox -->
              <div class="flex items-center justify-between">
                <label for="cb_noclip" class="text-xs text-zinc-300 flex items-center gap-1 cursor-pointer">
                  <span>No Clip (noclip)</span>
                  <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'noclip' }"></ng-container>
                </label>
                <input
                  type="checkbox"
                  id="cb_noclip"
                  [ngModel]="node.noclip || false"
                  (ngModelChange)="updateProp('noclip', $event)"
                  class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <!-- drawborder checkbox (for buttons) -->
              @if (isButtonElement(node.type)) {
                <div class="flex items-center justify-between">
                  <label for="cb_drawborder" class="text-xs text-zinc-300 flex items-center gap-1 cursor-pointer">
                    <span>Draw 3D Border</span>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'drawborder' }"></ng-container>
                  </label>
                  <input
                    type="checkbox"
                    id="cb_drawborder"
                    [ngModel]="node.drawborder !== false"
                    (ngModelChange)="updateProp('drawborder', $event)"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              }

              <!-- closeOnEnter checkbox (for text fields) -->
              @if (node.type === 'field' || node.type === 'pwdfield') {
                <div class="flex items-center justify-between">
                  <label for="cb_close_enter" class="text-xs text-zinc-300 flex items-center gap-1 cursor-pointer">
                    <span>Close on Enter</span>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'closeOnEnter' }"></ng-container>
                  </label>
                  <input
                    type="checkbox"
                    id="cb_close_enter"
                    [ngModel]="node.closeOnEnter !== false"
                    (ngModelChange)="updateProp('closeOnEnter', $event)"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              }

              <!-- wordwrap checkbox (for textarea) -->
              @if (node.type === 'textarea') {
                <div class="flex items-center justify-between">
                  <label for="cb_wordwrap" class="text-xs text-zinc-300 flex items-center gap-1 cursor-pointer">
                    <span>Word Wrap</span>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'wordwrap' }"></ng-container>
                  </label>
                  <input
                    type="checkbox"
                    id="cb_wordwrap"
                    [ngModel]="node.wordwrap !== false"
                    (ngModelChange)="updateProp('wordwrap', $event)"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              }

              <!-- indexEvent checkbox (for dropdowns) -->
              @if (node.type === 'dropdown') {
                <div class="flex items-center justify-between">
                  <label for="cb_index_event" class="text-xs text-zinc-300 flex items-center gap-1 cursor-pointer">
                    <span>Index Event (5.14+)</span>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'indexEvent' }"></ng-container>
                  </label>
                  <input
                    type="checkbox"
                    id="cb_index_event"
                    [ngModel]="node.indexEvent || false"
                    (ngModelChange)="updateProp('indexEvent', $event)"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              }

              <!-- autoScale checkbox (for backgrounds) -->
              @if (node.type === 'background' || node.type === 'background9') {
                <div class="flex items-center justify-between">
                  <label for="cb_autoscale" class="text-xs text-zinc-300 flex items-center gap-1 cursor-pointer">
                    <span>Auto Scale to Dialog</span>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'autoScale' }"></ng-container>
                  </label>
                  <input
                    type="checkbox"
                    id="cb_autoscale"
                    [ngModel]="node.autoScale || false"
                    (ngModelChange)="updateProp('autoScale', $event)"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              }
            </div>

            <!-- Specific Widget Attributes -->
            <div class="space-y-3">
              <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Element Parameters
              </span>

              <!-- Field Name -->
              @if (node.name !== undefined || isMandatory('name')) {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[10px] text-zinc-400 flex items-center gap-1">
                      <span>Field Name</span>
                      @if (isMandatory('name')) {
                        <span class="text-red-400 font-bold">*</span>
                        <span class="text-[8px] font-mono px-1 rounded bg-red-950 text-red-400 border border-red-800">REQUIRED</span>
                      }
                    </label>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'name' }"></ng-container>
                  </div>
                  <input
                    type="text"
                    [ngModel]="node.name"
                    (ngModelChange)="updateProp('name', $event)"
                    [class.border-red-500]="isPropertyError('name')"
                    [class.border-zinc-700]="!isPropertyError('name')"
                    placeholder="e.g. btn_submit or filter_query"
                    class="w-full bg-zinc-900 border rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  @if (getPropertyErrorMessage('name'); as msg) {
                    <p class="text-[10px] text-red-400 mt-1 font-mono">{{ msg }}</p>
                  }
                </div>
              }

              <!-- Label / Caption -->
              @if ((node.label !== undefined || isMandatory('label')) && node.type !== 'hypertext') {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[10px] text-zinc-400 flex items-center gap-1">
                      <span>Label Caption / Content</span>
                      @if (isMandatory('label')) {
                        <span class="text-red-400 font-bold">*</span>
                        <span class="text-[8px] font-mono px-1 rounded bg-red-950 text-red-400 border border-red-800">REQUIRED</span>
                      }
                    </label>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'label' }"></ng-container>
                  </div>
                  <input
                    type="text"
                    [ngModel]="node.label"
                    (ngModelChange)="updateProp('label', $event)"
                    [class.border-red-500]="isPropertyError('label')"
                    [class.border-zinc-700]="!isPropertyError('label')"
                    placeholder="Display text..."
                    class="w-full bg-zinc-900 border rounded-lg px-2.5 py-1.5 text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  />
                  @if (getPropertyErrorMessage('label'); as msg) {
                    <p class="text-[10px] text-red-400 mt-1 font-mono">{{ msg }}</p>
                  }
                </div>
              }

              <!-- URL for button_url -->
              @if (node.type === 'button_url' || node.type === 'button_url_exit') {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[10px] text-zinc-400 flex items-center gap-1">
                      <span>Target Web URL</span>
                      <span class="text-red-400 font-bold">*</span>
                      <span class="text-[8px] font-mono px-1 rounded bg-red-950 text-red-400 border border-red-800">REQUIRED</span>
                    </label>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'url' }"></ng-container>
                  </div>
                  <input
                    type="text"
                    [ngModel]="node.url"
                    (ngModelChange)="updateProp('url', $event)"
                    [class.border-red-500]="isPropertyError('url')"
                    [class.border-zinc-700]="!isPropertyError('url')"
                    placeholder="https://luanti.org"
                    class="w-full bg-zinc-900 border rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  @if (getPropertyErrorMessage('url'); as msg) {
                    <p class="text-[10px] text-amber-400 mt-1 font-mono">{{ msg }}</p>
                  }
                </div>
              }

              <!-- Text Input Default Text -->
              @if (node.type === 'field' || node.type === 'pwdfield' || node.type === 'textarea') {
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">Default / Initial Text</label>
                  @if (node.type === 'textarea') {
                    <textarea
                      rows="3"
                      [ngModel]="node.defaultVal"
                      (ngModelChange)="updateProp('defaultVal', $event)"
                      class="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    ></textarea>
                  } @else {
                    <input
                      type="text"
                      [ngModel]="node.defaultVal"
                      (ngModelChange)="updateProp('defaultVal', $event)"
                      class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:border-emerald-500 focus:outline-none"
                    />
                  }
                </div>
              }

              <!-- Checkbox Checked State -->
              @if (node.type === 'checkbox') {
                <div class="flex items-center gap-2 p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <input
                    type="checkbox"
                    id="cb_checked"
                    [ngModel]="node.checked || false"
                    (ngModelChange)="updateProp('checked', $event)"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label for="cb_checked" class="text-xs text-zinc-300 cursor-pointer">Checked by default</label>
                </div>
              }

              <!-- Inventory Locations & Lists (Predefined Dropdowns!) -->
              @if (node.type === 'list' || node.type === 'listring') {
                <div class="space-y-3 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Inventory Target Definition
                  </span>

                  <!-- Inventory Location Dropdown -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-[10px] text-zinc-400 flex items-center gap-1">
                        <span>Inventory Location</span>
                        <span class="text-red-400 font-bold">*</span>
                      </label>
                      <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'inventoryLocation' }"></ng-container>
                    </div>
                    <select
                      [ngModel]="getPredefinedLocation(node.inventoryLocation)"
                      (ngModelChange)="onLocationSelect($event)"
                      class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="current_player">current_player (Active Player)</option>
                      <option value="current_name">current_name (Node Metadata)</option>
                      <option value="context">context (Formspec Context)</option>
                      <option value="custom">Custom Location string...</option>
                    </select>

                    @if (isCustomLocation(node.inventoryLocation)) {
                      <input
                        type="text"
                        [ngModel]="node.inventoryLocation"
                        (ngModelChange)="updateProp('inventoryLocation', $event)"
                        placeholder="nodemeta:0,0,0 or detached:chest"
                        class="w-full mt-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    }
                  </div>

                  <!-- Inventory List Name Dropdown -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-[10px] text-zinc-400 flex items-center gap-1">
                        <span>List Identifier</span>
                        <span class="text-red-400 font-bold">*</span>
                      </label>
                      <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'inventoryList' }"></ng-container>
                    </div>
                    <select
                      [ngModel]="getPredefinedList(node.inventoryList)"
                      (ngModelChange)="onListSelect($event)"
                      class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="main">main (Standard Storage / Hotbar)</option>
                      <option value="craft">craft (3x3 Crafting Grid)</option>
                      <option value="craftpreview">craftpreview (Craft Result)</option>
                      <option value="fuel">fuel (Furnace Fuel Slot)</option>
                      <option value="src">src (Smelter Input)</option>
                      <option value="dst">dst (Smelter Output)</option>
                      <option value="custom">Custom List Name...</option>
                    </select>

                    @if (isCustomList(node.inventoryList)) {
                      <input
                        type="text"
                        [ngModel]="node.inventoryList"
                        (ngModelChange)="updateProp('inventoryList', $event)"
                        placeholder="e.g. upgrades or spells"
                        class="w-full mt-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    }
                  </div>

                  <!-- Starting Index -->
                  @if (node.type === 'list') {
                    <div>
                      <label class="block text-[10px] text-zinc-400 mb-1">Starting Slot Index (0-based)</label>
                      <input
                        type="number"
                        min="0"
                        [ngModel]="node.startingIndex || 0"
                        (ngModelChange)="updateProp('startingIndex', $event)"
                        class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                      <p class="text-[9px] text-zinc-500 mt-1 font-mono">Use 0 for hotbar, 8 for player main bag storage</p>
                    </div>
                  }
                </div>
              }

              <!-- Texture Pickers with Bundled Placeholders -->
              @if (node.texture !== undefined || isMandatory('texture')) {
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] text-zinc-400 flex items-center gap-1">
                      <span>Texture / Image</span>
                      @if (isMandatory('texture')) {
                        <span class="text-red-400 font-bold">*</span>
                        <span class="text-[8px] font-mono px-1 rounded bg-red-950 text-red-400 border border-red-800">REQUIRED</span>
                      }
                    </label>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'texture' }"></ng-container>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Live Image Thumbnail Preview -->
                    <div class="w-9 h-9 rounded-lg border border-zinc-700 bg-black/60 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                      <img [src]="getTextureUrl(node.texture)" class="w-full h-full object-contain" />
                    </div>

                    <input
                      type="text"
                      [ngModel]="node.texture"
                      (ngModelChange)="updateProp('texture', $event)"
                      [class.border-red-500]="isPropertyError('texture')"
                      [class.border-zinc-700]="!isPropertyError('texture')"
                      placeholder="e.g. gui_formspec_bg.png"
                      class="flex-1 bg-zinc-900 border rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <!-- Quick-Pick Preset Bundled Textures -->
                  <div class="flex items-center gap-1 flex-wrap pt-1">
                    <span class="text-[9px] text-zinc-500 font-mono">Presets:</span>
                    @for (tex of presetTextures; track tex) {
                      <button
                        type="button"
                        (click)="updateProp('texture', tex)"
                        class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 font-mono transition"
                      >
                        {{ tex.replace('.png', '') }}
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- 3D Mesh Options -->
              @if (node.type === 'model') {
                <div class="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl space-y-2.5">
                  <div class="flex items-center justify-between text-cyan-300 font-semibold text-[11px]">
                    <span class="flex items-center gap-1.5">
                      <svg lucideSparkles class="w-3.5 h-3.5"></svg>
                      <span>3D Mesh Model (5.4+)</span>
                    </span>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'mesh' }"></ng-container>
                  </div>

                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">Mesh Filename (.b3d, .obj)</label>
                    <input
                      type="text"
                      [ngModel]="node.mesh"
                      (ngModelChange)="updateProp('mesh', $event)"
                      placeholder="character.b3d"
                      class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs"
                    />
                    <div class="flex gap-1 mt-1">
                      <button (click)="updateProp('mesh', 'character.b3d')" class="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-400 font-mono">character.b3d</button>
                      <button (click)="updateProp('mesh', 'chest.obj')" class="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-400 font-mono">chest.obj</button>
                      <button (click)="updateProp('mesh', 'cube.obj')" class="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-400 font-mono">cube.obj</button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">Textures</label>
                    <input
                      type="text"
                      [ngModel]="node.meshTextures"
                      (ngModelChange)="updateProp('meshTextures', $event)"
                      placeholder="character.png"
                      class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-zinc-400 mb-0.5">Camera Rotation</label>
                      <input
                        type="text"
                        [ngModel]="node.meshRotation"
                        (ngModelChange)="updateProp('meshRotation', $event)"
                        placeholder="0,180"
                        class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-zinc-400 mb-0.5">Animation FPS</label>
                      <input
                        type="number"
                        [ngModel]="node.animationSpeed"
                        (ngModelChange)="updateProp('animationSpeed', $event)"
                        class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-1">
                    <label for="cb_continuous" class="text-xs text-zinc-300 cursor-pointer">Auto-rotate Continuous</label>
                    <input
                      type="checkbox"
                      id="cb_continuous"
                      [ngModel]="node.continuous || false"
                      (ngModelChange)="updateProp('continuous', $event)"
                      class="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>

                  <div class="flex items-center justify-between">
                    <label for="cb_mouse_ctrl" class="text-xs text-zinc-300 cursor-pointer">Mouse Drag Interaction</label>
                    <input
                      type="checkbox"
                      id="cb_mouse_ctrl"
                      [ngModel]="node.mouseControl !== false"
                      (ngModelChange)="updateProp('mouseControl', $event)"
                      class="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              }

              <!-- Animated Image Options -->
              @if (node.type === 'animated_image') {
                <div class="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2">
                  <span class="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                    Sprite Sheet Parameters
                  </span>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-zinc-400 mb-0.5">Frame Count</label>
                      <input
                        type="number"
                        min="1"
                        [ngModel]="node.frameCount || 8"
                        (ngModelChange)="updateProp('frameCount', $event)"
                        class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-zinc-400 mb-0.5">Duration (ms)</label>
                      <input
                        type="number"
                        min="10"
                        step="10"
                        [ngModel]="node.frameDuration || 100"
                        (ngModelChange)="updateProp('frameDuration', $event)"
                        class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              }

              <!-- Scrollbar Options (Predefined Dropdown!) -->
              @if (node.type === 'scrollbar' || node.type === 'scroll_container') {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[10px] text-zinc-400 flex items-center gap-1">
                      <span>Orientation</span>
                      <span class="text-red-400 font-bold">*</span>
                    </label>
                    <ng-container *ngTemplateOutlet="propDocTip; context: { prop: 'orientation' }"></ng-container>
                  </div>
                  <select
                    [ngModel]="node.orientation || 'vertical'"
                    (ngModelChange)="updateProp('orientation', $event)"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </div>
              }

              <!-- Dropdown Items -->
              @if (node.type === 'dropdown') {
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">Dropdown Choices (Comma Separated)</label>
                  <input
                    type="text"
                    [ngModel]="(node.dropdownItems || []).join(', ')"
                    (ngModelChange)="updateCommaItems($event)"
                    placeholder="Choice A, Choice B, Choice C"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              }

              <!-- Box Color / Background Color / Label Color -->
              @if (node.type === 'box' || node.type === 'listcolors' || node.type === 'vertlabel' || node.type === 'label') {
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">Color (Hex)</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      [ngModel]="node.color || '#38bdf8'"
                      (ngModelChange)="updateProp('color', $event)"
                      class="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      [ngModel]="node.color || '#38bdf8'"
                      (ngModelChange)="updateProp('color', $event)"
                      class="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200 font-mono text-xs"
                    />
                  </div>
                </div>
              }

              <!-- Editable Toggle (Luanti 5.18+ / Formspec v12) -->
              @if (['field', 'pwdfield', 'textarea', 'checkbox', 'dropdown'].includes(node.type)) {
                <div class="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <div>
                    <div class="text-xs text-zinc-200 font-medium flex items-center gap-1.5">
                      <span>Editable (editable)</span>
                      <span class="text-[9px] font-mono px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">v12</span>
                    </div>
                    <div class="text-[10px] text-zinc-500">Allow user input (set false for read-only status widgets)</div>
                  </div>
                  <input
                    type="checkbox"
                    [ngModel]="node.editable !== false"
                    (ngModelChange)="updateProp('editable', $event)"
                    class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              }

              <!-- List Images (Luanti 5.18+ / Formspec v12) -->
              @if (node.type === 'listimages') {
                <div class="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Inventory Slot Textures
                    </span>
                    <span class="text-[9px] font-mono px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Luanti 5.18+
                    </span>
                  </div>

                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">Normal Slot Background</label>
                    <input
                      type="text"
                      [ngModel]="node.texture"
                      (ngModelChange)="updateProp('texture', $event)"
                      placeholder="e.g. gui_hb_bg.svg or gui_slot.png"
                      class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <div class="flex gap-1 mt-1 flex-wrap">
                      <button (click)="updateProp('texture', 'gui_hb_bg.svg')" class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-mono">gui_hb_bg.svg</button>
                      <button (click)="updateProp('texture', 'gui_formspec_bg.svg')" class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-mono">gui_formspec_bg.svg</button>
                      <button (click)="updateProp('texture', 'default_wood.svg')" class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-mono">default_wood.svg</button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">Hovered Slot Background</label>
                    <input
                      type="text"
                      [ngModel]="node.pressedTexture"
                      (ngModelChange)="updateProp('pressedTexture', $event)"
                      placeholder="e.g. gui_furnace_arrow_bg.svg or slot_hover.png"
                      class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <div class="flex gap-1 mt-1 flex-wrap">
                      <button (click)="updateProp('pressedTexture', 'gui_furnace_arrow_bg.svg')" class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-mono">gui_furnace_arrow_bg.svg</button>
                      <button (click)="updateProp('pressedTexture', 'bubble.svg')" class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-mono">bubble.svg</button>
                    </div>
                  </div>
                </div>
              }

              <!-- Tooltips, Hypertips & Hypertext Rich Formatting Suite -->
              @if (node.type === 'hypertip' || node.type === 'tooltip' || node.type === 'hypertext') {
                <div class="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2.5">
                  <div class="flex items-center justify-between text-emerald-300 font-semibold text-[11px]">
                    <span class="flex items-center gap-1.5">
                      <svg lucideLightbulb class="w-3.5 h-3.5 text-amber-400"></svg>
                      <span>
                        @if (node.type === 'hypertip') {
                          Hypertip (Rich v11)
                        } @else if (node.type === 'hypertext') {
                          Hypertext Content (Rich Markup)
                        } @else {
                          Tooltip Parameters
                        }
                      </span>
                    </span>
                    <ng-container
                      *ngTemplateOutlet="propDocTip; context: { prop: node.type === 'hypertext' ? 'label' : 'tooltipText' }"
                    ></ng-container>
                  </div>

                  <!-- Quick Formatting Markup Toolbar -->
                  <div class="flex items-center gap-1 flex-wrap pb-1.5 border-b border-zinc-800 text-[10px]">
                    <span class="text-zinc-500 font-mono text-[9px] mr-1">Insert:</span>
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<b>', '</b>')"
                      class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition"
                      title="Bold text (<b>...</b>)"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<i>', '</i>')"
                      class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 italic transition"
                      title="Italic text (<i>...</i>)"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<u>', '</u>')"
                      class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 underline transition"
                      title="Underline (<u>...</u>)"
                    >
                      U
                    </button>
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<mono>', '</mono>')"
                      class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[9px] transition"
                      title="Monospace code (<mono>...</mono>)"
                    >
                      Code
                    </button>
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<center>', '</center>')"
                      class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[9px] transition"
                      title="Center alignment (<center>...</center>)"
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<bigger>', '</bigger>')"
                      class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[9px] transition"
                      title="Enlarge text size (<bigger>...</bigger>)"
                    >
                      +Size
                    </button>

                    <div class="h-3 w-px bg-zinc-700 mx-0.5"></div>

                    <!-- Quick Preset Colors -->
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<color color=#34d399>', '</color>')"
                      class="w-4 h-4 rounded-full bg-emerald-400 hover:scale-110 transition shadow"
                      title="Green text (<color color=#34d399>)"
                    ></button>
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<color color=#38bdf8>', '</color>')"
                      class="w-4 h-4 rounded-full bg-sky-400 hover:scale-110 transition shadow"
                      title="Sky Blue text (<color color=#38bdf8>)"
                    ></button>
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<color color=#fbbf24>', '</color>')"
                      class="w-4 h-4 rounded-full bg-amber-400 hover:scale-110 transition shadow"
                      title="Gold text (<color color=#fbbf24>)"
                    ></button>
                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<color color=#f87171>', '</color>')"
                      class="w-4 h-4 rounded-full bg-rose-400 hover:scale-110 transition shadow"
                      title="Rose text (<color color=#f87171>)"
                    ></button>

                    <div class="h-3 w-px bg-zinc-700 mx-0.5"></div>

                    <button
                      type="button"
                      (click)="insertMarkupTag(node.type === 'hypertext' ? 'label' : 'tooltipText', '<item name=item_sword width=1 height=1>')"
                      class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[9px] transition"
                      title="Insert item icon (<item name=item_sword>)"
                    >
                      +Item
                    </button>
                  </div>

                  <!-- Textarea Editor -->
                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-0.5">
                      {{ node.type === 'hypertext' ? 'Hypertext Markup' : 'Tooltip Markup / Content' }}
                    </label>
                    <textarea
                      rows="4"
                      [ngModel]="node.type === 'hypertext' ? node.label : node.tooltipText"
                      (ngModelChange)="updateProp(node.type === 'hypertext' ? 'label' : 'tooltipText', $event)"
                      placeholder="e.g. <global color=#34d399><b>Title</b></global>\nStats: 100"
                      class="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <!-- Optional Custom Background & Font Colors (Tooltips) -->
                  @if (node.type === 'hypertip' || node.type === 'tooltip') {
                    <div class="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
                      <div>
                        <label class="block text-[9px] text-zinc-400 font-mono mb-1">Background Color</label>
                        <div class="flex items-center gap-1.5">
                          <input
                            type="color"
                            [ngModel]="node.tooltipBgColor || '#101014'"
                            (ngModelChange)="updateProp('tooltipBgColor', $event)"
                            class="w-6 h-6 rounded bg-transparent cursor-pointer border border-zinc-700 p-0"
                          />
                          <input
                            type="text"
                            [ngModel]="node.tooltipBgColor || ''"
                            (ngModelChange)="updateProp('tooltipBgColor', $event)"
                            placeholder="#101014"
                            class="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[10px] text-zinc-200 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[9px] text-zinc-400 font-mono mb-1">Text Color</label>
                        <div class="flex items-center gap-1.5">
                          <input
                            type="color"
                            [ngModel]="node.tooltipFontColor || '#e4e4e7'"
                            (ngModelChange)="updateProp('tooltipFontColor', $event)"
                            class="w-6 h-6 rounded bg-transparent cursor-pointer border border-zinc-700 p-0"
                          />
                          <input
                            type="text"
                            [ngModel]="node.tooltipFontColor || ''"
                            (ngModelChange)="updateProp('tooltipFontColor', $event)"
                            placeholder="#e4e4e7"
                            class="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[10px] text-zinc-200 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Live In-Game WYSIWYG Preview Card -->
                  <div class="space-y-1 pt-1.5 border-t border-zinc-800/80">
                    <div class="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span class="font-bold text-zinc-300">Live In-Game Preview</span>
                      </span>
                      <span class="text-zinc-500">WYSIWYG</span>
                    </div>

                    @let liveStyles = getHypertextStyles(node.type === 'hypertext' ? node.label : node.tooltipText);
                    <div
                      class="p-2.5 rounded-lg border shadow-xl min-h-[50px] text-xs transition-all leading-snug select-text"
                      [style.backgroundColor]="node.tooltipBgColor || liveStyles.backgroundColor || 'rgba(16, 16, 22, 0.95)'"
                      [style.color]="node.tooltipFontColor || liveStyles.color || '#e4e4e7'"
                      [style.borderColor]="'rgba(52, 211, 153, 0.4)'"
                      [style.textAlign]="liveStyles.halign || 'left'"
                      [style.fontSize]="liveStyles.fontSize || '11px'"
                      [style.fontFamily]="liveStyles.fontFamily || 'inherit'"
                      [innerHTML]="getSafeHypertext(node.type === 'hypertext' ? node.label : node.tooltipText || 'Sample preview text...')"
                    ></div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Empty State: Global Formspec Master Settings -->
            <div class="space-y-4">
              <div class="p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
                <svg lucideLayers class="w-6 h-6 text-zinc-500 mx-auto mb-1"></svg>
                <div class="text-xs font-semibold text-zinc-200">Formspec Canvas Settings</div>
                <p class="text-[10px] text-zinc-400 mt-0.5">Select any element on canvas or choose from Layout Tree</p>
              </div>

              <!-- Luanti 5.18.0 Status -->
              <div class="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                    <svg lucideSparkles class="w-3.5 h-3.5"></svg>
                    <span>Luanti 5.18.0 Engine</span>
                  </span>
                  <span class="px-1.5 py-0.2 bg-emerald-900 text-emerald-300 rounded text-[10px] font-mono">
                    v{{ store.ast().version || 7 }}
                  </span>
                </div>
                <p class="text-[11px] text-zinc-300 leading-relaxed">
                  Real coordinates, 3D mesh models, hypertips, listimages, and editable styles supported.
                </p>
              </div>

              <!-- Root Formspec Properties -->
              <div class="space-y-4">
                <!-- Root Header Card -->
                <div class="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span class="font-bold text-xs text-zinc-100">Root Formspec Screen</span>
                    </div>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Formspec v7
                    </span>
                  </div>
                  <p class="text-[11px] text-zinc-400 leading-relaxed">
                    Configure formspec canvas dimensions, screen positioning & anchoring on the player's display, and responsive simulation.
                  </p>
                </div>

                <!-- Dialog Size Config (size[W,H]) -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Dialog Dimensions (size[W,H])
                    </label>
                    <span class="text-[10px] font-mono text-emerald-400">
                      {{ store.ast().size.w }}×{{ store.ast().size.h }} slots
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-zinc-400 font-mono mb-1">Width (Slots)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        [ngModel]="store.ast().size.w"
                        (ngModelChange)="updateCanvasSize($event, store.ast().size.h)"
                        class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-zinc-400 font-mono mb-1">Height (Slots)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        [ngModel]="store.ast().size.h"
                        (ngModelChange)="updateCanvasSize(store.ast().size.w, $event)"
                        class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <!-- Screen Placement & Anchor (position[X,Y] & anchor[X,Y]) -->
                <div class="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                        Screen Placement & Anchor
                      </div>
                      <div class="text-[10px] text-zinc-400 font-mono">
                        position[X,Y] & anchor[X,Y]
                      </div>
                    </div>
                    @if (store.ast().position || store.ast().anchor) {
                      <button
                        (click)="resetPositionAndAnchor()"
                        class="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition"
                        title="Reset to screen center (0.5, 0.5)"
                      >
                        Reset Center
                      </button>
                    } @else {
                      <span class="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        Centered (Default)
                      </span>
                    }
                  </div>

                  <!-- 9-Point Quick Alignment Grid -->
                  <div>
                    <div class="text-[10px] text-zinc-400 mb-1.5">Quick Placement Grid:</div>
                    <div class="grid grid-cols-3 gap-1.5 max-w-[180px]">
                      <!-- Row 1: Top-Left, Top-Center, Top-Right -->
                      <button
                        (click)="setPlacementPreset(0, 0, 0, 0)"
                        [class.bg-emerald-600]="isPlacementPresetActive(0, 0)"
                        [class.text-white]="isPlacementPresetActive(0, 0)"
                        [class.bg-zinc-800]="!isPlacementPresetActive(0, 0)"
                        [class.text-zinc-400]="!isPlacementPresetActive(0, 0)"
                        class="h-7 rounded hover:bg-emerald-600 hover:text-white transition flex items-center justify-center"
                        title="Top-Left (0, 0)"
                      >
                        <svg lucideArrowUpLeft class="w-3.5 h-3.5"></svg>
                      </button>
                      <button
                        (click)="setPlacementPreset(0.5, 0, 0.5, 0)"
                        [class.bg-emerald-600]="isPlacementPresetActive(0.5, 0)"
                        [class.text-white]="isPlacementPresetActive(0.5, 0)"
                        [class.bg-zinc-800]="!isPlacementPresetActive(0.5, 0)"
                        [class.text-zinc-400]="!isPlacementPresetActive(0.5, 0)"
                        class="h-7 rounded hover:bg-emerald-600 hover:text-white transition flex items-center justify-center"
                        title="Top-Center (0.5, 0)"
                      >
                        <svg lucideArrowUp class="w-3.5 h-3.5"></svg>
                      </button>
                      <button
                        (click)="setPlacementPreset(1, 0, 1, 0)"
                        [class.bg-emerald-600]="isPlacementPresetActive(1, 0)"
                        [class.text-white]="isPlacementPresetActive(1, 0)"
                        [class.bg-zinc-800]="!isPlacementPresetActive(1, 0)"
                        [class.text-zinc-400]="!isPlacementPresetActive(1, 0)"
                        class="h-7 rounded hover:bg-emerald-600 hover:text-white transition flex items-center justify-center"
                        title="Top-Right (1, 0)"
                      >
                        <svg lucideArrowUpRight class="w-3.5 h-3.5"></svg>
                      </button>

                      <!-- Row 2: Left, Center, Right -->
                      <button
                        (click)="setPlacementPreset(0, 0.5, 0, 0.5)"
                        [class.bg-emerald-600]="isPlacementPresetActive(0, 0.5)"
                        [class.text-white]="isPlacementPresetActive(0, 0.5)"
                        [class.bg-zinc-800]="!isPlacementPresetActive(0, 0.5)"
                        [class.text-zinc-400]="!isPlacementPresetActive(0, 0.5)"
                        class="h-7 rounded hover:bg-emerald-600 hover:text-white transition flex items-center justify-center"
                        title="Left-Center Sidebar (0, 0.5)"
                      >
                        <svg lucideArrowLeft class="w-3.5 h-3.5"></svg>
                      </button>
                      <button
                        (click)="setPlacementPreset(0.5, 0.5, 0.5, 0.5)"
                        [class.bg-emerald-600]="isPlacementPresetActive(0.5, 0.5)"
                        [class.text-white]="isPlacementPresetActive(0.5, 0.5)"
                        [class.bg-zinc-800]="!isPlacementPresetActive(0.5, 0.5)"
                        [class.text-zinc-400]="!isPlacementPresetActive(0.5, 0.5)"
                        class="h-7 rounded hover:bg-emerald-600 hover:text-white transition flex items-center justify-center font-bold"
                        title="Screen Center (0.5, 0.5)"
                      >
                        <svg lucideCircle class="w-2.5 h-2.5 fill-current"></svg>
                      </button>
                      <button
                        (click)="setPlacementPreset(1, 0.5, 1, 0.5)"
                        [class.bg-emerald-600]="isPlacementPresetActive(1, 0.5)"
                        [class.text-white]="isPlacementPresetActive(1, 0.5)"
                        [class.bg-zinc-800]="!isPlacementPresetActive(1, 0.5)"
                        [class.text-zinc-400]="!isPlacementPresetActive(1, 0.5)"
                        class="h-7 rounded hover:bg-emerald-600 hover:text-white transition flex items-center justify-center"
                        title="Right-Center Sidebar (1, 0.5)"
                      >
                        <svg lucideArrowRight class="w-3.5 h-3.5"></svg>
                      </button>

                      <!-- Row 3: Bottom-Left, Bottom-Center, Bottom-Right -->
                      <button
                        (click)="setPlacementPreset(0, 1, 0, 1)"
                        [class.bg-emerald-600]="isPlacementPresetActive(0, 1)"
                        [class.text-white]="isPlacementPresetActive(0, 1)"
                        [class.bg-zinc-800]="!isPlacementPresetActive(0, 1)"
                        [class.text-zinc-400]="!isPlacementPresetActive(0, 1)"
                        class="h-7 rounded hover:bg-emerald-600 hover:text-white transition flex items-center justify-center"
                        title="Bottom-Left (0, 1)"
                      >
                        <svg lucideArrowDownLeft class="w-3.5 h-3.5"></svg>
                      </button>
                      <button
                        (click)="setPlacementPreset(0.5, 1, 0.5, 1)"
                        [class.bg-emerald-600]="isPlacementPresetActive(0.5, 1)"
                        [class.text-white]="isPlacementPresetActive(0.5, 1)"
                        [class.bg-zinc-800]="!isPlacementPresetActive(0.5, 1)"
                        [class.text-zinc-400]="!isPlacementPresetActive(0.5, 1)"
                        class="h-7 rounded hover:bg-emerald-600 hover:text-white transition flex items-center justify-center"
                        title="Bottom-Center HUD (0.5, 1)"
                      >
                        <svg lucideArrowDown class="w-3.5 h-3.5"></svg>
                      </button>
                      <button
                        (click)="setPlacementPreset(1, 1, 1, 1)"
                        [class.bg-emerald-600]="isPlacementPresetActive(1, 1)"
                        [class.text-white]="isPlacementPresetActive(1, 1)"
                        [class.bg-zinc-800]="!isPlacementPresetActive(1, 1)"
                        [class.text-zinc-400]="!isPlacementPresetActive(1, 1)"
                        class="h-7 rounded hover:bg-emerald-600 hover:text-white transition flex items-center justify-center"
                        title="Bottom-Right (1, 1)"
                      >
                        <svg lucideArrowDownRight class="w-3.5 h-3.5"></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Position Coordinates (0.0 to 1.0) -->
                  <div>
                    <label class="block text-[10px] text-zinc-400 font-mono mb-1">
                      Screen Target: position[X,Y] (0=Start, 0.5=Center, 1=End)
                    </label>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <span class="text-[9px] text-zinc-500">X:</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          [ngModel]="store.ast().position ? store.ast().position!.x : 0.5"
                          (ngModelChange)="updatePositionX($event)"
                          class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span class="text-[9px] text-zinc-500">Y:</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          [ngModel]="store.ast().position ? store.ast().position!.y : 0.5"
                          (ngModelChange)="updatePositionY($event)"
                          class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Anchor Coordinates (0.0 to 1.0) -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-[10px] text-zinc-400 font-mono">
                        Formspec Anchor: anchor[X,Y]
                      </label>
                      <button
                        (click)="matchAnchorToPosition()"
                        class="text-[9px] text-emerald-400 hover:text-emerald-300 underline"
                        title="Set anchor coordinates to match position"
                      >
                        Match Position
                      </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <span class="text-[9px] text-zinc-500">X:</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          [ngModel]="store.ast().anchor ? store.ast().anchor!.x : 0.5"
                          (ngModelChange)="updateAnchorX($event)"
                          class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span class="text-[9px] text-zinc-500">Y:</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          [ngModel]="store.ast().anchor ? store.ast().anchor!.y : 0.5"
                          (ngModelChange)="updateAnchorY($event)"
                          class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Padding & Options -->
                <div class="space-y-2">
                  <label class="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    Padding (padding[X,Y])
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-zinc-400 font-mono mb-1">Pad X (Slots)</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        [ngModel]="store.ast().padding ? store.ast().padding!.x : 0"
                        (ngModelChange)="updatePaddingX($event)"
                        class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-zinc-400 font-mono mb-1">Pad Y (Slots)</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        [ngModel]="store.ast().padding ? store.ast().padding!.y : 0"
                        (ngModelChange)="updatePaddingY($event)"
                        class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <!-- Root Toggles -->
                <div class="space-y-2">
                  <!-- Allow Close -->
                  <div class="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <div>
                      <div class="text-xs text-zinc-200 font-medium">allow_close[]</div>
                      <div class="text-[10px] text-zinc-500">Allow closing with Escape key (5.12+)</div>
                    </div>
                    <input
                      type="checkbox"
                      [ngModel]="store.ast().allowClose !== false"
                      (ngModelChange)="toggleAllowClose($event)"
                      class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  <!-- No Prepend -->
                  <div class="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <div>
                      <div class="text-xs text-zinc-200 font-medium">no_prepend[]</div>
                      <div class="text-[10px] text-zinc-500">Disable default background/styles</div>
                    </div>
                    <input
                      type="checkbox"
                      [ngModel]="store.ast().noPrepend || false"
                      (ngModelChange)="toggleNoPrepend($event)"
                      class="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <!-- Responsive Layout Simulator & Diagnostics -->
                <div class="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                      Responsive Simulation
                    </span>
                    <span class="text-[10px] font-mono text-zinc-400 capitalize">
                      {{ store.activeBreakpoint() }}
                    </span>
                  </div>

                  <!-- Breakpoint Selector Buttons -->
                  <div class="grid grid-cols-3 gap-1 bg-[#121214] p-1 rounded-lg border border-zinc-800">
                    <button
                      (click)="store.setBreakpoint('mobile')"
                      [class.bg-emerald-600]="store.activeBreakpoint() === 'mobile'"
                      [class.text-white]="store.activeBreakpoint() === 'mobile'"
                      [class.text-zinc-400]="store.activeBreakpoint() !== 'mobile'"
                      class="py-1.5 px-2 rounded font-medium text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <svg lucideSmartphone class="w-3.5 h-3.5"></svg>
                      <span>Mobile</span>
                    </button>
                    <button
                      (click)="store.setBreakpoint('tablet')"
                      [class.bg-emerald-600]="store.activeBreakpoint() === 'tablet'"
                      [class.text-white]="store.activeBreakpoint() === 'tablet'"
                      [class.text-zinc-400]="store.activeBreakpoint() !== 'tablet'"
                      class="py-1.5 px-2 rounded font-medium text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <svg lucideTablet class="w-3.5 h-3.5"></svg>
                      <span>Tablet</span>
                    </button>
                    <button
                      (click)="store.setBreakpoint('desktop')"
                      [class.bg-emerald-600]="store.activeBreakpoint() === 'desktop'"
                      [class.text-white]="store.activeBreakpoint() === 'desktop'"
                      [class.text-zinc-400]="store.activeBreakpoint() !== 'desktop'"
                      class="py-1.5 px-2 rounded font-medium text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <svg lucideMonitor class="w-3.5 h-3.5"></svg>
                      <span>Desktop</span>
                    </button>
                  </div>

                  <!-- Viewport Diagnostic Card -->
                  <div
                    [class.border-amber-700/60]="isRootOverflowing()"
                    [class.bg-amber-950/20]="isRootOverflowing()"
                    [class.border-emerald-700/40]="!isRootOverflowing()"
                    [class.bg-emerald-950/15]="!isRootOverflowing()"
                    class="p-2.5 rounded-lg border text-[11px] space-y-1"
                  >
                    <div class="flex items-center gap-1.5 font-bold">
                      @if (isRootOverflowing()) {
                        <span class="text-amber-400 flex items-center gap-1.5">
                          <svg lucideTriangleAlert class="w-3.5 h-3.5 shrink-0"></svg>
                          <span>Viewport Overflow Warning</span>
                        </span>
                      } @else {
                        <span class="text-emerald-400 flex items-center gap-1.5">
                          <svg lucideCheckCircle2 class="w-3.5 h-3.5 shrink-0"></svg>
                          <span>Fits Within Active Screen</span>
                        </span>
                      }
                    </div>
                    <p class="text-zinc-400 text-[10px] leading-relaxed">
                      {{ overflowResult().message }}
                      @if (isRootOverflowing()) {
                        <span class="block mt-0.5">In Luanti, use <code class="text-emerald-300">core.get_player_window_information(player_name)</code> to serve adaptive layouts.</span>
                      }
                    </p>
                  </div>
                </div>

                <!-- Grid Snapping Step -->
                <div>
                  <label class="block text-[10px] text-zinc-400 font-mono mb-1">Editor Snapping Increment</label>
                  <select
                    [ngModel]="store.snapStep()"
                    (ngModelChange)="store.setSnapStep($event)"
                    class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 cursor-pointer focus:border-emerald-500 focus:outline-none"
                  >
                    <option [value]="0.1">0.10 slot (Ultra Fine)</option>
                    <option [value]="0.25">0.25 slot (Fine)</option>
                    <option [value]="0.5">0.50 slot (Standard)</option>
                    <option [value]="1.0">1.00 slot (1 Full Slot)</option>
                  </select>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Reusable Consistent Tooltip Popover Trigger -->
      <ng-template #propDocTip let-prop="prop">
        @if (getPropertyDoc(prop); as doc) {
          <div class="inline-flex items-center">
            <button
              type="button"
              (mouseenter)="showTooltip($event, doc)"
              (mouseleave)="hideTooltip()"
              (click)="toggleTooltip($event, doc)"
              class="text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800/80 p-0.5 rounded transition"
              aria-label="Luanti specification information"
            >
              <svg lucideInfo class="w-3.5 h-3.5"></svg>
            </button>
          </div>
        }
      </ng-template>

      <!-- Fixed Global Floating Tooltip Popover (Completely Immune to Overflow Clipping) -->
      @if (activeTooltip(); as tip) {
        <div
          class="fixed z-[9999] w-72 p-3 bg-[#18181c] border border-zinc-700 rounded-xl shadow-2xl text-left select-text pointer-events-auto backdrop-blur-md animate-fade-in"
          [style.left.px]="tip.x"
          [style.top.px]="tip.y"
          (mouseenter)="keepTooltipOpen()"
          (mouseleave)="hideTooltip()"
        >
          <!-- Header: Title + Version Badge -->
          <div class="flex items-center justify-between mb-1.5 pb-1.5 border-b border-zinc-800">
            <span class="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
              <svg lucideInfo class="w-3.5 h-3.5 text-emerald-400"></svg>
              {{ tip.doc.title }}
            </span>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
              {{ tip.doc.luantiVersion }}
            </span>
          </div>

          <!-- Syntax Code Block -->
          <div class="font-mono text-[10px] text-emerald-300 bg-black/70 px-2 py-1 rounded mb-2 border border-zinc-800 overflow-x-auto select-all">
            {{ tip.doc.syntax }}
          </div>

          <!-- Description Text -->
          <p class="text-[11px] text-zinc-300 leading-relaxed">{{ tip.doc.description }}</p>

          <!-- Default Value -->
          @if (tip.doc.defaultVal) {
            <div class="text-[10px] text-zinc-400 mt-2 font-mono pt-1.5 border-t border-zinc-800/80">
              Default: <span class="text-zinc-200 font-semibold">{{ tip.doc.defaultVal }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class InspectorComponent {
  readonly store = inject(EditorStore);
  private readonly storage = inject(StorageService);
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

  insertMarkupTag(propKey: string, tagStart: string, tagEnd: string = ''): void {
    const node = this.store.selectedNode();
    if (!node) return;
    const current = ((node as any)[propKey] as string) || '';
    const sample = tagEnd ? 'Sample' : '';
    const updated = current ? `${current}\n${tagStart}${sample}${tagEnd}` : `${tagStart}${sample}${tagEnd}`;
    this.updateProp(propKey, updated);
  }

  readonly treeRatio = signal<number>(this.getInitialTreeRatio());
  private isResizing = false;

  private getInitialTreeRatio(): number {
    const saved = this.storage.getItem('studio_tree_ratio');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 15 && parsed <= 75) {
        return parsed;
      }
    }
    return 36;
  }

  resetSplitter(): void {
    this.treeRatio.set(36);
    this.storage.setItem('studio_tree_ratio', '36');
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    const container = (event.currentTarget as HTMLElement).parentElement as HTMLElement;
    if (!container) return;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isResizing) return;
      const rect = container.getBoundingClientRect();
      const newHeight = moveEvent.clientY - rect.top;
      const percent = Math.min(75, Math.max(15, (newHeight / rect.height) * 100));
      this.treeRatio.set(Math.round(percent));
    };

    const onMouseUp = () => {
      this.isResizing = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      this.storage.setItem('studio_tree_ratio', String(this.treeRatio()));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  startTouchResize(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) return;
    this.isResizing = true;
    const container = (event.currentTarget as HTMLElement).parentElement as HTMLElement;
    if (!container) return;

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (!this.isResizing) return;
      const t = moveEvent.touches[0];
      if (!t) return;
      const rect = container.getBoundingClientRect();
      const newHeight = t.clientY - rect.top;
      const percent = Math.min(75, Math.max(15, (newHeight / rect.height) * 100));
      this.treeRatio.set(Math.round(percent));
    };

    const onTouchEnd = () => {
      this.isResizing = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      this.storage.setItem('studio_tree_ratio', String(this.treeRatio()));
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }

  readonly activeTooltip = signal<{
    doc: PropertyDoc;
    x: number;
    y: number;
  } | null>(null);

  private tooltipTimeout: any = null;

  showTooltip(event: MouseEvent, doc: PropertyDoc): void {
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 288;
    const estimatedHeight = 220;

    let x: number;
    let y = Math.max(16, Math.min(window.innerHeight - estimatedHeight - 16, rect.top - 8));

    if (rect.left > tooltipWidth + 24) {
      x = rect.left - tooltipWidth - 12;
    } else if (window.innerWidth - rect.right > tooltipWidth + 24) {
      x = rect.right + 12;
    } else {
      x = Math.max(16, (window.innerWidth - tooltipWidth) / 2);
      y = rect.bottom + 8;
      if (y + estimatedHeight > window.innerHeight - 16) {
        y = Math.max(16, rect.top - estimatedHeight - 8);
      }
    }

    this.activeTooltip.set({ doc, x, y });
  }

  hideTooltip(): void {
    this.tooltipTimeout = setTimeout(() => {
      this.activeTooltip.set(null);
    }, 120);
  }

  hideTooltipImmediately(): void {
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
    this.activeTooltip.set(null);
  }

  keepTooltipOpen(): void {
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
  }

  toggleTooltip(event: MouseEvent, doc: PropertyDoc): void {
    event.stopPropagation();
    if (this.activeTooltip()?.doc === doc) {
      this.hideTooltipImmediately();
    } else {
      this.showTooltip(event, doc);
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.activeTooltip()) {
      this.hideTooltipImmediately();
    }
  }

  readonly presetTextures: string[] = [
    'gui_formspec_bg.png',
    'gui_hb_bg.png',
    'default_chest_front.png',
    'default_wood.png',
    'default_stone.png',
    'heart.png',
    'bubble.png',
    'character.png',
    'item_sword.png',
    'spritesheet_sample.png',
  ];

  readonly validationErrors = computed<ValidationError[]>(() => {
    const node = this.store.selectedNode();
    if (!node) return [];
    return validateFormspecNode(node);
  });

  isMandatory(prop: string): boolean {
    const node = this.store.selectedNode();
    if (!node) return false;
    return isPropertyMandatory(node.type, prop);
  }

  isPropertyError(prop: string): boolean {
    return this.validationErrors().some((e) => e.property === prop && e.severity === 'error');
  }

  getPropertyErrorMessage(prop: string): string | undefined {
    const err = this.validationErrors().find((e) => e.property === prop);
    return err?.message;
  }

  getPropertyDoc(prop: string): PropertyDoc | undefined {
    return PROPERTY_DOCS[prop];
  }

  getTextureUrl(name?: string): string {
    return resolveTextureUrl(name);
  }

  isButtonElement(type: string): boolean {
    return [
      'button',
      'button_exit',
      'button_url',
      'button_url_exit',
      'image_button',
      'image_button_exit',
      'item_image_button',
    ].includes(type);
  }

  getPredefinedLocation(loc?: string): string {
    if (!loc) return 'current_player';
    if (['current_player', 'current_name', 'context'].includes(loc)) {
      return loc;
    }
    return 'custom';
  }

  isCustomLocation(loc?: string): boolean {
    return this.getPredefinedLocation(loc) === 'custom';
  }

  onLocationSelect(val: string): void {
    if (val === 'custom') {
      this.updateProp('inventoryLocation', 'nodemeta:0,0,0');
    } else {
      this.updateProp('inventoryLocation', val);
    }
  }

  getPredefinedList(listName?: string): string {
    if (!listName) return 'main';
    if (['main', 'craft', 'craftpreview', 'fuel', 'src', 'dst'].includes(listName)) {
      return listName;
    }
    return 'custom';
  }

  isCustomList(listName?: string): boolean {
    return this.getPredefinedList(listName) === 'custom';
  }

  onListSelect(val: string): void {
    if (val === 'custom') {
      this.updateProp('inventoryList', 'custom_list');
    } else {
      this.updateProp('inventoryList', val);
    }
  }

  selectFromTree(node: FormspecNode): void {
    this.store.selectNode(node.id);
  }

  deselectNode(): void {
    this.store.selectNode(null);
  }

  deleteFromTree(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.store.deleteNode(id);
  }

  reorder(event: MouseEvent, id: string, dir: 'up' | 'down'): void {
    event.stopPropagation();
    this.store.reorderNode(id, dir);
  }

  toggleHide(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.store.toggleHideNode(id);
  }

  toggleLock(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.store.toggleLockNode(id);
  }

  bringToFront(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.store.bringToFront(id);
  }

  sendToBack(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.store.sendToBack(id);
  }

  startScrub(prop: 'x' | 'y' | 'w' | 'h', event: MouseEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    const node = this.store.selectedNode();
    if (!node) return;

    const startX = event.clientX;
    const initialVal = node[prop] as number;
    const snap = this.store.snapStep();

    const onMouseMove = (e: MouseEvent) => {
      const deltaPx = e.clientX - startX;
      const stepCount = Math.round(deltaPx / 12);
      let nextVal = initialVal + stepCount * snap;
      if (prop === 'w' || prop === 'h') nextVal = Math.max(snap, nextVal);
      else nextVal = Math.max(0, nextVal);
      this.store.updateNode(node.id, { [prop]: Number(nextVal.toFixed(2)) });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  onMathInput(prop: 'x' | 'y' | 'w' | 'h', raw: string): void {
    const node = this.store.selectedNode();
    if (!node) return;
    try {
      const sanitized = raw.replace(/[^0-9.\-+*/ ]/g, '').trim();
      if (!sanitized) return;
      const computed = Function(`"use strict"; return (${sanitized});`)();
      if (typeof computed === 'number' && !isNaN(computed) && isFinite(computed)) {
        let finalVal = Math.round(computed * 100) / 100;
        if (prop === 'w' || prop === 'h') finalVal = Math.max(0.1, finalVal);
        else finalVal = Math.max(0, finalVal);
        this.store.updateNode(node.id, { [prop]: finalVal });
      }
    } catch {
      // keep current value
    }
  }

  updateProp(key: string, value: any): void {
    const node = this.store.selectedNode();
    if (!node) return;
    this.store.updateNode(node.id, { [key]: value });
  }

  updateCommaItems(val: string): void {
    const node = this.store.selectedNode();
    if (!node) return;
    const items = val.split(',').map((s) => s.trim());
    this.store.updateNode(node.id, { dropdownItems: items });
  }

  updateCanvasSize(w: number, h: number): void {
    this.store.updateSize(w, h);
  }

  toggleAllowClose(val: boolean): void {
    this.store.ast.update((c) => ({ ...c, allowClose: val }));
  }

  updatePositionX(x: any): void {
    const curY = this.store.ast().position?.y ?? 0.5;
    this.store.updatePosition(Number(x) || 0, curY);
  }

  updatePositionY(y: any): void {
    const curX = this.store.ast().position?.x ?? 0.5;
    this.store.updatePosition(curX, Number(y) || 0);
  }

  updateAnchorX(x: any): void {
    const curY = this.store.ast().anchor?.y ?? 0.5;
    this.store.updateAnchor(Number(x) || 0, curY);
  }

  updateAnchorY(y: any): void {
    const curX = this.store.ast().anchor?.x ?? 0.5;
    this.store.updateAnchor(curX, Number(y) || 0);
  }

  setPlacementPreset(posX: number, posY: number, ancX: number, ancY: number): void {
    this.store.updatePosition(posX, posY);
    this.store.updateAnchor(ancX, ancY);
  }

  isPlacementPresetActive(px: number, py: number): boolean {
    const pos = this.store.ast().position;
    const currentX = pos !== undefined ? pos.x : 0.5;
    const currentY = pos !== undefined ? pos.y : 0.5;
    return Math.abs(currentX - px) < 0.001 && Math.abs(currentY - py) < 0.001;
  }

  matchAnchorToPosition(): void {
    const pos = this.store.ast().position ?? { x: 0.5, y: 0.5 };
    this.store.updateAnchor(pos.x, pos.y);
  }

  resetPositionAndAnchor(): void {
    this.store.resetPositionAndAnchor();
  }

  updatePaddingX(x: any): void {
    const curY = this.store.ast().padding?.y ?? 0;
    this.store.updatePadding(Number(x) || 0, curY);
  }

  updatePaddingY(y: any): void {
    const curX = this.store.ast().padding?.x ?? 0;
    this.store.updatePadding(curX, Number(y) || 0);
  }

  toggleNoPrepend(val: boolean): void {
    this.store.toggleNoPrepend(val);
  }

  overflowResult(): OverflowResult {
    const bp = this.store.activeBreakpoint();
    const ast = this.store.ast();
    return checkFormspecOverflow(bp, {
      w: ast.size.w,
      h: ast.size.h,
      position: ast.position,
      anchor: ast.anchor,
    });
  }

  isRootOverflowing(): boolean {
    return this.overflowResult().isOverflowing;
  }

  getWidgetSpecVersion(type: string): number {
    switch (type) {
      case 'hypertip':
        return 11;
      case 'model':
        return 10;
      case 'label':
      case 'allow_close':
        return 9;
      case 'scroll_container':
        return 8;
      case 'animated_image':
      case 'image':
        return 6;
      case 'dropdown':
        return 4;
      case 'hypertext':
        return 3;
      case 'background9':
      case 'tabheader':
        return 2;
      default:
        return 1;
    }
  }

  getWidgetEngineVersion(type: string): string {
    switch (type) {
      case 'hypertip':
        return '5.17.0+';
      case 'model':
        return '5.13.0+';
      case 'allow_close':
        return '5.12.0+';
      case 'scroll_container':
        return '5.10.0+';
      case 'animated_image':
      case 'image':
        return '5.6.0+';
      case 'dropdown':
        return '5.4.0+';
      case 'hypertext':
        return '5.2.0+';
      case 'background9':
      case 'tabheader':
        return '5.1.0+';
      default:
        return '0.4.x+';
    }
  }
}
