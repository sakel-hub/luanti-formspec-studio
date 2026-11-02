import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorStore } from '../../core/state/editor.store';
import { PwaService } from '../../core/services/pwa.service';
import { TranslationService } from '../../core/i18n/translation.service';
import {
  LucideX,
  LucideDownload,
  LucideHardDrive,
  LucideCheck,
  LucideWifi,
  LucideWifiOff,
  LucideRefreshCw,
  LucideTrash2,
  LucideSliders,
  LucideSmartphone,
  LucideSparkles,
  LucideHelpCircle,
} from '@lucide/angular';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideX,
    LucideDownload,
    LucideHardDrive,
    LucideCheck,
    LucideWifi,
    LucideWifiOff,
    LucideRefreshCw,
    LucideTrash2,
    LucideSliders,
    LucideSmartphone,
    LucideSparkles,
    LucideHelpCircle,
  ],
  template: `
    @if (store.isSettingsModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
        (click)="store.closeSettingsModal()"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          class="bg-[#18181c] border border-zinc-700/80 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div
            class="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#141417]"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"
              >
                <svg lucideSliders class="w-4 h-4"></svg>
              </div>
              <div>
                <h3 id="settings-modal-title" class="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  Preferences & PWA Storage
                </h3>
                <p class="text-[11px] text-zinc-400">
                  Manage persistent settings, offline capabilities, and PWA installation
                </p>
              </div>
            </div>

            <button
              (click)="store.closeSettingsModal()"
              class="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition"
              title="Close (Esc)"
              aria-label="Close settings"
            >
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          </div>

          <!-- Tabs Header -->
          <div class="flex border-b border-zinc-800 px-5 bg-[#161619] gap-2">
            <button
              (click)="activeTab.set('preferences')"
              [class.border-emerald-500]="activeTab() === 'preferences'"
              [class.text-emerald-400]="activeTab() === 'preferences'"
              [class.border-transparent]="activeTab() !== 'preferences'"
              [class.text-zinc-400]="activeTab() !== 'preferences'"
              class="py-2.5 px-3 border-b-2 font-medium text-xs transition flex items-center gap-1.5"
            >
              <svg lucideSliders class="w-3.5 h-3.5"></svg>
              <span>Editor Preferences</span>
            </button>

            <button
              (click)="activeTab.set('pwa')"
              [class.border-emerald-500]="activeTab() === 'pwa'"
              [class.text-emerald-400]="activeTab() === 'pwa'"
              [class.border-transparent]="activeTab() !== 'pwa'"
              [class.text-zinc-400]="activeTab() !== 'pwa'"
              class="py-2.5 px-3 border-b-2 font-medium text-xs transition flex items-center gap-1.5"
            >
              <svg lucideSmartphone class="w-3.5 h-3.5"></svg>
              <span>PWA & Offline</span>
              @if (pwa.canInstall()) {
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              }
            </button>

            <button
              (click)="activeTab.set('storage')"
              [class.border-emerald-500]="activeTab() === 'storage'"
              [class.text-emerald-400]="activeTab() === 'storage'"
              [class.border-transparent]="activeTab() !== 'storage'"
              [class.text-zinc-400]="activeTab() !== 'storage'"
              class="py-2.5 px-3 border-b-2 font-medium text-xs transition flex items-center gap-1.5"
            >
              <svg lucideHardDrive class="w-3.5 h-3.5"></svg>
              <span>Data & Storage</span>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-5 space-y-5 text-xs font-sans">
            <!-- TAB 1: PREFERENCES -->
            @if (activeTab() === 'preferences') {
              <div class="space-y-4">
                <!-- Snap Settings -->
                <div class="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div class="font-bold text-zinc-200 text-xs flex items-center justify-between">
                    <span>Grid Snapping & Precision</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="store.snapToGrid()"
                        (change)="store.setSnapToGrid(!store.snapToGrid())"
                        class="sr-only peer"
                      />
                      <div
                        class="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"
                      ></div>
                    </label>
                  </div>
                  <p class="text-[11px] text-zinc-400">
                    Snap widget positions and dimensions to fractional Luanti slot increments.
                  </p>

                  <div class="grid grid-cols-4 gap-2 pt-1">
                    @for (step of [0.1, 0.25, 0.5, 1.0]; track step) {
                      <button
                        (click)="store.setSnapStep(step)"
                        [class.bg-emerald-600]="store.snapStep() === step"
                        [class.text-white]="store.snapStep() === step"
                        [class.border-emerald-500]="store.snapStep() === step"
                        [class.bg-zinc-800]="store.snapStep() !== step"
                        [class.text-zinc-300]="store.snapStep() !== step"
                        [class.border-zinc-700]="store.snapStep() !== step"
                        class="py-1.5 px-2 rounded-lg border font-mono text-center text-xs transition active:scale-95 flex flex-col items-center justify-center"
                      >
                        <span class="font-bold">{{ step }}s</span>
                        <span class="text-[9px] opacity-75">
                          {{
                            step === 0.1
                              ? 'Fine'
                              : step === 0.25
                                ? 'Quarter'
                                : step === 0.5
                                  ? 'Half'
                                  : 'Whole'
                          }}
                        </span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Auto-Save Settings -->
                <div class="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div class="font-bold text-zinc-200 text-xs flex items-center justify-between">
                    <span>Persistent Auto-Save</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="store.autoSaveEnabled()"
                        (change)="store.setAutoSaveEnabled(!store.autoSaveEnabled())"
                        class="sr-only peer"
                      />
                      <div
                        class="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"
                      ></div>
                    </label>
                  </div>
                  <p class="text-[11px] text-zinc-400">
                    Automatically persists your visual formspec AST, changes, and layout to browser
                    storage in real-time.
                  </p>
                </div>

                <!-- Default Workspace Layout -->
                <div class="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div class="font-bold text-zinc-200 text-xs">Sidebar & Layout Dimensions</div>
                  <div class="grid grid-cols-2 gap-3 text-zinc-300">
                    <div>
                      <span class="text-[11px] text-zinc-400 block mb-1">Left Palette Width</span>
                      <span
                        class="font-mono bg-black/60 px-2 py-1 rounded border border-zinc-800 block text-center"
                      >
                        {{ store.leftPanelWidth() }}px
                      </span>
                    </div>
                    <div>
                      <span class="text-[11px] text-zinc-400 block mb-1"
                        >Right Inspector Width</span
                      >
                      <span
                        class="font-mono bg-black/60 px-2 py-1 rounded border border-zinc-800 block text-center"
                      >
                        {{ store.rightPanelWidth() }}px
                      </span>
                    </div>
                  </div>
                  <button
                    (click)="store.setLeftPanelWidth(280); store.setRightPanelWidth(320)"
                    class="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                  >
                    Reset Panel Widths to Defaults (280px / 320px)
                  </button>
                </div>
              </div>
            }

            <!-- TAB 2: PWA & OFFLINE -->
            @if (activeTab() === 'pwa') {
              <div class="space-y-4">
                <!-- Install Banner -->
                <div
                  class="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-zinc-900 border border-emerald-500/40 space-y-3"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center"
                      >
                        <svg lucideDownload class="w-4 h-4"></svg>
                      </div>
                      <div>
                        <h4 class="font-bold text-emerald-400 text-sm">
                          Install Luanti Formspec Studio
                        </h4>
                        <p class="text-[11px] text-zinc-300">
                          Install as a standalone, distraction-free desktop or mobile application.
                        </p>
                      </div>
                    </div>

                    @if (pwa.isStandalone()) {
                      <span
                        class="px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] font-medium border border-emerald-700 flex items-center gap-1"
                      >
                        <svg lucideCheck class="w-3 h-3"></svg> Installed
                      </span>
                    }
                  </div>

                  @if (pwa.canInstall()) {
                    <button
                      (click)="triggerInstall()"
                      class="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
                    >
                      <svg lucideDownload class="w-4 h-4"></svg>
                      <span>Install App Now</span>
                    </button>
                  } @else if (!pwa.isStandalone()) {
                    <div
                      class="bg-black/50 p-3 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 space-y-1"
                    >
                      <div class="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <svg lucideHelpCircle class="w-3.5 h-3.5"></svg>
                        <span>How to install in your browser:</span>
                      </div>
                      <p>
                        • <strong>Chrome / Edge / Brave:</strong> Click the install icon in the
                        address bar (or Menu &gt; Install Luanti Formspec Studio).
                      </p>
                      <p>• <strong>Safari (macOS):</strong> File &gt; Add to Dock.</p>
                      <p>• <strong>iOS / Android:</strong> Tap Share &gt; Add to Home Screen.</p>
                    </div>
                  }
                </div>

                <!-- Connectivity & Service Worker Status -->
                <div class="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div class="font-bold text-zinc-200 text-xs">Offline Status & Service Worker</div>

                  <div class="grid grid-cols-2 gap-3">
                    <div
                      class="p-2.5 rounded-lg bg-black/50 border border-zinc-800 flex items-center gap-2.5"
                    >
                      @if (pwa.isOnline()) {
                        <div
                          class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"
                        >
                          <svg lucideWifi class="w-3.5 h-3.5"></svg>
                        </div>
                        <div>
                          <div class="text-[10px] text-zinc-400 font-mono">NETWORK</div>
                          <div class="text-xs font-semibold text-emerald-400">Online</div>
                        </div>
                      } @else {
                        <div
                          class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center"
                        >
                          <svg lucideWifiOff class="w-3.5 h-3.5"></svg>
                        </div>
                        <div>
                          <div class="text-[10px] text-zinc-400 font-mono">NETWORK</div>
                          <div class="text-xs font-semibold text-amber-400">Offline Mode</div>
                        </div>
                      }
                    </div>

                    <div
                      class="p-2.5 rounded-lg bg-black/50 border border-zinc-800 flex items-center gap-2.5"
                    >
                      <div
                        class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"
                      >
                        <svg lucideSparkles class="w-3.5 h-3.5"></svg>
                      </div>
                      <div>
                        <div class="text-[10px] text-zinc-400 font-mono">OFFLINE CACHE</div>
                        <div class="text-xs font-semibold text-emerald-400">100% Cached</div>
                      </div>
                    </div>
                  </div>

                  <!-- Updates Checker -->
                  <div class="pt-1 flex items-center justify-between">
                    <span class="text-[11px] text-zinc-400"
                      >Keep application up to date with newest Luanti formspec elements</span
                    >
                    <button
                      (click)="checkForUpdates()"
                      [disabled]="isCheckingUpdates()"
                      class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <svg
                        lucideRefreshCw
                        class="w-3 h-3"
                        [class.animate-spin]="isCheckingUpdates()"
                      ></svg>
                      <span>{{ isCheckingUpdates() ? 'Checking...' : 'Check for Updates' }}</span>
                    </button>
                  </div>

                  @if (updateMessage()) {
                    <div
                      class="p-2 rounded bg-zinc-800 text-[11px] text-emerald-400 text-center font-mono"
                    >
                      {{ updateMessage() }}
                    </div>
                  }
                </div>
              </div>
            }

            <!-- TAB 3: DATA & STORAGE -->
            @if (activeTab() === 'storage') {
              <div class="space-y-4">
                <!-- Storage Quota Gauge -->
                <div class="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div class="font-bold text-zinc-200 text-xs flex items-center justify-between">
                    <span>Local Persistent Storage</span>
                    <span class="text-zinc-400 font-mono text-[10px]">
                      {{ store.projects().length }} saved project(s)
                    </span>
                  </div>

                  @if (pwa.storageInfo(); as info) {
                    <div class="space-y-1.5">
                      <div
                        class="flex items-center justify-between text-[11px] font-mono text-zinc-400"
                      >
                        <span>Used: {{ info.usageFormatted }}</span>
                        <span>Quota: {{ info.quotaFormatted }}</span>
                      </div>
                      <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-emerald-500 rounded-full"
                          [style.width.%]="info.percentUsed || 1"
                        ></div>
                      </div>
                    </div>
                  } @else {
                    <div class="text-[11px] text-zinc-400">
                      Standard HTML5 LocalStorage & Cache Storage active.
                    </div>
                  }
                </div>

                <!-- Backup & Reset Actions -->
                <div class="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div class="font-bold text-zinc-200 text-xs">Backups & Maintenance</div>

                  <div class="flex items-center gap-2">
                    <button
                      (click)="downloadAllBackup()"
                      class="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <svg lucideDownload class="w-3.5 h-3.5 text-emerald-400"></svg>
                      <span>Backup All Projects (JSON)</span>
                    </button>

                    <button
                      (click)="confirmReset()"
                      class="py-2 px-3 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 text-xs font-medium transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <svg lucideTrash2 class="w-3.5 h-3.5 text-red-400"></svg>
                      <span>Clear Storage</span>
                    </button>
                  </div>

                  @if (showConfirmReset()) {
                    <div
                      class="p-3 rounded-lg bg-red-950/80 border border-red-700 text-red-200 space-y-2 animate-fade-in"
                    >
                      <p class="text-[11px] font-medium">
                        Are you sure? This will delete all locally stored projects and reset
                        settings to default.
                      </p>
                      <div class="flex items-center gap-2 justify-end">
                        <button
                          (click)="showConfirmReset.set(false)"
                          class="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700"
                        >
                          Cancel
                        </button>
                        <button
                          (click)="executeReset()"
                          class="px-2.5 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-500 font-bold"
                        >
                          Confirm & Reset
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Modal Footer -->
          <div
            class="px-5 py-3 border-t border-zinc-800 flex items-center justify-between bg-[#141417]"
          >
            <span class="text-[10px] text-zinc-500 font-mono"
              >Luanti Formspec Studio PWA Edition</span
            >
            <button
              (click)="store.closeSettingsModal()"
              class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SettingsModalComponent {
  readonly store = inject(EditorStore);
  readonly pwa = inject(PwaService);
  readonly i18n = inject(TranslationService);

  readonly activeTab = signal<'preferences' | 'pwa' | 'storage'>('preferences');
  readonly isCheckingUpdates = signal<boolean>(false);
  readonly updateMessage = signal<string | null>(null);
  readonly showConfirmReset = signal<boolean>(false);

  async triggerInstall(): Promise<void> {
    const success = await this.pwa.installApp();
    if (success) {
      this.store.closeSettingsModal();
    }
  }

  async checkForUpdates(): Promise<void> {
    this.isCheckingUpdates.set(true);
    this.updateMessage.set(null);
    try {
      const hasUpdate = await this.pwa.checkForUpdate();
      if (hasUpdate) {
        this.updateMessage.set('New update available! Click below to apply.');
      } else {
        this.updateMessage.set('You are running the latest version.');
      }
    } catch {
      this.updateMessage.set('Unable to check for updates right now.');
    } finally {
      this.isCheckingUpdates.set(false);
    }
  }

  downloadAllBackup(): void {
    const backup = {
      timestamp: Date.now(),
      projects: this.store.projects(),
      activeProjectId: this.store.currentProjectId(),
      ast: this.store.ast(),
    };
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luanti-formspec-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  confirmReset(): void {
    this.showConfirmReset.set(true);
  }

  executeReset(): void {
    this.store.clearAllStorageAndReset();
    this.showConfirmReset.set(false);
    this.store.closeSettingsModal();
  }
}
