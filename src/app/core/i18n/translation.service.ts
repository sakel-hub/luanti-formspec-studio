import { Injectable, computed, inject, signal } from '@angular/core';
import {
  LocaleId,
  LocaleMeta,
  SUPPORTED_LOCALES,
  TranslationDictionary,
  TranslationKey,
} from './translation.types';
import { StorageService } from '../services/storage.service';
import { en } from './locales/en';
import { sk } from './locales/sk';
import { de } from './locales/de';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { ru } from './locales/ru';

const DICTIONARIES: Record<LocaleId, TranslationDictionary> = {
  en,
  sk,
  de,
  fr,
  es,
  ru,
};

const STORAGE_KEY = 'luanti_fs_locale';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly storage: StorageService;

  readonly supportedLocales: LocaleMeta[] = SUPPORTED_LOCALES;
  readonly currentLocale = signal<LocaleId>(this.detectInitialLocale());

  readonly currentDictionary = computed<TranslationDictionary>(() => {
    return DICTIONARIES[this.currentLocale()] || DICTIONARIES.en;
  });

  constructor(storage?: StorageService) {
    this.storage = storage ?? inject(StorageService, { optional: true }) ?? new StorageService();
    this.persistLocale(this.currentLocale());
  }

  setLocale(locale: LocaleId): void {
    if (DICTIONARIES[locale]) {
      this.currentLocale.set(locale);
      this.persistLocale(locale);
    }
  }

  private persistLocale(loc: LocaleId): void {
    try {
      this.storage.setItem(STORAGE_KEY, loc);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = loc;
      }
    } catch {
      // Ignore in restricted environments
    }
  }

  t(key: TranslationKey | string, params?: Record<string, string | number>): string {
    const dict = this.currentDictionary();
    let text = this.resolveKey(dict, key);

    if (text === undefined) {
      text = this.resolveKey(DICTIONARIES.en, key);
    }

    if (text === undefined) {
      return key;
    }

    if (params) {
      for (const [paramKey, paramVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }
    }

    return text;
  }

  private resolveKey(obj: any, path: string): string | undefined {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr === null || curr === undefined || typeof curr !== 'object') {
        return undefined;
      }
      curr = curr[part];
    }
    return typeof curr === 'string' ? curr : undefined;
  }

  private detectInitialLocale(): LocaleId {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const queryLang = params.get('lang') as LocaleId | null;
        if (queryLang && DICTIONARIES[queryLang]) {
          return queryLang;
        }
        const saved = this.storage?.getItem(STORAGE_KEY) as LocaleId | null;
        if (saved && DICTIONARIES[saved]) {
          return saved;
        }
      }
      if (typeof navigator !== 'undefined' && navigator.language) {
        const browserLang = navigator.language.split('-')[0].toLowerCase() as LocaleId;
        if (DICTIONARIES[browserLang]) {
          return browserLang;
        }
      }
    } catch {
      // Ignore
    }
    return 'en';
  }
}
