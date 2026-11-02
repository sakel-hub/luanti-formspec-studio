import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorStore } from '../../core/state/editor.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import {
  LucideKeyboard,
  LucideX,
  LucideSearch,
  LucideNavigation,
  LucideMousePointer,
  LucideLayoutGrid,
  LucideLayers,
} from '@lucide/angular';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'canvas' | 'editing' | 'layout' | 'project';
}

@Component({
  selector: 'app-shortcuts-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    LucideKeyboard,
    LucideX,
    LucideSearch,
    LucideNavigation,
    LucideMousePointer,
    LucideLayoutGrid,
    LucideLayers,
  ],
  template: `
    @if (store.isShortcutsModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in"
        (click)="onBackdropClick($event)"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-dialog-title"
          class="relative w-full max-w-3xl max-h-[85vh] bg-[#18181c] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
          (click)="$event.stopPropagation()"
        >
          <!-- Dialog Header -->
          <div class="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg lucideKeyboard class="w-5 h-5"></svg>
              </div>
              <div>
                <h3 id="shortcuts-dialog-title" class="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <span>{{ 'shortcuts.title' | translate }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Hotkeys
                  </span>
                </h3>
                <p class="text-xs text-zinc-400">
                  {{ 'shortcuts.subtitle' | translate }}
                </p>
              </div>
            </div>

            <!-- Close Button -->
            <button
              (click)="store.closeShortcutsModal()"
              class="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition flex items-center justify-center"
              title="Close (Esc)"
              aria-label="Close shortcuts"
            >
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          </div>

          <!-- Search Filter Bar -->
          <div class="px-5 py-3 border-b border-zinc-800/60 bg-[#141416] flex items-center gap-2">
            <svg lucideSearch class="w-4 h-4 text-zinc-500"></svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search shortcuts (e.g. pan, zoom, duplicate, align)..."
              class="bg-transparent border-none text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none w-full"
            />
            @if (searchQuery()) {
              <button
                (click)="searchQuery.set('')"
                class="text-zinc-500 hover:text-zinc-300 text-xs px-1"
              >
                Clear
              </button>
            }
          </div>

          <!-- Shortcuts List (Categorized Cards) -->
          <div class="flex-1 overflow-y-auto p-5 space-y-6">
            <!-- Canvas & Navigation -->
            @if (filterCategory('canvas').length > 0) {
              <div>
                <div class="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5">
                  <svg lucideNavigation class="w-3.5 h-3.5"></svg>
                  <span>{{ 'shortcuts.catCanvas' | translate }}</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  @for (sc of filterCategory('canvas'); track sc.description) {
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700 transition">
                      <span class="text-xs text-zinc-300">{{ sc.description }}</span>
                      <div class="flex items-center gap-1">
                        @for (k of sc.keys; track k) {
                          <kbd class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-zinc-200 shadow-inner">
                            {{ k }}
                          </kbd>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Selection & Editing -->
            @if (filterCategory('editing').length > 0) {
              <div>
                <div class="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5">
                  <svg lucideMousePointer class="w-3.5 h-3.5"></svg>
                  <span>{{ 'shortcuts.catEditing' | translate }}</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  @for (sc of filterCategory('editing'); track sc.description) {
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700 transition">
                      <span class="text-xs text-zinc-300">{{ sc.description }}</span>
                      <div class="flex items-center gap-1">
                        @for (k of sc.keys; track k) {
                          <kbd class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-zinc-200 shadow-inner">
                            {{ k }}
                          </kbd>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Layout & Alignment -->
            @if (filterCategory('layout').length > 0) {
              <div>
                <div class="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5">
                  <svg lucideLayoutGrid class="w-3.5 h-3.5"></svg>
                  <span>{{ 'shortcuts.catLayout' | translate }}</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  @for (sc of filterCategory('layout'); track sc.description) {
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700 transition">
                      <span class="text-xs text-zinc-300">{{ sc.description }}</span>
                      <div class="flex items-center gap-1">
                        @for (k of sc.keys; track k) {
                          <kbd class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-zinc-200 shadow-inner">
                            {{ k }}
                          </kbd>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Project & Prototyping -->
            @if (filterCategory('project').length > 0) {
              <div>
                <div class="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5">
                  <svg lucideLayers class="w-3.5 h-3.5"></svg>
                  <span>{{ 'shortcuts.catProject' | translate }}</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  @for (sc of filterCategory('project'); track sc.description) {
                    <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700 transition">
                      <span class="text-xs text-zinc-300">{{ sc.description }}</span>
                      <div class="flex items-center gap-1">
                        @for (k of sc.keys; track k) {
                          <kbd class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-zinc-200 shadow-inner">
                            {{ k }}
                          </kbd>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Dialog Footer -->
          <div class="px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400">
            <span class="font-mono text-[11px]">Pro tip: Hold Shift with Arrow keys to nudge in 1.0s increments</span>
            <button
              (click)="store.closeShortcutsModal()"
              class="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
            >
              {{ 'common.close' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ShortcutsDialogComponent {
  readonly store = inject(EditorStore);
  readonly searchQuery = signal('');

  private readonly shortcuts: ShortcutItem[] = [
    // Canvas
    { keys: ['Space', 'Drag'], description: 'Pan Canvas View', category: 'canvas' },
    { keys: ['Middle Click', 'Drag'], description: 'Pan Canvas View', category: 'canvas' },
    { keys: ['Wheel'], description: 'Zoom In / Out', category: 'canvas' },
    { keys: ['Ctrl / ⌘', '0'], description: 'Reset Zoom (100%)', category: 'canvas' },
    { keys: ['Ctrl / ⌘', '~'], description: 'Toggle Debug Console', category: 'canvas' },

    // Editing
    { keys: ['Click'], description: 'Select Widget', category: 'editing' },
    { keys: ['Shift', 'Click'], description: 'Add to Multi-Selection', category: 'editing' },
    { keys: ['Esc'], description: 'Deselect All / Cancel', category: 'editing' },
    { keys: ['Ctrl / ⌘', 'A'], description: 'Select All Widgets', category: 'editing' },
    { keys: ['Ctrl / ⌘', 'D'], description: 'Duplicate Selected', category: 'editing' },
    { keys: ['Alt', 'Drag'], description: 'Duplicate on Drag', category: 'editing' },
    { keys: ['Delete / Backspace'], description: 'Delete Selected', category: 'editing' },
    { keys: ['Arrow Keys'], description: 'Nudge 0.1s', category: 'editing' },
    { keys: ['Shift', 'Arrow Keys'], description: 'Nudge 1.0s', category: 'editing' },

    // Layout
    { keys: ['Alt', 'A'], description: 'Align Left', category: 'layout' },
    { keys: ['Alt', 'D'], description: 'Align Right', category: 'layout' },
    { keys: ['Alt', 'W'], description: 'Align Top', category: 'layout' },
    { keys: ['Alt', 'S'], description: 'Align Bottom', category: 'layout' },
    { keys: ['Alt', 'H'], description: 'Distribute Horizontally', category: 'layout' },
    { keys: ['Alt', 'V'], description: 'Distribute Vertically', category: 'layout' },

    // Project
    { keys: ['Ctrl / ⌘', 'Z'], description: 'Undo Last Action', category: 'project' },
    { keys: ['Ctrl / ⌘', 'Shift', 'Z'], description: 'Redo Action', category: 'project' },
    { keys: ['Ctrl / ⌘', 'Y'], description: 'Redo Action', category: 'project' },
    { keys: ['Ctrl / ⌘', 'S'], description: 'Auto-saved locally', category: 'project' },
    { keys: ['Ctrl / ⌘', 'E'], description: 'Export Lua Mod', category: 'project' },
  ];

  filterCategory(cat: 'canvas' | 'editing' | 'layout' | 'project'): ShortcutItem[] {
    const q = this.searchQuery().trim().toLowerCase();
    return this.shortcuts.filter((sc) => {
      if (sc.category !== cat) return false;
      if (!q) return true;
      return (
        sc.description.toLowerCase().includes(q) ||
        sc.keys.some((k) => k.toLowerCase().includes(q))
      );
    });
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.store.isShortcutsModalOpen()) {
      this.store.closeShortcutsModal();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.store.closeShortcutsModal();
    }
  }
}
