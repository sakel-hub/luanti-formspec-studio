import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStore } from '../../core/state/editor.store';
import { TemplateRegistryService } from '../../core/services/template-registry.service';
import { LucideX, LucideFolderGit2, LucideSparkles } from '@lucide/angular';

@Component({
  selector: 'app-template-modal',
  standalone: true,
  imports: [CommonModule, LucideX, LucideFolderGit2, LucideSparkles],
  template: `
    <div
      *ngIf="store.isTemplateModalOpen()"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in"
      (click)="store.closeTemplateModal()"
    >
      <div
        class="bg-[#18181c] border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <svg lucideFolderGit2 class="w-4 h-4"></svg>
            </div>
            <div>
              <h2 class="text-sm font-bold text-zinc-100">Choose Starter Template</h2>
              <p class="text-xs text-zinc-400">Pre-configured Formspec v7 responsive templates to jumpstart your mod</p>
            </div>
          </div>
          <button
            (click)="store.closeTemplateModal()"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <svg lucideX class="w-4 h-4"></svg>
          </button>
        </div>

        <!-- Template Grid -->
        <div class="p-5 overflow-y-auto custom-scrollbar space-y-3 flex-1">
          @for (tmpl of templates; track tmpl.id) {
            <div
              (click)="selectTemplate(tmpl.id)"
              class="group p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/60 hover:bg-zinc-900 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-emerald-950/20"
            >
              <div class="space-y-1 max-w-lg">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors">
                    {{ tmpl.title }}
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {{ tmpl.badge }}
                  </span>
                </div>
                <p class="text-xs text-zinc-400 leading-relaxed">
                  {{ tmpl.description }}
                </p>
                <div class="text-[10px] text-zinc-500">
                  Pattern by: <span class="text-zinc-400">{{ tmpl.author }}</span>
                </div>
              </div>

              <button
                class="px-3 py-1.5 rounded-lg bg-zinc-800 group-hover:bg-emerald-600 text-zinc-300 group-hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <svg lucideSparkles class="w-3.5 h-3.5"></svg>
                <span>Use Template</span>
              </button>
            </div>
          }
        </div>

        <!-- Modal Footer -->
        <div class="px-5 py-3 border-t border-zinc-800 bg-[#141418] flex items-center justify-between text-xs text-zinc-500">
          <span>All templates fully support Real Coordinates & Formspec Version 7</span>
          <button
            (click)="store.closeTemplateModal()"
            class="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
})
export class TemplateModalComponent {
  readonly store = inject(EditorStore);
  private readonly templateRegistry = inject(TemplateRegistryService);

  readonly templates = this.templateRegistry.getTemplates();

  selectTemplate(id: string): void {
    this.store.loadTemplate(id);
  }
}
