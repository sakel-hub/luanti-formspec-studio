import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStore } from '../../core/state/editor.store';
import { LucideCopy, LucideCheck, LucideDownload, LucideCode, LucideFileText } from '@lucide/angular';

@Component({
  selector: 'app-code-view',
  standalone: true,
  imports: [CommonModule, LucideCopy, LucideCheck, LucideDownload, LucideCode, LucideFileText],
  template: `
    <div class="h-full flex flex-col bg-[#141418] text-xs font-mono select-text overflow-hidden">
      <!-- Top Action Bar -->
      <div class="h-12 px-4 border-b border-zinc-800 bg-[#18181c] flex items-center justify-between shrink-0 select-none">
        <div class="flex items-center gap-2">
          <button
            (click)="viewMode.set('lua')"
            [class.bg-emerald-600]="viewMode() === 'lua'"
            [class.text-white]="viewMode() === 'lua'"
            [class.text-zinc-400]="viewMode() !== 'lua'"
            class="px-2.5 py-1 rounded-md transition flex items-center gap-1.5"
          >
            <svg lucideCode class="w-3.5 h-3.5"></svg>
            <span>Responsive Lua Mod</span>
          </button>

          <button
            (click)="viewMode.set('raw')"
            [class.bg-emerald-600]="viewMode() === 'raw'"
            [class.text-white]="viewMode() === 'raw'"
            [class.text-zinc-400]="viewMode() !== 'raw'"
            class="px-2.5 py-1 rounded-md transition flex items-center gap-1.5"
          >
            <svg lucideFileText class="w-3.5 h-3.5"></svg>
            <span>Raw Formspec</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="copyCode()"
            class="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition flex items-center gap-1.5 text-xs shadow-sm"
          >
            @if (copied()) {
              <svg lucideCheck class="w-3.5 h-3.5 text-emerald-400"></svg>
              <span class="text-emerald-400">Copied!</span>
            } @else {
              <svg lucideCopy class="w-3.5 h-3.5"></svg>
              <span>Copy</span>
            }
          </button>

          <button
            (click)="downloadFile()"
            class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition flex items-center gap-1.5 text-xs shadow-sm"
          >
            <svg lucideDownload class="w-3.5 h-3.5"></svg>
            <span>Download</span>
          </button>
        </div>
      </div>

      <!-- Code Content -->
      <div class="flex-1 overflow-auto custom-scrollbar p-4 bg-[#0e0e12]">
        <pre class="text-zinc-300 text-xs leading-relaxed font-mono"><code>{{ activeCodeText() }}</code></pre>
      </div>

      <!-- Responsive Hint Footer -->
      <div class="px-4 py-2 border-t border-zinc-800 bg-[#16161a] text-[11px] text-zinc-400 flex items-center justify-between select-none">
        <span>Generates core.get_player_window_information telemetry checks for mobile & desktop</span>
        <span class="text-emerald-400 font-semibold">Formspec v7 Ready</span>
      </div>
    </div>
  `,
})
export class CodeViewComponent {
  readonly store = inject(EditorStore);
  readonly viewMode = signal<'lua' | 'raw'>('lua');
  readonly copied = signal<boolean>(false);

  activeCodeText(): string {
    return this.viewMode() === 'lua'
      ? this.store.generatedLuaMod()
      : this.store.serializedFormspec();
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
