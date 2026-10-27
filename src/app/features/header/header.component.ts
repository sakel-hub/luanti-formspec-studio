import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorStore } from '../../core/state/editor.store';
import {
  LucideRotateCcw,
  LucideRotateCw,
  LucideSmartphone,
  LucideTablet,
  LucideMonitor,
  LucideSparkles,
  LucideCode,
} from '@lucide/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideRotateCcw,
    LucideRotateCw,
    LucideSmartphone,
    LucideTablet,
    LucideMonitor,
    LucideSparkles,
    LucideCode,
  ],
  template: `
    <header class="h-13 bg-[#18181c] border-b border-[#282830] px-3 sm:px-4 flex items-center justify-between text-xs select-none shrink-0 z-20">
      <!-- Left: Logo & Project Info -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <img src="logo.svg" alt="Formspec Studio" class="w-7 h-7 rounded-md" />
          <div class="hidden sm:block">
            <div class="font-bold text-zinc-100 flex items-center gap-1.5 leading-tight">
              <span>Formspec Studio</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                v7
              </span>
            </div>
            <div class="text-[10px] text-zinc-400 font-mono">
              {{ store.projectName() }} ({{ store.ast().size.w }}×{{ store.ast().size.h }} slots)
            </div>
          </div>
        </div>

        <!-- Template Picker Trigger -->
        <button
          (click)="store.openTemplateModal()"
          class="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition flex items-center gap-1.5 font-medium shadow-sm active:scale-95"
          title="Choose Template"
        >
          <svg lucideSparkles class="w-3.5 h-3.5 text-amber-400"></svg>
          <span class="hidden md:inline">Templates</span>
        </button>
      </div>

      <!-- Center: Responsive Breakpoint Switcher -->
      <div class="flex items-center bg-[#121214] p-1 rounded-lg border border-zinc-800 text-xs">
        <button
          (click)="store.setBreakpoint('mobile')"
          [class.bg-emerald-600]="store.activeBreakpoint() === 'mobile'"
          [class.text-white]="store.activeBreakpoint() === 'mobile'"
          [class.text-zinc-400]="store.activeBreakpoint() !== 'mobile'"
          class="px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5"
          title="Mobile Breakpoint (< 14 slots / Touch)"
        >
          <svg lucideSmartphone class="w-3.5 h-3.5"></svg>
          <span class="hidden lg:inline">Mobile (390px)</span>
        </button>

        <button
          (click)="store.setBreakpoint('tablet')"
          [class.bg-emerald-600]="store.activeBreakpoint() === 'tablet'"
          [class.text-white]="store.activeBreakpoint() === 'tablet'"
          [class.text-zinc-400]="store.activeBreakpoint() !== 'tablet'"
          class="px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5"
          title="Tablet Breakpoint (14-18 slots)"
        >
          <svg lucideTablet class="w-3.5 h-3.5"></svg>
          <span class="hidden lg:inline">Tablet (768px)</span>
        </button>

        <button
          (click)="store.setBreakpoint('desktop')"
          [class.bg-emerald-600]="store.activeBreakpoint() === 'desktop'"
          [class.text-white]="store.activeBreakpoint() === 'desktop'"
          [class.text-zinc-400]="store.activeBreakpoint() !== 'desktop'"
          class="px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5"
          title="Desktop Breakpoint (> 18 slots)"
        >
          <svg lucideMonitor class="w-3.5 h-3.5"></svg>
          <span class="hidden lg:inline">Desktop (100%)</span>
        </button>
      </div>

      <!-- Right: Snap, Undo/Redo & Code Export -->
      <div class="flex items-center gap-2">
        <!-- Snap Selector -->
        <div class="hidden sm:flex items-center gap-1 bg-[#121214] px-2 py-1 rounded-lg border border-zinc-800 text-[11px]">
          <span class="text-zinc-500 font-mono">Snap:</span>
          <select
            [ngModel]="store.snapStep()"
            (ngModelChange)="store.setSnapStep($event)"
            class="bg-transparent text-emerald-400 font-mono border-none focus:outline-none cursor-pointer"
          >
            <option [value]="0.1" class="bg-zinc-900 text-zinc-200">0.1s</option>
            <option [value]="0.25" class="bg-zinc-900 text-zinc-200">0.25s</option>
            <option [value]="0.5" class="bg-zinc-900 text-zinc-200">0.5s</option>
            <option [value]="1.0" class="bg-zinc-900 text-zinc-200">1.0s</option>
          </select>
        </div>

        <!-- Undo / Redo -->
        <div class="flex items-center">
          <button
            (click)="store.undo()"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            title="Undo (Ctrl+Z)"
          >
            <svg lucideRotateCcw class="w-4 h-4"></svg>
          </button>
          <button
            (click)="store.redo()"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg lucideRotateCw class="w-4 h-4"></svg>
          </button>
        </div>

        <!-- Export Lua Mod Trigger -->
        <button
          (click)="store.setActiveTab('code')"
          class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
        >
          <svg lucideCode class="w-3.5 h-3.5"></svg>
          <span>Export Lua</span>
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly store = inject(EditorStore);
}
