import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { PwaService } from './pwa.service';

describe('PwaService', () => {
  let service: PwaService;

  beforeEach(() => {
    service = new PwaService();
  });

  it('initializes with default online status', () => {
    expect(typeof service.isOnline()).toBe('boolean');
  });

  it('initializes canInstall as false by default before browser prompt', () => {
    expect(service.canInstall()).toBe(false);
  });

  it('initializes hasUpdate as false', () => {
    expect(service.hasUpdate()).toBe(false);
  });
});
