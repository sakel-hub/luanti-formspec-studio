import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorStore } from '../../core/state/editor.store';
import { TemplateRegistryService } from '../../core/services/template-registry.service';
import {
  LucideX,
  LucideFolderGit2,
  LucideSparkles,
  LucidePlus,
  LucideTrash2,
  LucideCopy,
  LucideDownload,
  LucideUpload,
  LucideFileText,
  LucideCheck,
  LucideCode,
  LucideSearch,
} from '@lucide/angular';

@Component({
  selector: 'app-template-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideX,
    LucideFolderGit2,
    LucideSparkles,
    LucidePlus,
    LucideTrash2,
    LucideCopy,
    LucideDownload,
    LucideUpload,
    LucideFileText,
    LucideCheck,
    LucideCode,
    LucideSearch,
  ],
  template: `
    <div
      *ngIf="store.isProjectsModalOpen()"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in"
      (click)="store.closeProjectsModal()"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="projects-modal-title"
        class="bg-[#18181c] border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header with Tab Navigation -->
        <div class="px-5 pt-4 pb-3 border-b border-zinc-800 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20"
              >
                <svg lucideFolderGit2 class="w-4 h-4"></svg>
              </div>
              <div>
                <h2 id="projects-modal-title" class="text-sm font-bold text-zinc-100">Projects & Templates Hub</h2>
                <p class="text-xs text-zinc-400">
                  Save, manage, import, and load Luanti formspec projects
                </p>
              </div>
            </div>
            <button
              (click)="store.closeProjectsModal()"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          </div>

          <!-- Navigation Tabs -->
          <div
            class="flex items-center gap-2 bg-[#121214] p-1 rounded-xl border border-zinc-800/80 text-xs font-medium"
          >
            <button
              (click)="setTab('projects')"
              [class.bg-emerald-600]="store.projectsModalTab() === 'projects'"
              [class.text-white]="store.projectsModalTab() === 'projects'"
              [class.text-zinc-400]="store.projectsModalTab() !== 'projects'"
              class="flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg lucideFileText class="w-3.5 h-3.5"></svg>
              <span>My Projects ({{ store.projects().length }})</span>
            </button>

            <button
              (click)="setTab('templates')"
              [class.bg-emerald-600]="store.projectsModalTab() === 'templates'"
              [class.text-white]="store.projectsModalTab() === 'templates'"
              [class.text-zinc-400]="store.projectsModalTab() !== 'templates'"
              class="flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg lucideSparkles class="w-3.5 h-3.5"></svg>
              <span>Starter Templates ({{ templates.length }})</span>
            </button>

            <button
              (click)="setTab('import')"
              [class.bg-emerald-600]="store.projectsModalTab() === 'import'"
              [class.text-white]="store.projectsModalTab() === 'import'"
              [class.text-zinc-400]="store.projectsModalTab() !== 'import'"
              class="flex-1 py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg lucideUpload class="w-3.5 h-3.5"></svg>
              <span>Import Formspec</span>
            </button>
          </div>
        </div>

        <!-- Error / Info Banner -->
        @if (errorMessage()) {
          <div
            class="px-5 py-2 bg-red-950/80 border-b border-red-800 text-red-200 text-xs flex items-center justify-between"
          >
            <span>{{ errorMessage() }}</span>
            <button
              (click)="errorMessage.set(null)"
              class="p-1 rounded text-red-400 hover:text-white hover:bg-red-900/50 transition"
              aria-label="Dismiss error"
            >
              <svg lucideX class="w-3.5 h-3.5"></svg>
            </button>
          </div>
        }

        <!-- Tab 1: MY PROJECTS -->
        @if (store.projectsModalTab() === 'projects') {
          <div class="p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1">
            <!-- Create New Blank Project Section -->
            <div class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <svg lucidePlus class="w-3.5 h-3.5 text-emerald-400"></svg>
                  Create New Blank Project
                </span>
                <span class="text-[10px] text-zinc-500 font-mono">Custom Dimensions</span>
              </div>

              <div class="flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  [(ngModel)]="newProjectName"
                  placeholder="Project name (e.g. inventory_gui)"
                  class="flex-1 min-w-44 px-3 py-1.5 rounded-lg bg-black/40 border border-zinc-700/80 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />

                <div
                  class="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-zinc-700/80 font-mono text-xs"
                >
                  <span class="text-zinc-500">W:</span>
                  <input
                    type="number"
                    [(ngModel)]="newProjectW"
                    min="3"
                    max="30"
                    class="w-12 bg-transparent text-emerald-400 text-center focus:outline-none"
                  />
                  <span class="text-zinc-500">H:</span>
                  <input
                    type="number"
                    [(ngModel)]="newProjectH"
                    min="3"
                    max="30"
                    class="w-12 bg-transparent text-emerald-400 text-center focus:outline-none"
                  />
                  <span class="text-zinc-500 text-[10px]">slots</span>
                </div>

                <button
                  (click)="handleCreateProject()"
                  class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
                >
                  <svg lucidePlus class="w-3.5 h-3.5"></svg>
                  <span>Create Project</span>
                </button>
              </div>
            </div>

            <!-- Saved Projects List -->
            <div class="space-y-2">
              <div class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
                Saved Projects in Browser Storage
              </div>

              @if (store.projects().length === 0) {
                <div class="p-8 text-center text-zinc-500 rounded-xl border border-zinc-800/80">
                  No saved projects found. Create a project above or choose a starter template!
                </div>
              }

              @for (proj of store.projects(); track proj.id) {
                <div
                  [class.border-emerald-500]="proj.id === store.currentProjectId()"
                  [class.bg-emerald-950/15]="proj.id === store.currentProjectId()"
                  class="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between gap-3"
                >
                  <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-zinc-100 text-xs truncate">
                        {{ proj.name }}
                      </span>
                      @if (proj.id === store.currentProjectId()) {
                        <span
                          class="px-2 py-0.2 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700/80 font-mono text-[9px] font-bold flex items-center gap-1"
                        >
                          <span
                            class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                          ></span>
                          Active
                        </span>
                      }
                    </div>
                    <div class="text-[10px] text-zinc-400 font-mono flex items-center gap-3">
                      <span>{{ proj.dimensions.w }}×{{ proj.dimensions.h }} slots</span>
                      <span>•</span>
                      <span>{{ proj.widgetCount }} widgets</span>
                      <span>•</span>
                      <span class="text-zinc-500">{{ formatDate(proj.updatedAt) }}</span>
                    </div>
                  </div>

                  <!-- Actions per project card -->
                  <div class="flex items-center gap-1.5 shrink-0">
                    @if (proj.id !== store.currentProjectId()) {
                      <button
                        (click)="store.switchProject(proj.id)"
                        class="px-2.5 py-1.2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                      >
                        Open
                      </button>
                    }

                    <button
                      (click)="store.duplicateProject(proj.id)"
                      class="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                      title="Duplicate Project"
                    >
                      <svg lucideCopy class="w-3.5 h-3.5"></svg>
                    </button>

                    <button
                      (click)="store.exportProjectJson(proj.id)"
                      class="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition"
                      title="Export .formspec.json"
                    >
                      <svg lucideDownload class="w-3.5 h-3.5"></svg>
                    </button>

                    <button
                      (click)="store.deleteProject(proj.id)"
                      class="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition"
                      title="Delete Project"
                    >
                      <svg lucideTrash2 class="w-3.5 h-3.5"></svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Tab 2: STARTER TEMPLATES -->
        @if (store.projectsModalTab() === 'templates') {
          <div class="p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1">
            <!-- Search & Category Filters -->
            <div class="space-y-3">
              <!-- Search bar -->
              <div class="relative">
                <svg
                  lucideSearch
                  class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
                ></svg>
                <input
                  type="text"
                  [ngModel]="templateSearch()"
                  (ngModelChange)="templateSearch.set($event)"
                  placeholder="Search templates (e.g. furnace, chest, inventory, sign...)"
                  class="w-full bg-[#121214] border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <!-- Categories pills -->
              <div class="flex items-center gap-1.5 flex-wrap">
                @for (cat of categories; track cat.id) {
                  <button
                    (click)="selectedCategory.set(cat.id)"
                    [class.bg-emerald-600]="selectedCategory() === cat.id"
                    [class.text-white]="selectedCategory() === cat.id"
                    [class.border-emerald-500]="selectedCategory() === cat.id"
                    [class.bg-zinc-900]="selectedCategory() !== cat.id"
                    [class.text-zinc-400]="selectedCategory() !== cat.id"
                    [class.border-zinc-800]="selectedCategory() !== cat.id"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-medium border hover:border-zinc-700 transition"
                  >
                    {{ cat.label }}
                  </button>
                }
              </div>
            </div>

            <!-- Templates List -->
            @if (filteredTemplates().length === 0) {
              <div class="p-8 text-center text-zinc-500 rounded-xl border border-zinc-800/80">
                No templates found matching your search.
              </div>
            }

            @for (tmpl of filteredTemplates(); track tmpl.id) {
              <div
                (click)="selectTemplate(tmpl.id)"
                class="group p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/60 hover:bg-zinc-900 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-emerald-950/20"
              >
                <div class="space-y-1.5 max-w-lg">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors"
                    >
                      {{ tmpl.title }}
                    </span>
                    <span
                      [class.bg-emerald-950]="tmpl.category === 'minetest_game'"
                      [class.text-emerald-400]="tmpl.category === 'minetest_game'"
                      [class.border-emerald-800]="tmpl.category === 'minetest_game'"
                      [class.bg-blue-950]="tmpl.category !== 'minetest_game'"
                      [class.text-blue-400]="tmpl.category !== 'minetest_game'"
                      [class.border-blue-800]="tmpl.category !== 'minetest_game'"
                      class="px-2 py-0.5 rounded text-[10px] font-mono border"
                    >
                      {{ tmpl.badge }}
                    </span>
                    <span class="text-[10px] font-mono text-zinc-500">
                      {{ tmpl.ast.size.w }}×{{ tmpl.ast.size.h }} slots
                    </span>
                  </div>
                  <p class="text-xs text-zinc-400 leading-relaxed">
                    {{ tmpl.description }}
                  </p>
                  <div class="text-[10px] text-zinc-500 flex items-center gap-2">
                    <span
                      >Pattern: <span class="text-zinc-400">{{ tmpl.author }}</span></span
                    >
                    <span>•</span>
                    <span>{{ tmpl.ast.children.length }} elements</span>
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
        }

        <!-- Tab 3: IMPORT FORMSPEC -->
        @if (store.projectsModalTab() === 'import') {
          <div class="p-5 overflow-y-auto custom-scrollbar space-y-5 flex-1 text-xs">
            <!-- Sub-section 1: Upload File -->
            <div class="space-y-2">
              <div class="font-semibold text-zinc-200 flex items-center gap-1.5">
                <svg lucideUpload class="w-3.5 h-3.5 text-emerald-400"></svg>
                <span>Upload Formspec Project File</span>
              </div>
              <p class="text-zinc-400 text-[11px]">
                Import a native <span class="text-emerald-400 font-mono">.formspec.json</span> file
                or a raw Luanti formspec <span class="text-emerald-400 font-mono">.txt</span> file.
              </p>

              <input
                #fileInput
                type="file"
                accept=".json,.formspec.json,.txt"
                (change)="onFileSelected($event)"
                class="hidden"
              />

              <div
                (click)="fileInput.click()"
                class="p-6 rounded-xl border-2 border-dashed border-zinc-700/80 hover:border-emerald-500 bg-zinc-900/40 hover:bg-zinc-900/80 cursor-pointer transition flex flex-col items-center justify-center gap-2 group text-center"
              >
                <div
                  class="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-emerald-600/20 text-zinc-400 group-hover:text-emerald-400 flex items-center justify-center transition"
                >
                  <svg lucideUpload class="w-5 h-5"></svg>
                </div>
                <div class="font-medium text-zinc-300 group-hover:text-white">
                  Click or drag & drop project file here
                </div>
                <div class="text-[10px] text-zinc-500 font-mono">
                  Supports .formspec.json, .json, and .txt
                </div>
              </div>
            </div>

            <!-- Sub-section 2: Paste Raw Formspec Code -->
            <div class="space-y-2 border-t border-zinc-800 pt-4">
              <div class="flex items-center justify-between">
                <div class="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <svg lucideCode class="w-3.5 h-3.5 text-emerald-400"></svg>
                  <span>Paste Raw Luanti Formspec String</span>
                </div>
                <button
                  (click)="loadExampleRaw()"
                  class="text-[10px] text-emerald-400 hover:underline font-mono"
                >
                  Load Example String
                </button>
              </div>

              <input
                type="text"
                [(ngModel)]="rawProjectName"
                placeholder="Project Name (optional)"
                class="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-zinc-700/80 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />

              <textarea
                [(ngModel)]="rawFormspecInput"
                rows="5"
                placeholder="Paste raw formspec markup here: formspec_version[7]size[10,8]button[1,1;3,1;btn;Click Me]..."
                class="w-full p-3 rounded-lg bg-black/40 border border-zinc-700/80 text-emerald-300/90 font-mono text-xs focus:outline-none focus:border-emerald-500 custom-scrollbar resize-none"
              ></textarea>

              <div class="flex justify-end">
                <button
                  (click)="handleImportRaw()"
                  class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <svg lucideCheck class="w-3.5 h-3.5"></svg>
                  <span>Parse & Import into Studio</span>
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Modal Footer -->
        <div
          class="px-5 py-3 border-t border-zinc-800 bg-[#141418] flex items-center justify-between text-xs text-zinc-500"
        >
          <span>Auto-saving active • Formspec Version 7</span>
          <button
            (click)="store.closeProjectsModal()"
            class="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            Close
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

  readonly selectedCategory = signal<string>('all');
  readonly templateSearch = signal<string>('');

  readonly categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'minetest_game', label: 'Minetest Game' },
    { id: 'storage', label: 'Storage' },
    { id: 'machinery', label: 'Machinery' },
    { id: 'admin', label: 'Admin & HUD' },
    { id: 'rpg', label: 'RPG & Quests' },
    { id: 'minimal', label: 'Minimal' },
  ];

  readonly filteredTemplates = computed(() => {
    const cat = this.selectedCategory();
    const query = this.templateSearch().trim().toLowerCase();

    return this.templates.filter((tmpl) => {
      const matchCat = cat === 'all' || tmpl.category === cat;
      if (!matchCat) return false;
      if (!query) return true;
      return (
        tmpl.title.toLowerCase().includes(query) ||
        tmpl.description.toLowerCase().includes(query) ||
        tmpl.badge.toLowerCase().includes(query) ||
        tmpl.author.toLowerCase().includes(query)
      );
    });
  });

  newProjectName = 'my_formspec';
  newProjectW = 10;
  newProjectH = 8;

  rawProjectName = '';
  rawFormspecInput = '';
  readonly errorMessage = signal<string | null>(null);

  setTab(tab: 'projects' | 'templates' | 'import'): void {
    this.store.projectsModalTab.set(tab);
    this.errorMessage.set(null);
  }

  selectTemplate(id: string): void {
    this.store.loadTemplate(id);
  }

  handleCreateProject(): void {
    const name = this.newProjectName.trim() || 'my_formspec';
    const w = Number(this.newProjectW) || 10;
    const h = Number(this.newProjectH) || 8;
    this.store.createNewProject(name, w, h);
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return '';
    const now = Date.now();
    const diffSec = Math.floor((now - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      if (file.name.endsWith('.json')) {
        const ok = this.store.importProjectJson(text);
        if (!ok) {
          this.errorMessage.set('Invalid .formspec.json file structure.');
        } else {
          this.errorMessage.set(null);
        }
      } else {
        const projName = file.name.replace(/\.[^/.]+$/, '');
        const ok = this.store.importRawFormspec(text, projName);
        if (!ok) {
          this.errorMessage.set('Failed to parse formspec text file.');
        } else {
          this.errorMessage.set(null);
        }
      }
    };

    reader.readAsText(file);
  }

  loadExampleRaw(): void {
    this.rawProjectName = 'dialogue_example';
    this.rawFormspecInput =
      'formspec_version[7]size[10,7]label[0.5,0.8;Quest Giver: Elder Marcus]textarea[0.5,1.5;9,3;;;Greetings, traveler! We need your assistance defending our village.]button[0.5,5.2;4,0.9;btn_accept;Accept Quest]button[5.5,5.2;4,0.9;btn_decline;Decline]';
  }

  handleImportRaw(): void {
    const raw = this.rawFormspecInput.trim();
    if (!raw) {
      this.errorMessage.set('Please paste a formspec string to import.');
      return;
    }
    const ok = this.store.importRawFormspec(raw, this.rawProjectName);
    if (!ok) {
      this.errorMessage.set('Could not parse formspec string. Please verify the syntax.');
    } else {
      this.errorMessage.set(null);
      this.rawFormspecInput = '';
      this.rawProjectName = '';
    }
  }
}
