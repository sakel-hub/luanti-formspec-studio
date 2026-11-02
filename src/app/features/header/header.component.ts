import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorStore } from '../../core/state/editor.store';
import { TranslationService } from '../../core/i18n/translation.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LocaleId } from '../../core/i18n/translation.types';
import { PwaService } from '../../core/services/pwa.service';
import {
  LucideRotateCcw,
  LucideRotateCw,
  LucideSmartphone,
  LucideTablet,
  LucideMonitor,
  LucideSparkles,
  LucideCode,
  LucideLayout,
  LucidePlay,
  LucideSquare,
  LucideFolderGit2,
  LucideShare2,
  LucideDownload,
  LucideCheck,
  LucideKeyboard,
  LucideHelpCircle,
  LucideGitBranch,
  LucideLanguages,
  LucideMenu,
  LucideX,
  LucideChevronDown,
  LucideExternalLink,
  LucideSliders,
  LucideWifiOff,
  LucideRefreshCw,
} from '@lucide/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    LucideRotateCcw,
    LucideRotateCw,
    LucideSmartphone,
    LucideTablet,
    LucideMonitor,
    LucideSparkles,
    LucideCode,
    LucideLayout,
    LucidePlay,
    LucideSquare,
    LucideFolderGit2,
    LucideShare2,
    LucideDownload,
    LucideCheck,
    LucideKeyboard,
    LucideHelpCircle,
    LucideGitBranch,
    LucideLanguages,
    LucideMenu,
    LucideX,
    LucideChevronDown,
    LucideExternalLink,
    LucideSliders,
    LucideWifiOff,
    LucideRefreshCw,
  ],
  template: `
    <!-- PWA Update Notification Banner -->
    @if (pwa.hasUpdate()) {
      <div class="fixed top-0 left-0 right-0 z-50 bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between font-medium shadow-2xl animate-bounce-subtle">
        <div class="flex items-center gap-2">
          <svg lucideRefreshCw class="w-3.5 h-3.5 animate-spin"></svg>
          <span>A new version of Luanti Formspec Studio is available.</span>
        </div>
        <button
          (click)="pwa.applyUpdate()"
          class="px-2.5 py-1 rounded bg-black/40 hover:bg-black/60 text-white font-bold text-xs transition"
        >
          Update Now
        </button>
      </div>
    }

    <header class="h-13 bg-[#18181c] border-b border-[#282830] px-3 sm:px-4 flex items-center justify-between text-xs select-none shrink-0 z-20">
      <!-- Left: Logo, Project Info & Project/Template Buttons -->
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <div class="flex items-center gap-2 shrink-0">
          <img src="logo.svg" alt="Formspec Studio" class="w-7 h-7 rounded-md" />
          <div class="hidden sm:flex flex-col">
            <div class="font-bold text-zinc-100 flex items-center gap-1.5 leading-tight">
              <span>{{ 'header.title' | translate }}</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                {{ 'header.versionBadge' | translate }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
              <input
                type="text"
                [ngModel]="store.projectName()"
                (ngModelChange)="store.setProjectName($event)"
                class="bg-transparent hover:bg-zinc-800/80 focus:bg-zinc-800 px-1 py-0.2 rounded text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 w-28 truncate"
                title="Click to rename project"
              />
              <span class="text-zinc-600">•</span>
              <span>{{ store.ast().size.w }}×{{ store.ast().size.h }}s</span>
              <span class="text-zinc-600">•</span>

              <!-- Auto-save Status Indicator -->
              @if (store.saveStatus() === 'saving') {
                <span class="flex items-center gap-1 text-amber-400 text-[9px]">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  {{ 'common.saving' | translate }}
                </span>
              } @else {
                <span
                  class="flex items-center gap-1 text-emerald-400/80 hover:text-emerald-300 text-[9px] cursor-pointer transition"
                  (click)="store.openSettingsModal()"
                  title="Auto-saved in local persistent storage. Click for settings."
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {{ 'common.saved' | translate }}
                </span>
              }

              <!-- Offline Network Status Badge -->
              @if (!pwa.isOnline()) {
                <span class="text-zinc-600">•</span>
                <span class="flex items-center gap-1 text-amber-400 text-[9px] bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800" title="Offline Mode: PWA cached and operational">
                  <svg lucideWifiOff class="w-2.5 h-2.5"></svg>
                  Offline
                </span>
              }
            </div>
          </div>
        </div>

        <!-- Projects Modal Trigger -->
        <button
          (click)="store.openProjectsModal('projects')"
          class="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition flex items-center gap-1.5 font-medium shadow-sm active:scale-95"
          [title]="'header.projects' | translate"
        >
          <svg lucideFolderGit2 class="w-3.5 h-3.5 text-emerald-400"></svg>
          <span class="hidden md:inline">{{ 'header.projects' | translate }}</span>
        </button>

        <!-- Template Picker Trigger -->
        <button
          (click)="store.openProjectsModal('templates')"
          class="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition flex items-center gap-1.5 font-medium shadow-sm active:scale-95"
          [title]="'header.templates' | translate"
        >
          <svg lucideSparkles class="w-3.5 h-3.5 text-amber-400"></svg>
          <span class="hidden md:inline">{{ 'header.templates' | translate }}</span>
        </button>
      </div>

      <!-- Center: Responsive Breakpoint Switcher -->
      <div class="hidden lg:flex items-center bg-[#121214] p-1 rounded-lg border border-zinc-800 text-xs shrink-0">
        <button
          (click)="store.setBreakpoint('mobile')"
          [class.bg-emerald-600]="store.activeBreakpoint() === 'mobile'"
          [class.text-white]="store.activeBreakpoint() === 'mobile'"
          [class.text-zinc-400]="store.activeBreakpoint() !== 'mobile'"
          class="px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5"
          [title]="'header.mobile' | translate"
          [attr.aria-label]="'header.mobile' | translate"
        >
          <svg lucideSmartphone class="w-3.5 h-3.5"></svg>
          <span class="hidden xl:inline">{{ 'header.mobile' | translate }}</span>
        </button>

        <button
          (click)="store.setBreakpoint('tablet')"
          [class.bg-emerald-600]="store.activeBreakpoint() === 'tablet'"
          [class.text-white]="store.activeBreakpoint() === 'tablet'"
          [class.text-zinc-400]="store.activeBreakpoint() !== 'tablet'"
          class="px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5"
          [title]="'header.tablet' | translate"
          [attr.aria-label]="'header.tablet' | translate"
        >
          <svg lucideTablet class="w-3.5 h-3.5"></svg>
          <span class="hidden xl:inline">{{ 'header.tablet' | translate }}</span>
        </button>

        <button
          (click)="store.setBreakpoint('desktop')"
          [class.bg-emerald-600]="store.activeBreakpoint() === 'desktop'"
          [class.text-white]="store.activeBreakpoint() === 'desktop'"
          [class.text-zinc-400]="store.activeBreakpoint() !== 'desktop'"
          class="px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5"
          [title]="'header.desktop' | translate"
          [attr.aria-label]="'header.desktop' | translate"
        >
          <svg lucideMonitor class="w-3.5 h-3.5"></svg>
          <span class="hidden xl:inline">{{ 'header.desktop' | translate }}</span>
        </button>
      </div>

      <!-- Right: Actions, Companion Buttons & Menu -->
      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <!-- Snap Selector -->
        <div class="hidden sm:flex items-center gap-1 bg-[#121214] px-2 py-1 rounded-lg border border-zinc-800 text-[11px]">
          <span class="text-zinc-500 font-mono">{{ 'header.snap' | translate }}:</span>
          <select
            [ngModel]="store.snapStep()"
            (ngModelChange)="store.setSnapStep($event)"
            class="bg-transparent text-emerald-400 font-mono border-none focus:outline-none cursor-pointer"
            aria-label="Grid snapping increment"
          >
            <option [value]="0.1" class="bg-zinc-900 text-zinc-200">0.1s</option>
            <option [value]="0.25" class="bg-zinc-900 text-zinc-200">0.25s</option>
            <option [value]="0.5" class="bg-zinc-900 text-zinc-200">0.5s</option>
            <option [value]="1.0" class="bg-zinc-900 text-zinc-200">1.0s</option>
          </select>
        </div>

        <!-- Undo / Redo -->
        <div class="hidden sm:flex items-center">
          <button
            (click)="store.undo()"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            [title]="'header.undo' | translate"
            [attr.aria-label]="'header.undo' | translate"
          >
            <svg lucideRotateCcw class="w-4 h-4"></svg>
          </button>
          <button
            (click)="store.redo()"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            [title]="'header.redo' | translate"
            [attr.aria-label]="'header.redo' | translate"
          >
            <svg lucideRotateCw class="w-4 h-4"></svg>
          </button>
        </div>

        <div class="hidden sm:block h-4 w-px bg-zinc-800 mx-0.5"></div>

        <!-- Keyboard Shortcuts Button -->
        <button
          (click)="store.openShortcutsModal()"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          [title]="'header.shortcuts' | translate"
          [attr.aria-label]="'header.shortcuts' | translate"
        >
          <svg lucideKeyboard class="w-4 h-4"></svg>
        </button>

        <!-- Help / Quick Guide Button -->
        <button
          (click)="store.openHelpModal()"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          [title]="'header.help' | translate"
          [attr.aria-label]="'header.help' | translate"
        >
          <svg lucideHelpCircle class="w-4 h-4"></svg>
        </button>

        <!-- Social Share Button -->
        <button
          (click)="store.openShareModal()"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition"
          [title]="'header.share' | translate"
          [attr.aria-label]="'header.share' | translate"
        >
          <svg lucideShare2 class="w-4 h-4"></svg>
        </button>

        <!-- Install PWA App Button (When installable) -->
        @if (pwa.canInstall()) {
          <button
            (click)="handleInstallClick()"
            class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95 animate-pulse shrink-0"
            title="Install Luanti Formspec Studio as Native App"
            [attr.aria-label]="'header.installApp' | translate"
          >
            <svg lucideDownload class="w-3.5 h-3.5"></svg>
            <span class="hidden md:inline">{{ 'header.installApp' | translate }}</span>
          </button>
        }

        <!-- Settings & PWA Modal Trigger -->
        <button
          (click)="store.openSettingsModal()"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition relative shrink-0"
          [title]="'header.settings' | translate"
          [attr.aria-label]="'header.settings' | translate"
        >
          <svg lucideSliders class="w-4 h-4"></svg>
          @if (!pwa.isOnline()) {
            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#18181c]" title="Offline"></span>
          }
        </button>

        <!-- GitHub Repository Link -->
        <a
          href="https://github.com/luanti-org/luanti"
          target="_blank"
          rel="noopener noreferrer"
          class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition hidden sm:flex items-center"
          [title]="'header.github' | translate"
          [attr.aria-label]="'header.github' | translate"
        >
          <svg lucideGitBranch class="w-4 h-4"></svg>
        </a>

        <!-- Language Switcher Dropdown -->
        <div class="relative lang-switcher-container">
          <button
            (click)="toggleLangMenu()"
            class="px-2 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition flex items-center gap-1.5 font-medium text-xs shadow-sm"
            [title]="'header.language' | translate"
            [attr.aria-label]="'header.language' | translate"
          >
            <svg lucideLanguages class="w-3.5 h-3.5 text-emerald-400"></svg>
            <span class="font-mono text-[11px] uppercase tracking-wide font-bold">{{ i18n.currentLocale() }}</span>
            <svg lucideChevronDown class="w-3 h-3 text-zinc-400 transition-transform duration-200" [class.rotate-180]="isLangMenuOpen()"></svg>
          </button>

          @if (isLangMenuOpen()) {
            <div class="absolute right-0 top-full mt-1.5 w-44 bg-[#18181c] border border-zinc-700/80 rounded-xl shadow-2xl py-1 z-50 animate-fade-in text-xs">
              @for (loc of i18n.supportedLocales; track loc.id) {
                <button
                  (click)="selectLocale(loc.id)"
                  [class.bg-emerald-950]="i18n.currentLocale() === loc.id"
                  [class.text-emerald-300]="i18n.currentLocale() === loc.id"
                  [class.text-zinc-300]="i18n.currentLocale() !== loc.id"
                  class="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-zinc-800 transition"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-5 font-mono text-[10px] font-bold text-zinc-400">{{ loc.flag }}</span>
                    <span>{{ loc.nativeName }}</span>
                  </div>
                  @if (i18n.currentLocale() === loc.id) {
                    <svg lucideCheck class="w-3.5 h-3.5 text-emerald-400"></svg>
                  }
                </button>
              }
            </div>
          }
        </div>

        <div class="hidden sm:block h-4 w-px bg-zinc-800 mx-0.5"></div>

        <!-- Export Project JSON -->
        <button
          (click)="store.exportProjectJson()"
          class="hidden sm:flex px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 transition items-center gap-1.5 font-medium text-xs shadow-sm active:scale-95"
          [title]="'header.jsonExport' | translate"
        >
          <svg lucideDownload class="w-3.5 h-3.5"></svg>
          <span class="hidden md:inline">{{ 'header.jsonExport' | translate }}</span>
        </button>

        <!-- Play / Test Interactive Prototype Mode (Figma Present Mode) -->
        <button
          (click)="store.toggleInteractiveMode()"
          [class.bg-emerald-600]="store.isInteractiveMode()"
          [class.text-white]="store.isInteractiveMode()"
          [class.bg-zinc-800]="!store.isInteractiveMode()"
          [class.text-zinc-300]="!store.isInteractiveMode()"
          class="px-2.5 py-1.5 rounded-lg border border-emerald-500/40 font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          [title]="store.isInteractiveMode() ? ('header.stopTest' | translate) : ('header.playTest' | translate)"
        >
          @if (store.isInteractiveMode()) {
            <svg lucideSquare class="w-3.5 h-3.5 fill-white"></svg>
            <span class="hidden sm:inline">{{ 'header.stopTest' | translate }}</span>
          } @else {
            <svg lucidePlay class="w-3.5 h-3.5 fill-current"></svg>
            <span class="hidden sm:inline">{{ 'header.playTest' | translate }}</span>
          }
        </button>

        <!-- Export Lua Mod / Back to Canvas Toggle Button -->
        @if (store.activeTab() === 'code') {
          <button
            (click)="store.setActiveTab('canvas')"
            class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/50 font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            [title]="'header.backToCanvas' | translate"
          >
            <svg lucideLayout class="w-3.5 h-3.5"></svg>
            <span>{{ 'header.backToCanvas' | translate }}</span>
          </button>
        } @else {
          <button
            (click)="store.setActiveTab('code')"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            [title]="'header.exportLua' | translate"
          >
            <svg lucideCode class="w-3.5 h-3.5"></svg>
            <span>{{ 'header.exportLua' | translate }}</span>
          </button>
        }

        <!-- Mobile Menu Trigger -->
        <button
          (click)="toggleMobileDrawer()"
          class="sm:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          [title]="'header.menu' | translate"
        >
          <svg lucideMenu class="w-4 h-4"></svg>
        </button>
      </div>

      <!-- Mobile Drawer Modal -->
      @if (isMobileDrawerOpen()) {
        <div
          class="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm sm:hidden animate-fade-in"
          (click)="closeMobileDrawer()"
        >
          <div
            class="w-72 h-full bg-[#18181c] border-l border-zinc-800 p-4 flex flex-col space-y-4 shadow-2xl text-zinc-100"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span class="font-semibold text-sm">{{ 'header.menu' | translate }}</span>
              <button
                (click)="closeMobileDrawer()"
                class="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <svg lucideX class="w-4 h-4"></svg>
              </button>
            </div>

            <!-- Drawer Navigation Items -->
            <div class="space-y-1.5 flex-1 overflow-y-auto">
              <button
                (click)="store.openShortcutsModal(); closeMobileDrawer()"
                class="w-full px-3 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-left flex items-center gap-2.5 text-zinc-200 transition"
              >
                <svg lucideKeyboard class="w-4 h-4 text-emerald-400"></svg>
                <span>{{ 'header.shortcuts' | translate }}</span>
              </button>

              <button
                (click)="store.openHelpModal(); closeMobileDrawer()"
                class="w-full px-3 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-left flex items-center gap-2.5 text-zinc-200 transition"
              >
                <svg lucideHelpCircle class="w-4 h-4 text-emerald-400"></svg>
                <span>{{ 'header.help' | translate }}</span>
              </button>

              <button
                (click)="store.openShareModal(); closeMobileDrawer()"
                class="w-full px-3 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-left flex items-center gap-2.5 text-zinc-200 transition"
              >
                <svg lucideShare2 class="w-4 h-4 text-emerald-400"></svg>
                <span>{{ 'header.share' | translate }}</span>
              </button>

              <button
                (click)="store.exportProjectJson(); closeMobileDrawer()"
                class="w-full px-3 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-left flex items-center gap-2.5 text-zinc-200 transition"
              >
                <svg lucideDownload class="w-4 h-4 text-emerald-400"></svg>
                <span>{{ 'header.jsonExport' | translate }}</span>
              </button>

              <a
                href="https://github.com/luanti-org/luanti"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full px-3 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-left flex items-center gap-2.5 text-zinc-200 transition"
              >
                <svg lucideGitBranch class="w-4 h-4 text-emerald-400"></svg>
                <span class="flex-1">{{ 'header.github' | translate }}</span>
                <svg lucideExternalLink class="w-3.5 h-3.5 text-zinc-500"></svg>
              </a>
            </div>

            <!-- Drawer Footer: Language Picker -->
            <div class="pt-3 border-t border-zinc-800 space-y-2">
              <span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                {{ 'header.language' | translate }}
              </span>
              <div class="grid grid-cols-3 gap-1.5">
                @for (loc of i18n.supportedLocales; track loc.id) {
                  <button
                    (click)="selectLocale(loc.id)"
                    [class.bg-emerald-600]="i18n.currentLocale() === loc.id"
                    [class.text-white]="i18n.currentLocale() === loc.id"
                    [class.bg-zinc-800]="i18n.currentLocale() !== loc.id"
                    [class.text-zinc-300]="i18n.currentLocale() !== loc.id"
                    class="py-1 px-2 rounded text-center text-xs font-mono font-medium transition"
                  >
                    {{ loc.flag }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Toast Notification for Share Link -->
      @if (store.shareToastMessage()) {
        <div class="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#18181c] border border-emerald-500/80 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
          <svg lucideCheck class="w-4 h-4 text-emerald-400"></svg>
          <span>{{ store.shareToastMessage() }}</span>
        </div>
      }
    </header>
  `,
})
export class HeaderComponent {
  readonly store = inject(EditorStore);
  readonly i18n = inject(TranslationService);
  readonly pwa = inject(PwaService);

  readonly isLangMenuOpen = signal(false);
  readonly isMobileDrawerOpen = signal(false);

  async handleInstallClick(): Promise<void> {
    const success = await this.pwa.installApp();
    if (!success && !this.pwa.isStandalone()) {
      this.store.openSettingsModal();
    }
  }

  toggleLangMenu(): void {
    this.isLangMenuOpen.update((v) => !v);
  }

  toggleMobileDrawer(): void {
    this.isMobileDrawerOpen.update((v) => !v);
  }

  closeMobileDrawer(): void {
    this.isMobileDrawerOpen.set(false);
  }

  selectLocale(locale: LocaleId): void {
    this.i18n.setLocale(locale);
    this.isLangMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.lang-switcher-container')) {
      this.isLangMenuOpen.set(false);
    }
  }
}
