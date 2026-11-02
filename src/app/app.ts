import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStore } from './core/state/editor.store';
import { HeaderComponent } from './features/header/header.component';
import { CanvasComponent } from './features/canvas/canvas.component';
import { PaletteComponent } from './features/palette/palette.component';
import { InspectorComponent } from './features/inspector/inspector.component';
import { CodeViewComponent } from './features/code-view/code-view.component';
import { TemplateModalComponent } from './features/template-modal/template-modal.component';
import { SettingsModalComponent } from './features/settings-modal/settings-modal.component';
import { ShortcutsDialogComponent } from './features/shortcuts/shortcuts-dialog.component';
import { HelpDialogComponent } from './features/help/help-dialog.component';
import { ShareDialogComponent } from './features/share/share-dialog.component';
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
    SettingsModalComponent,
    ShortcutsDialogComponent,
    HelpDialogComponent,
    ShareDialogComponent,
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
  readonly isResizing = signal<'left' | 'right' | null>(null);

  startLeftResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set('left');

    const onMouseMove = (e: MouseEvent) => {
      this.store.setLeftPanelWidth(e.clientX);
    };

    const onMouseUp = () => {
      this.isResizing.set(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  startRightResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set('right');

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      this.store.setRightPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      this.isResizing.set(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  resetLeftWidth(): void {
    this.store.setLeftPanelWidth(280);
  }

  resetRightWidth(): void {
    this.store.setRightPanelWidth(320);
  }
}
