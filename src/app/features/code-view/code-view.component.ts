import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStore } from '../../core/state/editor.store';
import {
  LucideCopy,
  LucideCheck,
  LucideDownload,
  LucideCode,
  LucideFileText,
  LucideArrowLeft,
  LucideX,
} from '@lucide/angular';
import { highlightLua, highlightFormspec } from '../../core/utils/syntax-highlighter.utils';

@Component({
  selector: 'app-code-view',
  standalone: true,
  imports: [
    CommonModule,
    LucideCopy,
    LucideCheck,
    LucideDownload,
    LucideCode,
    LucideFileText,
    LucideArrowLeft,
    LucideX,
  ],
  template: `
    <div class="h-full flex flex-col bg-[#111115] text-xs font-mono select-text overflow-hidden">
      <!-- Top Action Bar -->
      <div class="h-12 px-3 sm:px-4 border-b border-zinc-800 bg-[#16161a] flex items-center justify-between shrink-0 select-none gap-2">
        <!-- Left: Prominent Back to Canvas / Close Button -->
        <div class="flex items-center gap-2">
          <button
            (click)="closeCodeView()"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md active:scale-95 text-xs group"
            title="Return to visual WYSIWYG canvas (Esc)"
          >
            <svg lucideArrowLeft class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"></svg>
            <span>Back to Canvas</span>
            <kbd class="hidden sm:inline px-1 bg-emerald-800/80 rounded text-[10px] font-mono text-emerald-200">Esc</kbd>
          </button>

          <!-- Mode Toggles: Lua Mod vs Raw Formspec -->
          <div class="flex items-center bg-[#121214] p-0.5 rounded-lg border border-zinc-800">
            <button
              (click)="viewMode.set('lua')"
              [class.bg-zinc-800]="viewMode() === 'lua'"
              [class.text-emerald-400]="viewMode() === 'lua'"
              [class.text-zinc-400]="viewMode() !== 'lua'"
              class="px-2.5 py-1 rounded-md transition flex items-center gap-1.5 font-medium"
            >
              <svg lucideCode class="w-3.5 h-3.5"></svg>
              <span>init.lua</span>
            </button>

            <button
              (click)="viewMode.set('raw')"
              [class.bg-zinc-800]="viewMode() === 'raw'"
              [class.text-emerald-400]="viewMode() === 'raw'"
              [class.text-zinc-400]="viewMode() !== 'raw'"
              class="px-2.5 py-1 rounded-md transition flex items-center gap-1.5 font-medium"
            >
              <svg lucideFileText class="w-3.5 h-3.5"></svg>
              <span>Raw Formspec</span>
            </button>
          </div>
        </div>

        <!-- Right: Copy & Download Actions -->
        <div class="flex items-center gap-2">
          <button
            (click)="copyCode()"
            class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition flex items-center gap-1.5 text-xs shadow-sm border border-zinc-700/60 active:scale-95"
          >
            @if (copied()) {
              <svg lucideCheck class="w-3.5 h-3.5 text-emerald-400"></svg>
              <span class="text-emerald-400 font-medium">Copied!</span>
            } @else {
              <svg lucideCopy class="w-3.5 h-3.5 text-zinc-400"></svg>
              <span>Copy</span>
            }
          </button>

          <button
            (click)="downloadFile()"
            class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition flex items-center gap-1.5 text-xs shadow-sm border border-zinc-700/60 active:scale-95"
          >
            <svg lucideDownload class="w-3.5 h-3.5 text-emerald-400"></svg>
            <span>Download</span>
          </button>

          <!-- Quick Close "X" Button -->
          <button
            (click)="closeCodeView()"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
            title="Close Code View"
          >
            <svg lucideX class="w-4 h-4"></svg>
          </button>
        </div>
      </div>

      <!-- Code Content with Line Numbers & Syntax Highlighting -->
      <div class="flex-1 overflow-auto custom-scrollbar flex bg-[#0c0c10] text-xs">
        <!-- Line Numbers Gutter -->
        <div class="py-4 pl-3 pr-3 text-right text-zinc-600 select-none bg-[#09090d] border-r border-zinc-900 font-mono shrink-0 leading-relaxed text-[11px]">
          @for (n of lineCountArray(); track $index) {
            <div>{{ $index + 1 }}</div>
          }
        </div>

        <!-- Syntax Highlighted Code Body -->
        <div class="flex-1 p-4 overflow-x-auto min-w-0">
          <pre class="font-mono text-xs leading-relaxed whitespace-pre text-zinc-200"><code [innerHTML]="highlightedCode()"></code></pre>
        </div>
      </div>

      <!-- Responsive Hint Footer Bar -->
      <div class="px-4 py-2 border-t border-zinc-800/80 bg-[#141418] text-[11px] text-zinc-400 flex items-center justify-between select-none">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Real-time Luanti Lua Mod Generator • Automatically updates on canvas edits</span>
        </div>
        <div class="flex items-center gap-3 font-mono">
          <span class="text-zinc-500">{{ lineCountArray().length }} lines</span>
          <span class="text-emerald-400 font-semibold">Formspec v{{ store.ast().version || 7 }}</span>
        </div>
      </div>
    </div>
  `,
})
export class CodeViewComponent {
  readonly store = inject(EditorStore);
  readonly viewMode = signal<'lua' | 'raw'>('lua');
  readonly copied = signal<boolean>(false);

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.store.activeTab() === 'code') {
      this.closeCodeView();
    }
  }

  activeCodeText(): string {
    return this.viewMode() === 'lua'
      ? this.store.generatedLuaMod()
      : this.store.serializedFormspec();
  }

  readonly highlightedCode = computed(() => {
    const raw = this.activeCodeText();
    return this.viewMode() === 'lua' ? highlightLua(raw) : highlightFormspec(raw);
  });

  readonly lineCountArray = computed(() => {
    const lines = this.activeCodeText().split('\n');
    return Array.from({ length: lines.length });
  });

  closeCodeView(): void {
    this.store.setActiveTab('canvas');
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.activeCodeText()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  downloadFile(): void {
    const filename = this.viewMode() === 'lua' ? 'init.lua' : `${this.store.projectName()}.txt`;
    const blob = new Blob([this.activeCodeText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
