import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStore } from '../../core/state/editor.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import {
  LucideShare2,
  LucideX,
  LucideCopy,
  LucideCheck,
  LucideCode,
  LucideSparkles,
} from '@lucide/angular';

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    LucideShare2,
    LucideX,
    LucideCopy,
    LucideCheck,
    LucideCode,
    LucideSparkles,
  ],
  template: `
    @if (store.isShareModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in"
        (click)="onBackdropClick($event)"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-dialog-title"
          class="relative w-full max-w-2xl max-h-[85vh] bg-[#18181c] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
          (click)="$event.stopPropagation()"
        >
          <!-- Dialog Header -->
          <div class="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg lucideShare2 class="w-5 h-5"></svg>
              </div>
              <div>
                <h3 id="share-dialog-title" class="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <span>{{ 'share.title' | translate }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Permalink
                  </span>
                </h3>
                <p class="text-xs text-zinc-400">
                  {{ 'share.subtitle' | translate }}
                </p>
              </div>
            </div>

            <!-- Close Button -->
            <button
              (click)="store.closeShareModal()"
              class="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition flex items-center justify-center"
              title="Close (Esc)"
              aria-label="Close share"
            >
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          </div>

          <!-- Dialog Body -->
          <div class="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-zinc-300">
            <!-- Shareable URL -->
            <div class="space-y-2">
              <label class="font-semibold text-zinc-200 flex items-center justify-between">
                <span>{{ 'share.shareUrl' | translate }}</span>
                <span class="text-[10px] text-zinc-400 font-mono">Self-contained hash link</span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [value]="getShareUrl()"
                  readonly
                  class="flex-1 bg-black/50 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200 font-mono text-xs focus:outline-none select-all"
                  #urlInput
                  (focus)="urlInput.select()"
                />
                <button
                  (click)="copyLink(urlInput.value)"
                  [class.bg-emerald-600]="copiedLink()"
                  [class.bg-zinc-800]="!copiedLink()"
                  class="px-3.5 py-2 rounded-lg font-medium text-xs text-white transition flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
                >
                  @if (copiedLink()) {
                    <svg lucideCheck class="w-4 h-4"></svg>
                    <span>{{ 'common.copied' | translate }}</span>
                  } @else {
                    <svg lucideCopy class="w-4 h-4"></svg>
                    <span>{{ 'share.copyLink' | translate }}</span>
                  }
                </button>
              </div>
              <p class="text-[11px] text-zinc-400 leading-relaxed">
                {{ 'share.discordTip' | translate }}
              </p>
            </div>

            <!-- Raw Formspec Preview -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <svg lucideCode class="w-3.5 h-3.5 text-emerald-400"></svg>
                  <span>{{ 'share.rawFormspec' | translate }}</span>
                </label>
                <button
                  (click)="copyFormspec()"
                  class="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center gap-1.5"
                >
                  @if (copiedFormspec()) {
                    <svg lucideCheck class="w-3.5 h-3.5 text-emerald-400"></svg>
                    <span class="text-emerald-400">{{ 'common.copied' | translate }}</span>
                  } @else {
                    <svg lucideCopy class="w-3.5 h-3.5"></svg>
                    <span>{{ 'common.copy' | translate }}</span>
                  }
                </button>
              </div>

              <pre class="max-h-48 p-3 rounded-lg bg-black/60 border border-zinc-800 text-emerald-300 font-mono text-[11px] overflow-auto select-all leading-relaxed whitespace-pre-wrap">{{ store.serializedFormspec() }}</pre>
            </div>

            <!-- Helpful Callout -->
            <div class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-2.5 text-zinc-400">
              <svg lucideSparkles class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></svg>
              <div class="text-[11px] leading-relaxed">
                Formspec Studio stores the entire AST configuration inside the URL hash. No database or external server is required—recipients can immediately preview and edit your formspec layout!
              </div>
            </div>
          </div>

          <!-- Dialog Footer -->
          <div class="px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-end">
            <button
              (click)="store.closeShareModal()"
              class="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition"
            >
              {{ 'common.close' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ShareDialogComponent {
  readonly store = inject(EditorStore);
  readonly copiedLink = signal(false);
  readonly copiedFormspec = signal(false);

  getShareUrl(): string {
    return this.store.generateShareUrl();
  }

  async copyLink(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.copiedLink.set(true);
      setTimeout(() => this.copiedLink.set(false), 2500);
    } catch {
      // Fallback
    }
  }

  async copyFormspec(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.store.serializedFormspec());
      this.copiedFormspec.set(true);
      setTimeout(() => this.copiedFormspec.set(false), 2500);
    } catch {
      // Fallback
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.store.isShareModalOpen()) {
      this.store.closeShareModal();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.store.closeShareModal();
    }
  }
}
