import { Injectable, Optional, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

export interface StorageEstimateInfo {
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
}

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt: any = null;

  readonly canInstall = signal<boolean>(false);
  readonly isStandalone = signal<boolean>(false);
  readonly isOnline = signal<boolean>(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true,
  );
  readonly hasUpdate = signal<boolean>(false);
  readonly storageInfo = signal<StorageEstimateInfo | null>(null);

  constructor(@Optional() private readonly swUpdate?: SwUpdate | null) {
    this.initPwaListeners();
    this.checkStandalone();
    this.initSwUpdates();
    this.refreshStorageEstimate();
  }

  private initPwaListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isStandalone.set(true);
    });

    window.addEventListener('online', () => {
      this.isOnline.set(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

  private checkStandalone(): void {
    if (typeof window === 'undefined') return;
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    this.isStandalone.set(isStandaloneMode);
  }

  private initSwUpdates(): void {
    if (!this.swUpdate || !this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.hasUpdate.set(true);
      });
  }

  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }
    try {
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        this.canInstall.set(false);
        this.deferredPrompt = null;
        return true;
      }
    } catch (e) {
      console.warn('PWA install prompt error:', e);
    }
    return false;
  }

  async applyUpdate(): Promise<void> {
    if (!this.swUpdate || !this.swUpdate.isEnabled) {
      if (typeof window !== 'undefined') window.location.reload();
      return;
    }
    await this.swUpdate.activateUpdate();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate || !this.swUpdate.isEnabled) return false;
    try {
      return await this.swUpdate.checkForUpdate();
    } catch {
      return false;
    }
  }

  async refreshStorageEstimate(): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usage = est.usage || 0;
        const quota = est.quota || 0;
        const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
        this.storageInfo.set({
          usageBytes: usage,
          quotaBytes: quota,
          usageFormatted: this.formatBytes(usage),
          quotaFormatted: this.formatBytes(quota),
          percentUsed: percent,
        });
      } catch {
        // Ignore
      }
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
