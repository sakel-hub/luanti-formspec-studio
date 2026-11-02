import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorStore } from '../../core/state/editor.store';
import { FormspecElementType, WidgetMetadata } from '../../core/models/formspec.models';
import { LucidePlus, LucideSearch, LucideInfo, LucideSparkles } from '@lucide/angular';

@Component({
  selector: 'app-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, LucidePlus, LucideSearch, LucideInfo, LucideSparkles],
  template: `
    <div class="h-full flex flex-col bg-[#18181c] select-none overflow-hidden">
      <!-- Section Header -->
      <div class="px-3.5 py-2.5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#161619]">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
            <span>Widget Palette</span>
            <span class="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-mono">
              5.18
            </span>
          </h2>
          <p class="text-[10px] text-zinc-400">Click to add to canvas or drag onto workspace</p>
        </div>
        <span class="text-[10px] text-zinc-400 font-mono">
          {{ filteredWidgets().length }} items
        </span>
      </div>

      <!-- Search & Category Filters -->
      <div class="p-2.5 border-b border-zinc-800 space-y-2 shrink-0 bg-[#151518]">
        <!-- Search Input -->
        <div class="relative flex items-center">
          <svg lucideSearch class="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none"></svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search widgets (e.g. hypertip, model, list)..."
            aria-label="Search formspec widgets"
            class="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <!-- Category Filter Tabs -->
        <div class="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 text-[10px]" role="tablist" aria-label="Widget Categories">
          @for (cat of categories; track cat.id) {
            <button
              (click)="selectedCategory.set(cat.id)"
              [class.bg-emerald-600]="selectedCategory() === cat.id"
              [class.text-white]="selectedCategory() === cat.id"
              [class.bg-zinc-800]="selectedCategory() !== cat.id"
              [class.text-zinc-300]="selectedCategory() !== cat.id"
              [attr.aria-pressed]="selectedCategory() === cat.id"
              class="px-2 py-1 rounded-md shrink-0 font-medium transition hover:bg-zinc-700 hover:text-white"
            >
              {{ cat.label }}
            </button>
          }
        </div>
      </div>

      <!-- Scrollable Widgets List -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2 min-h-0">
        @if (filteredWidgets().length === 0) {
          <div class="p-6 text-center text-zinc-500 text-xs">
            No widgets match "{{ searchQuery }}"
          </div>
        }

        @for (w of filteredWidgets(); track w.type) {
          <div
            (click)="store.addNode(w.type)"
            (keydown.enter)="store.addNode(w.type)"
            (keydown.space)="store.addNode(w.type); $event.preventDefault()"
            role="button"
            tabindex="0"
            [attr.aria-label]="'Add ' + w.name + ' widget (' + w.syntax + ')'"
            class="p-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/90 focus:bg-zinc-800/90 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-zinc-800/90 hover:border-emerald-500/60 transition-all cursor-pointer group flex flex-col gap-1 active:scale-[0.99] relative"
          >
            <!-- Header Row: Syntax + Version Badges + Add Icon -->
            <div class="flex items-start justify-between gap-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 font-mono font-bold">
                  {{ w.syntax }}
                </span>

                @if (w.formspecVersion >= 11) {
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-0.5">
                    <svg lucideSparkles class="w-2.5 h-2.5"></svg>
                    v{{ w.formspecVersion }}
                  </span>
                } @else if (w.formspecVersion >= 6) {
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-950/80 text-sky-400 border border-sky-800">
                    v{{ w.formspecVersion }}
                  </span>
                } @else {
                  <span class="px-1 py-0.2 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                    v{{ w.formspecVersion }}
                  </span>
                }

                <span class="text-[9px] text-zinc-400 font-mono">
                  ({{ w.luantiVersion }})
                </span>
              </div>

              <button
                (click)="store.addNode(w.type); $event.stopPropagation()"
                class="w-5 h-5 rounded bg-zinc-800 group-hover:bg-emerald-600 text-zinc-400 group-hover:text-white flex items-center justify-center transition shrink-0"
                [attr.aria-label]="'Add ' + w.name + ' to Canvas'"
                [title]="'Add ' + w.name + ' to Canvas'"
              >
                <svg lucidePlus class="w-3.5 h-3.5"></svg>
              </button>
            </div>

            <!-- Description -->
            <div class="text-[11px] text-zinc-300 leading-tight">
              {{ w.description }}
            </div>

            <!-- Notes / Tags -->
            @if (w.notes) {
              <div class="text-[10px] text-zinc-400 flex items-center gap-1 italic">
                <svg lucideInfo class="w-3 h-3 text-zinc-500 shrink-0"></svg>
                <span>{{ w.notes }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class PaletteComponent {
  readonly store = inject(EditorStore);

  searchQuery = '';
  selectedCategory = signal<string>('all');

  readonly categories = [
    { id: 'all', label: 'All' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'inventories', label: 'Inventory' },
    { id: 'visuals', label: 'Visuals' },
    { id: 'data', label: 'Data & Tabs' },
    { id: 'containers', label: 'Containers' },
    { id: 'tooltips', label: 'Tooltips & Meta' },
  ];

  readonly widgets: WidgetMetadata[] = [
    // Buttons & Navigation
    {
      type: 'button',
      name: 'Button',
      syntax: 'button[]',
      description: 'Standard clickable UI button with click callback',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'buttons',
      notes: 'Triggers on_player_receive_fields event',
    },
    {
      type: 'button_exit',
      name: 'Button Exit',
      syntax: 'button_exit[]',
      description: 'Clickable button that automatically closes formspec',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'buttons',
      notes: 'Submits fields and dismisses modal dialog',
    },
    {
      type: 'button_url',
      name: 'Button URL',
      syntax: 'button_url[]',
      description: 'Interactive button prompting client to open external URL',
      formspecVersion: 1,
      luantiVersion: '5.0.0+',
      category: 'buttons',
      notes: 'Opens URL in client default browser safely',
    },
    {
      type: 'button_url_exit',
      name: 'Button URL Exit',
      syntax: 'button_url_exit[]',
      description: 'Prompts client to open web URL and closes formspec',
      formspecVersion: 1,
      luantiVersion: '5.0.0+',
      category: 'buttons',
      notes: 'Opens URL and closes menu dialog',
    },
    {
      type: 'image_button',
      name: 'Image Button',
      syntax: 'image_button[]',
      description: 'Button styled with image texture and label',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'buttons',
      notes: 'Supports active/pressed texture and noclip',
    },
    {
      type: 'image_button_exit',
      name: 'Image Button Exit',
      syntax: 'image_button_exit[]',
      description: 'Image button that closes formspec on click',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'buttons',
      notes: 'Submits fields and closes menu',
    },
    {
      type: 'item_image_button',
      name: 'Item Image Button',
      syntax: 'item_image_button[]',
      description: 'Button displaying registered item icon/node texture',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'buttons',
      notes: 'Inherits item tooltip description automatically',
    },

    // Inputs & Forms
    {
      type: 'field',
      name: 'Field',
      syntax: 'field[]',
      description: 'Single-line text input field',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'inputs',
      notes: 'Supports Enter key submission & default values',
    },
    {
      type: 'pwdfield',
      name: 'Password Field',
      syntax: 'pwdfield[]',
      description: 'Masked password text input field',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'inputs',
      notes: 'Hides characters behind dots/asterisks',
    },
    {
      type: 'textarea',
      name: 'Textarea',
      syntax: 'textarea[]',
      description: 'Multi-line text editor with automatic scrolling',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'inputs',
      notes: 'Word-wraps text; read-only if name is empty',
    },
    {
      type: 'checkbox',
      name: 'Checkbox',
      syntax: 'checkbox[]',
      description: 'Boolean checkbox toggle with checkmark',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'inputs',
      notes: 'Returns "true" or "false" in fields callback',
    },
    {
      type: 'dropdown',
      name: 'Dropdown',
      syntax: 'dropdown[]',
      description: 'Popup selection menu with multiple options',
      formspecVersion: 4,
      luantiVersion: '5.4.0+',
      category: 'inputs',
      notes: 'Supports index-based event handling',
    },

    // Inventories & Items
    {
      type: 'list',
      name: 'Inventory Grid',
      syntax: 'list[]',
      description: 'Interactive item slot matrix for player/node inventories',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'inventories',
      notes: 'Handles drag & drop item moves and crafts',
    },
    {
      type: 'listring',
      name: 'List Ring',
      syntax: 'listring[]',
      description: 'Connects inventory lists for shift-click fast transfer',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'inventories',
      notes: 'Routes items when Shift-clicked by player',
    },
    {
      type: 'item_image',
      name: 'Item Image',
      syntax: 'item_image[]',
      description: 'Static 3D rendered item/node icon representation',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'inventories',
      notes: 'Renders blocks, tools, and items',
    },
    {
      type: 'listcolors',
      name: 'List Colors',
      syntax: 'listcolors[]',
      description: 'Customizes inventory slot border, hover, and tooltip colors',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'inventories',
      notes: 'Applies theme colors to inventory slots',
    },
    {
      type: 'listimages',
      name: 'List Images',
      syntax: 'listimages[<slot_bgimg_normal>;<slot_bgimg_hover>]',
      description: 'Custom slot background textures and hover overlays for inventory slots',
      formspecVersion: 12,
      luantiVersion: '5.18.0+',
      category: 'inventories',
      notes: 'Added in Luanti 5.18.0 (Formspec v12) to replace flat slot colors with textured images',
    },

    // Visuals & 3D Models
    {
      type: 'model',
      name: '3D Mesh Model',
      syntax: 'model[]',
      description: 'Interactive 3D animated mesh with mouse rotation controls',
      formspecVersion: 10,
      luantiVersion: '5.13.0+',
      category: 'visuals',
      notes: 'Supports B3D/OBJ models, continuous spin, float frames',
    },
    {
      type: 'background9',
      name: '9-Slice Panel',
      syntax: 'background9[]',
      description: 'Resizable 9-slice stretchable GUI skin texture',
      formspecVersion: 2,
      luantiVersion: '5.1.0+',
      category: 'visuals',
      notes: 'Prevents corner distortion when scaling menus',
    },
    {
      type: 'background',
      name: 'Background',
      syntax: 'background[]',
      description: 'Full background image texture for formspec',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'visuals',
      notes: 'Optional auto_clip to formspec bounds',
    },
    {
      type: 'box',
      name: 'Box Rectangle',
      syntax: 'box[]',
      description: 'Colored rectangular background or accent divider',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'visuals',
      notes: 'Supports hex colors and transparency (#rrggbbaa)',
    },
    {
      type: 'image',
      name: 'Image',
      syntax: 'image[]',
      description: 'Static image display with optional 9-slice middle',
      formspecVersion: 6,
      luantiVersion: '5.6.0+',
      category: 'visuals',
      notes: 'Supports middle parameter for 9-slice scaling',
    },
    {
      type: 'animated_image',
      name: 'Animated Image',
      syntax: 'animated_image[]',
      description: 'Animated vertical frames sprite with frame rate control',
      formspecVersion: 6,
      luantiVersion: '5.6.0+',
      category: 'visuals',
      notes: 'Frame count and millisecond interval configuration',
    },

    // Typography & Labels
    {
      type: 'label',
      name: 'Label',
      syntax: 'label[]',
      description: 'Single-line or bounded area text title',
      formspecVersion: 9,
      luantiVersion: '5.12.0+',
      category: 'visuals',
      notes: 'Supports area label variant label[x,y;w,h;text]',
    },
    {
      type: 'vertlabel',
      name: 'Vertical Label',
      syntax: 'vertlabel[]',
      description: 'Vertical top-to-bottom oriented text header',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'visuals',
      notes: 'Rotated vertical orientation for side tabs/margins',
    },
    {
      type: 'hypertext',
      name: 'Hypertext',
      syntax: 'hypertext[]',
      description: 'Formatted rich text with colors, fonts, and action links',
      formspecVersion: 3,
      luantiVersion: '5.2.0+',
      category: 'visuals',
      notes: 'Supports <style>, <color>, and <action> markup tags',
    },

    // Data & Navigation
    {
      type: 'table',
      name: 'Data Table',
      syntax: 'table[]',
      description: 'Scrollable multi-column table with images, colors, and trees',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'data',
      notes: 'Configured with tableoptions[] and tablecolumns[]',
    },
    {
      type: 'textlist',
      name: 'Text List',
      syntax: 'textlist[]',
      description: 'Scrollable selectable list of text lines with color codes',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'data',
      notes: 'Supports #RRGGBB row colors and double-click events',
    },
    {
      type: 'tabheader',
      name: 'Tab Header',
      syntax: 'tabheader[]',
      description: 'Top horizontal category switching tabs',
      formspecVersion: 2,
      luantiVersion: '5.1.0+',
      category: 'data',
      notes: 'Supports custom W/H in real coordinates',
    },
    {
      type: 'scrollbar',
      name: 'Scrollbar',
      syntax: 'scrollbar[]',
      description: 'Horizontal or vertical trackbar with arrows and thumb',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'data',
      notes: 'Paired with scrollbaroptions[] or scroll_container',
    },

    // Containers & Layout
    {
      type: 'scroll_container',
      name: 'Scroll Container',
      syntax: 'scroll_container[]',
      description: 'Scrollable clipped view area linked to scrollbar with padding',
      formspecVersion: 8,
      luantiVersion: '5.10.0+',
      category: 'containers',
      notes: 'Content padding added in v8 (Luanti 5.10.0)',
    },
    {
      type: 'container',
      name: 'Container',
      syntax: 'container[]',
      description: 'Logical coordinate offset grouping for sub-elements',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'containers',
      notes: 'Nested relative coordinate displacement',
    },

    // Tooltips & Meta
    {
      type: 'hypertip',
      name: 'Hypertip (Rich Tooltip)',
      syntax: 'hypertip[]',
      description: 'Rich markup tooltip with staticPos, em width, and HTML-like formatting',
      formspecVersion: 11,
      luantiVersion: '5.17.0+',
      category: 'tooltips',
      notes: 'Brand new in Luanti 5.17 / Formspec v11! Supports markup formatting',
    },
    {
      type: 'tooltip',
      name: 'Tooltip',
      syntax: 'tooltip[]',
      description: 'Hover hint bound to an element or rectangular area',
      formspecVersion: 1,
      luantiVersion: '0.4.x+',
      category: 'tooltips',
      notes: 'Customizable background and font color strings',
    },
    {
      type: 'allow_close',
      name: 'Allow Close',
      syntax: 'allow_close[]',
      description: 'Controls whether formspec can be closed with the Escape key',
      formspecVersion: 9,
      luantiVersion: '5.12.0+',
      category: 'tooltips',
      notes: 'Set to false for mandatory dialogues or death screens',
    },
    {
      type: 'set_focus',
      name: 'Set Focus',
      syntax: 'set_focus[]',
      description: 'Directs initial keyboard focus to a named element',
      formspecVersion: 1,
      luantiVersion: '5.1.0+',
      category: 'tooltips',
      notes: 'Supports force flag for repeated formspecs',
    },
  ];

  readonly filteredWidgets = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.widgets.filter((w) => {
      const matchCat = cat === 'all' || w.category === cat;
      const matchQuery =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.syntax.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.luantiVersion.toLowerCase().includes(q) ||
        (w.notes && w.notes.toLowerCase().includes(q));

      return matchCat && matchQuery;
    });
  });
}
