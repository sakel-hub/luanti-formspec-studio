# Luanti Formspec Studio

<h3 align="center">Luanti Formspec Studio</h3>

<p align="center">
  <strong>Visual WYSIWYG Formspec Editor, Formspec v7 Responsive Layout Engine &amp; Lua Mod Generator for Luanti</strong>
</p>

<p align="center">
  <a href="https://sakel-hub.github.io/luanti-formspec-studio/"><strong>🚀 Launch Live Web App</strong></a> &bull;
  <a href="#-key-features">Features</a> &bull;
  <a href="#-starter-templates">Starter Templates</a> &bull;
  <a href="#-formspec-v7-responsive-engine">Responsive v7 Engine</a> &bull;
  <a href="#-keyboard-shortcuts">Shortcuts</a> &bull;
  <a href="#-getting-started">Getting Started</a> &bull;
  <a href="#-contributing--translations">Contributing &amp; Translations</a>
</p>

<p align="center">
  <a href="https://github.com/sakel-hub/luanti-formspec-studio/actions/workflows/deploy.yml">
    <img src="https://github.com/sakel-hub/luanti-formspec-studio/actions/workflows/deploy.yml/badge.svg" alt="Deploy to GitHub Pages">
  </a>
  <img src="https://img.shields.io/badge/Angular-22+-dd0031.svg?logo=angular&logoColor=white" alt="Angular 22+">
  <img src="https://img.shields.io/badge/Formspec-Version%207+-059669.svg?logo=lua&logoColor=white" alt="Formspec v7+">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4">
  <img src="https://img.shields.io/badge/PWA-Offline%20Ready-5a0fc8.svg?logo=pwa&logoColor=white" alt="PWA Ready">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License MIT">
</p>

---

A modern, high-performance, offline-first Progressive Web App (PWA) built with **Angular 22+ (Signals)**, **Angular CDK**, and **Tailwind CSS v4** for visually designing, prototyping, and generating production-ready **Luanti** (formerly Minetest) formspecs with native support for **Real Coordinates**, **Formspec v7 Padding**, and **Dynamic Server-Side Responsive Breakpoints**.

---

## ✨ Key Features

### 🎨 Visual Drag-and-Drop Formspec Canvas
- **Slot-Based Virtual Canvas**: True-to-engine 1:1 real coordinate system ($1.0 \text{ unit} = 1 \text{ standard inventory slot}$).
- **Configurable Snap Grid**: Instant snapping to `0.1s`, `0.25s`, `0.5s`, or `1.0s` slot increments.
- **Dynamic Pan & Zoom**: Smooth mouse wheel zooming and touch drag panning.
- **Full Luanti v2+ Widget Suite**:
  - **Inventories**: `list[]`, `listring[]`, `listcolors[]` with square slot proportions matching real Luanti engine optics.
  - **Inputs & Triggers**: `button[]`, `button_exit[]`, `image_button[]`, `item_image_button[]`, `field[]`, `pwdfield[]`, `textarea[]`, `checkbox[]`, `dropdown[]`.
  - **Containers & Hierarchy**: `container[]` offset trees and `scroll_container[]` clipped regions with linked `scrollbar[]`.
  - **Framing & Visuals**: `box[]`, `background9[]` (9-slice stretch), `image[]`, `item_image[]`, `hypertext[]`, `model[]`.
  - **CSS-like Styling**: Direct authoring of `style[]` and `style_type[]` selectors (`bgcolor`, `textcolor`, `border`, `content_offset`).

### 📱 Responsive Formspec v7 Simulator & Anchoring Matrix
- **Screen & Touch Adaptive Telemetry**: Emulates `core.get_player_window_information(player_name)` directly in the editor:
  - **Mobile (390px, portrait / touch controls)**: Stacks elements into tabbed or single-column layouts with enlarged touch targets and overflow diagnostics.
  - **Tablet (768px)**: Balanced 2-column or dual-pane layouts.
  - **Desktop (1152px / 100%)**: Full wide-canvas workspace.
- **9-Point Placement & Anchor Matrix**: One-click preset positioning for `position[X,Y]` and `anchor[X,Y]` (Top-Left, Center HUD, Bottom Action Bar, Sidebars).
- **Edge-to-Edge Formspecs**: Native support for `padding[0,0]` in formspec version 7 to prevent arbitrary client margin downscaling.
- **Overflow Diagnostics**: Real-time bounding box calculation with visual warning badges when widgets exceed simulated screen bounds.

### 🌲 Unified Layout Tree & Inspector Split View
- **Dual-Pane Side-by-Side Hierarchy**: Layout tree at the top and property inspector at the bottom, divided by a draggable, resizable splitter bar.
- **Instant Layer Management**: Reorder z-index layers with Send to Back, Bring to Front, Move Up, and Move Down controls.
- **Widget Lock & Visibility Toggles**: Lock widgets against accidental selection or hide them while designing complex overlapping layouts.
- **Rich Specs & Tooltips Popover**: Detailed specification docs, default values, syntax examples, and engine version requirements displayed for every property.

