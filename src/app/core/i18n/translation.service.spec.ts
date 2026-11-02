import { describe, it, expect, beforeEach } from 'vitest';
import { TranslationService } from './translation.service';
import { TranslatePipe } from './translate.pipe';
import { StorageService } from '../services/storage.service';

describe('TranslationService & TranslatePipe', () => {
  let service: TranslationService;
  let pipe: TranslatePipe;
  let storage: StorageService;

  beforeEach(() => {
    storage = new StorageService();
    service = new TranslationService(storage);
    pipe = new TranslatePipe(service);
    service.setLocale('en');
  });

  it('should initialize with English by default', () => {
    expect(service.currentLocale()).toBe('en');
    expect(service.t('header.title')).toBe('Formspec Studio');
  });

  it('should switch language to Slovak and translate keys', () => {
    service.setLocale('sk');
    expect(service.currentLocale()).toBe('sk');
    expect(service.t('header.projects')).toBe('Projekty');
    expect(service.t('header.templates')).toBe('Šablóny');
  });

  it('should switch language to German, French, Spanish, Russian', () => {
    service.setLocale('de');
    expect(service.t('header.projects')).toBe('Projekte');

    service.setLocale('fr');
    expect(service.t('header.projects')).toBe('Projets');

    service.setLocale('es');
    expect(service.t('header.projects')).toBe('Proyectos');

    service.setLocale('ru');
    expect(service.t('header.projects')).toBe('Проекты');
  });

  it('should fallback to English if key is missing in another language', () => {
    service.setLocale('sk');
    expect(service.t('header.title')).toBe('Formspec Studio');
  });

  it('should interpolate params correctly', () => {
    service.setLocale('en');
    const result = service.t('test.param', { count: 5 });
    // If key not present, returns key
    expect(result).toBe('test.param');
  });

  it('should translate via TranslatePipe', () => {
    service.setLocale('en');
    expect(pipe.transform('common.close')).toBe('Close');

    service.setLocale('sk');
    expect(pipe.transform('common.close')).toBe('Zavrieť');
  });
});
