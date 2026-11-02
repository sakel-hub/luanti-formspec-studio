import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStore } from '../../core/state/editor.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import {
  LucideHelpCircle,
  LucideX,
  LucideBookOpen,
  LucideLayers,
  LucidePlay,
  LucideCode,
  LucideExternalLink,
  LucideSparkles,
} from '@lucide/angular';

type HelpTab = 'basics' | 'widgets' | 'prototype' | 'export';

@Component({
  selector: 'app-help-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    LucideHelpCircle,
    LucideX,
    LucideBookOpen,
    LucideLayers,
    LucidePlay,
    LucideCode,
    LucideExternalLink,
    LucideSparkles,
  ],
  template: `
    @if (store.isHelpModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in"
        (click)="onBackdropClick($event)"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-dialog-title"
          class="relative w-full max-w-4xl max-h-[88vh] bg-[#18181c] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
          (click)="$event.stopPropagation()"
        >
          <!-- Dialog Header -->
          <div class="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg lucideHelpCircle class="w-5 h-5"></svg>
              </div>
              <div>
                <h3 id="help-dialog-title" class="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <span>{{ 'help.title' | translate }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Luanti 5.18
                  </span>
                </h3>
                <p class="text-xs text-zinc-400">
                  {{ 'help.subtitle' | translate }}
                </p>
              </div>
            </div>

            <!-- Close Button -->
            <button
              (click)="store.closeHelpModal()"
              class="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition flex items-center justify-center"
              title="Close (Esc)"
              aria-label="Close guide"
            >
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          </div>

          <!-- Tab Bar -->
          <div class="px-5 border-b border-zinc-800 bg-[#141416] flex items-center gap-2 overflow-x-auto">
            <button
              (click)="activeTab.set('basics')"
              [class.border-emerald-500]="activeTab() === 'basics'"
              [class.text-emerald-400]="activeTab() === 'basics'"
              [class.border-transparent]="activeTab() !== 'basics'"
              [class.text-zinc-400]="activeTab() !== 'basics'"
              class="px-3 py-3 border-b-2 font-medium text-xs transition flex items-center gap-2 shrink-0 hover:text-zinc-200"
            >
              <svg lucideBookOpen class="w-4 h-4"></svg>
              <span>{{ 'help.tabBasics' | translate }}</span>
            </button>

            <button
              (click)="activeTab.set('widgets')"
              [class.border-emerald-500]="activeTab() === 'widgets'"
              [class.text-emerald-400]="activeTab() === 'widgets'"
              [class.border-transparent]="activeTab() !== 'widgets'"
              [class.text-zinc-400]="activeTab() !== 'widgets'"
              class="px-3 py-3 border-b-2 font-medium text-xs transition flex items-center gap-2 shrink-0 hover:text-zinc-200"
            >
              <svg lucideLayers class="w-4 h-4"></svg>
              <span>{{ 'help.tabWidgets' | translate }}</span>
            </button>

            <button
              (click)="activeTab.set('prototype')"
              [class.border-emerald-500]="activeTab() === 'prototype'"
              [class.text-emerald-400]="activeTab() === 'prototype'"
              [class.border-transparent]="activeTab() !== 'prototype'"
              [class.text-zinc-400]="activeTab() !== 'prototype'"
              class="px-3 py-3 border-b-2 font-medium text-xs transition flex items-center gap-2 shrink-0 hover:text-zinc-200"
            >
              <svg lucidePlay class="w-4 h-4"></svg>
              <span>{{ 'help.tabPrototype' | translate }}</span>
            </button>

            <button
              (click)="activeTab.set('export')"
              [class.border-emerald-500]="activeTab() === 'export'"
              [class.text-emerald-400]="activeTab() === 'export'"
              [class.border-transparent]="activeTab() !== 'export'"
              [class.text-zinc-400]="activeTab() !== 'export'"
              class="px-3 py-3 border-b-2 font-medium text-xs transition flex items-center gap-2 shrink-0 hover:text-zinc-200"
            >
              <svg lucideCode class="w-4 h-4"></svg>
              <span>{{ 'help.tabExport' | translate }}</span>
            </button>
          </div>

          <!-- Content Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-300">
            @if (activeTab() === 'basics') {
              <div class="space-y-4">
                <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <h4 class="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <svg lucideSparkles class="w-4 h-4"></svg>
                    <span>Formspec Version 7 (Real Coordinates)</span>
                  </h4>
                  <p class="leading-relaxed">
                    Luanti (formerly Minetest) formspecs evolved from legacy grid coordinates (v1/v2) to modern
                    real coordinates with <code class="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono">formspec_version[7]</code>.
                    All positions and dimensions are specified in slot units (<code class="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono">s</code>),
                    allowing sub-pixel precision and fluid responsive layouts.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                    <div class="font-semibold text-zinc-200">Canvas Dimensions & Centering</div>
                    <pre class="p-2.5 rounded bg-black/50 border border-zinc-800 text-emerald-300 font-mono text-[11px] overflow-x-auto">
formspec_version[7]
size[12,8]
position[0.5,0.5]
anchor[0.5,0.5]</pre
                    >
                    <p class="text-zinc-400">
                      <code class="text-zinc-300">position[0.5,0.5]</code> anchors the formspec directly at the center of the player's screen,
                      with <code class="text-zinc-300">anchor[0.5,0.5]</code> keeping it balanced regardless of window size.
                    </p>
                  </div>

                  <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                    <div class="font-semibold text-zinc-200">Hierarchical Containers & Nesting</div>
                    <pre class="p-2.5 rounded bg-black/50 border border-zinc-800 text-emerald-300 font-mono text-[11px] overflow-x-auto">
container[1,1]
  button[0,0;3,0.8;btn;Click Me]
container_end[]</pre
                    >
                    <p class="text-zinc-400">
                      Containers allow grouping elements into modular components. Children inside containers
                      inherit the container's top-left origin.
                    </p>
                  </div>
                </div>
              </div>
            } @else if (activeTab() === 'widgets') {
              <div class="space-y-4">
                <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <h4 class="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <svg lucideLayers class="w-4 h-4"></svg>
                    <span>Full Luanti 5.18 Widget Library</span>
                  </h4>
                  <p class="leading-relaxed">
                    Formspec Studio supports all modern Luanti 5.18 features, including advanced 3D models, animated sprites,
                    hypertext markup, and custom styling.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                    <div class="font-semibold text-zinc-200 flex items-center justify-between">
                      <span>animated_image</span>
                      <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">v5.3+</span>
                    </div>
                    <p class="text-zinc-400">Renders animated textures from sprite sheets with configurable frame count, duration, and loop control.</p>
                  </div>

                  <div class="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                    <div class="font-semibold text-zinc-200 flex items-center justify-between">
                      <span>model (3D Mesh)</span>
                      <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">v5.4+</span>
                    </div>
                    <p class="text-zinc-400">Embeds an interactive 3D mesh inside the GUI with rotation, continuous spin, and mouse drag interaction.</p>
                  </div>

                  <div class="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                    <div class="font-semibold text-zinc-200 flex items-center justify-between">
                      <span>hypertext</span>
                      <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">v5.3+</span>
                    </div>
                    <p class="text-zinc-400">Formatted text with custom colors, embedded images, actionable links, and custom styles.</p>
                  </div>

                  <div class="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                    <div class="font-semibold text-zinc-200 flex items-center justify-between">
                      <span>style & style_type</span>
                      <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">v5.1+</span>
                    </div>
                    <p class="text-zinc-400">CSS-like styling for formspec elements: custom 9-slice backgrounds, border colors, sounds, and states.</p>
                  </div>
                </div>
              </div>
            } @else if (activeTab() === 'prototype') {
              <div class="space-y-4">
                <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <h4 class="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <svg lucidePlay class="w-4 h-4"></svg>
                    <span>Figma-Style Interactive Prototype Mode</span>
                  </h4>
                  <p class="leading-relaxed">
                    Test your formspec directly in the browser before exporting to Lua!
                    Click the <strong class="text-emerald-400">Play Test</strong> button in the top bar to enter interactive mode.
                  </p>
                </div>

                <div class="space-y-3">
                  <div class="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                    <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                    <div>
                      <div class="font-semibold text-zinc-200">Interactive Inputs & State</div>
                      <p class="text-zinc-400 mt-0.5">Type into text fields, toggle checkboxes, open dropdowns, and click buttons with native feedback.</p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                    <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                    <div>
                      <div class="font-semibold text-zinc-200">Event Logging</div>
                      <p class="text-zinc-400 mt-0.5">Simulated player events and field submissions are captured in real-time, just like in Luanti's <code class="text-emerald-400">minetest.register_on_player_receive_fields</code>.</p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                    <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                    <div>
                      <div class="font-semibold text-zinc-200">Escape to Exit</div>
                      <p class="text-zinc-400 mt-0.5">Press <kbd class="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-zinc-200">Esc</kbd> or click "Stop Test" anytime to return to visual editing mode.</p>
                    </div>
                  </div>
                </div>
              </div>
            } @else if (activeTab() === 'export') {
              <div class="space-y-4">
                <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <h4 class="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <svg lucideCode class="w-4 h-4"></svg>
                    <span>One-Click Luanti Mod Export</span>
                  </h4>
                  <p class="leading-relaxed">
                    Formspec Studio produces production-ready Lua code that can be dropped directly into any Luanti mod.
                  </p>
                </div>

                <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                  <div class="font-semibold text-zinc-200">Sample Generated Mod Pattern</div>
                  <pre class="p-3 rounded bg-black/60 border border-zinc-800 text-zinc-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
<span class="text-zinc-500">-- Show formspec command</span>
<span class="text-emerald-400">minetest</span>.register_chatcommand(<span class="text-amber-300">"mygui"</span>, &#123;
  description = <span class="text-amber-300">"Open Formspec Studio GUI"</span>,
  func = <span class="text-cyan-400">function</span>(player_name)
    <span class="text-emerald-400">minetest</span>.show_formspec(player_name, <span class="text-amber-300">"my_mod:gui"</span>, get_formspec())
  <span class="text-cyan-400">end</span>
&#125;)

<span class="text-zinc-500">-- Handle button clicks and input fields</span>
<span class="text-emerald-400">minetest</span>.register_on_player_receive_fields(<span class="text-cyan-400">function</span>(player, formname, fields)
  <span class="text-cyan-400">if</span> formname ~= <span class="text-amber-300">"my_mod:gui"</span> <span class="text-cyan-400">then</span> <span class="text-cyan-400">return</span> <span class="text-cyan-400">end</span>
  <span class="text-cyan-400">if</span> fields.save <span class="text-cyan-400">then</span>
    <span class="text-emerald-400">minetest</span>.chat_send_player(player:get_player_name(), <span class="text-amber-300">"Saved!"</span>)
  <span class="text-cyan-400">end</span>
<span class="text-cyan-400">end</span>)</pre>
                </div>
              </div>
            }
          </div>

          <!-- Dialog Footer -->
          <div class="px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400">
            <a
              href="https://github.com/luanti-org/luanti"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 transition"
            >
              <span>Luanti Engine Documentation</span>
              <svg lucideExternalLink class="w-3.5 h-3.5"></svg>
            </a>
            <button
              (click)="store.closeHelpModal()"
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
export class HelpDialogComponent {
  readonly store = inject(EditorStore);
  readonly activeTab = signal<HelpTab>('basics');

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.store.isHelpModalOpen()) {
      this.store.closeHelpModal();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.store.closeHelpModal();
    }
  }
}