### 🌐 Internationalization (i18n) & Accessibility (a11y)
- **6 Supported Locales**: English (`en`), Slovak (`sk`), German (`de`), French (`fr`), Spanish (`es`), and Russian (`ru`).
- **Unified Lucide Icon System**: 100% consistent, accessible iconography across all controls, tools, and dialogs.
- **WCAG 2.1 AA Accessible**: Full keyboard navigation (`Tab`, `Enter`, `Space`, `Esc`), high-contrast dark theme, minimum 44px touch targets on mobile, and standard WAI-ARIA dialogs (`role="dialog"`, `aria-modal="true"`).

### 🚀 Production-Ready Lua Code & Mod Exporter
- **Bidirectional Live Synchronization**: Edit visually on the canvas or type raw formspec strings in the code view.
- **Turnkey Mod Scaffold**: Exports clean, modular Lua code with:
  - Responsive `get_formspec(player_name)` generator function.
  - `minetest.register_on_player_receive_fields()` event handler skeleton.
  - Test chatcommand `/open_<name>` for instant in-game testing.

### ⚡ Progressive Web App (PWA) Architecture
- **100% Client-Side Privacy**: Runs entirely in the browser with zero cloud server dependencies.
- **Offline First**: Service Worker precaches all core assets, Luanti slot textures, and stylesheets.
- **PWA Installation**: Install as a standalone native desktop or mobile application with update notifications.
- **Local Persistence**: Autosaves projects to browser IndexedDB via Angular services.

---

## 📦 Starter Templates

Choose from pre-built, battle-tested Luanti templates in the **Template Picker**:

### Minetest Game (MTG) Standards
1. **Minetest Game Chest**: Classic 8×4 storage grid paired with the standard 8×4 player inventory, hotbar row, and bidirectional `listring[]` quick-transfer bindings.
2. **Minetest Game Furnace**: Standard fuel source slot, smelt input slot, output product slot, and animated fire/cook status indicators.
3. **Minetest Game Player Inventory**: Complete player craft grid (3×3), craft preview slot, player bag, and hotbar slots.

### Advanced & Custom Formspecs
4. **Reinforced Storage Chest (v7)**: Modern v7 layout with item search query field, sort/transfer action buttons, and inventory listrings.
5. **Responsive Machine / Furnace UI (Fluid v7)**: Input/fuel/output slots, progress gauges, upgrade module rack, and adaptive mobile tab fallback.
6. **Server Admin & Moderation Panel**: Tabheader navigation, online player list, moderation triggers (Kick, Ban, Freeze), and server announcement broadcast field.
7. **NPC Dialogue & Quest Trader**: Rich `hypertext[]` monologue box with inline styling, branching choice buttons, and barter inventory slots.
8. **NodeCore Minimalist Dark Theme**: Transparent backdrop (`bgcolor[;true]`), custom `style_type[button;...]` themes, and 9-slice panel frames.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
|:---:|:---|:---|
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Z</kbd> | **Undo** | Revert last canvas modification |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | **Redo** | Reapply reverted change |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | **Delete** | Delete currently selected widget |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>E</kbd> | **Export** | Open Lua Code / Mod Export Drawer |
| <kbd>1</kbd> | **Mobile View** | Switch to Mobile breakpoint preview (390px) |
| <kbd>2</kbd> | **Tablet View** | Switch to Tablet breakpoint preview (768px) |
| <kbd>3</kbd> | **Desktop View** | Switch to Desktop breakpoint preview (100%) |

---

## 🛠️ Getting Started

### Installation
```bash
# Clone the repository
git clone https://github.com/sakel-hub/luanti-formspec-studio.git
cd luanti-formspec-studio

# Ensure Node 24+
nvm use

# Install dependencies
npm install

# Start local dev server
npm start
```

### Automated Testing & Build
```bash
# Run unit test suite (Vitest)
npm run test

# Strict TypeScript compilation check
npx tsc --noEmit

# Production PWA build
npm run build
```

---

## 🤝 Contributing & Translations

Contributions are welcome! Please check our [Contributing Guidelines](CONTRIBUTING.md) for details on code style, testing, and pull requests.

To contribute translations, see the [Translation Guide](CONTRIBUTING.md#-contributing-translations) or submit an issue via the [Translation Template](https://github.com/sakel-hub/luanti-formspec-studio/issues/new?template=translation.yml).

---

## 📄 License

This project is licensed under the **MIT License** &ndash; see the [LICENSE.txt](LICENSE.txt) file for details.
