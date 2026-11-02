import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';
import { TranslationKey } from './translation.types';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly translationService: TranslationService;

  constructor(translationService?: TranslationService) {
    this.translationService = translationService ?? inject(TranslationService, { optional: true }) ?? new TranslationService();
  }

  transform(key: TranslationKey | string, params?: Record<string, string | number>): string {
    if (!key) return '';
    return this.translationService.t(key, params);
  }
}
