import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStore } from './core/state/editor.store';
import { HeaderComponent } from './features/header/header.component';
import { CanvasComponent } from './features/canvas/canvas.component';
import { PaletteComponent } from './features/palette/palette.component';
import { InspectorComponent } from './features/inspector/inspector.component';
import { CodeViewComponent } from './features/code-view/code-view.component';
import { TemplateModalComponent } from './features/template-modal/template-modal.component';
import { LucideLayout, LucidePlus, LucideSliders, LucideCode } from '@lucide/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    CanvasComponent,
    PaletteComponent,
    InspectorComponent,
    CodeViewComponent,
    TemplateModalComponent,
    LucideLayout,
    LucidePlus,
    LucideSliders,
    LucideCode,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  readonly store = inject(EditorStore);
}
