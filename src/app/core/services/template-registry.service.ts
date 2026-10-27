import { Injectable } from '@angular/core';
import { STARTER_TEMPLATES, StarterTemplate } from '../models/template.models';
import { FormspecAST } from '../models/formspec.models';

@Injectable({
  providedIn: 'root',
})
export class TemplateRegistryService {
  private readonly templates: StarterTemplate[] = STARTER_TEMPLATES;

  getTemplates(): StarterTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): StarterTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  getClonedAST(templateId: string): FormspecAST | null {
    const tmpl = this.getTemplateById(templateId);
    if (!tmpl) return null;
    return JSON.parse(JSON.stringify(tmpl.ast));
  }
}
