# Luanti Formspec Studio

<h3 align="center">Luanti Formspec Studio</h3>

<p align="center">
  <strong>Visual WYSIWYG Formspec Editor, Formspec v7 Responsive Layout Engine &amp; Lua Mod Generator for Luanti</strong>
</p>

<p align="center">
  <a href="#-key-features">Features</a> &bull;
  <a href="#-starter-templates">Starter Templates</a> &bull;
  <a href="#-formspec-v7-responsive-engine">Responsive v7 Engine</a> &bull;
  <a href="#-keyboard-shortcuts">Shortcuts</a> &bull;
  <a href="#-getting-started">Getting Started</a> &bull;
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
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
- **Full Luanti v2+ Widget Suite**:
  - **Inventories**: `list[]`, `listring[]`, `listcolors[]`.
  - **Inputs & Triggers**: `button[]`, `button_exit[]`, `image_button[]`, `item_image_button[]`, `field[]`, `pwdfield[]`, `textarea[]`, `checkbox[]`, `dropdown[]`.
  - **Containers & Hierarchy**: `container[]` offset trees and `scroll_container[]` clipped regions with linked `scrollbar[]`.
  - **Framing & Visuals**: `box[]`, `background9[]` (9-slice stretch), `image[]`, `item_image[]`, `hypertext[]`.
  - **CSS-like Styling**: Direct authoring of `style[]` and `style_type[]` selectors (`bgcolor`, `textcolor`, `border`, `content_offset`).

### 📱 Responsive Formspec v7 Breakpoints Engine
- **Screen & Touch Adaptive Telemetry**: Emulates `core.get_player_window_information(player_name)` directly in the editor:
  - **Mobile / Touch (< 14 slots or touch_controls == true)**: Stacks elements into tabbed or single-column layouts with enlarged touch targets.
  - **Standard Desktop (14 – 20 slots)**: Balanced 2-column or 3-column layouts.
  - **Ultrawide (> 20 slots)**: Expands sidebars and pinned action panels.
- **Edge-to-Edge Formspecs**: Native support for `padding[0,0]` in formspec version 7 to prevent arbitrary client margin downscaling.
- **Constraint Anchoring**: Pin elements to Left, Right (`X = max_w - width - offset`), Center, or Stretch 100%.

### 🚀 Production-Ready Lua Code & Mod Exporter
- **Bidirectional Live Synchronization**: Edit visually on the canvas or type raw formspec strings in the code view.
- **Turnkey Mod Scaffold**: Exports clean, modular Lua code with:
  - Responsive `get_formspec(player_name)` generator function.
  - `minetest.register_on_player_receive_fields()` event handler skeleton.
  - Test chatcommand `/open_<name>` for instant in-game testing.

### ⚡ Progressive Web App (PWA) Architecture
- **100% Client-Side Privacy**: Runs entirely in the browser with zero cloud server dependencies.
- **Offline First**: Service Worker precaches all core assets, Luanti slot textures, and stylesheets.
- **Local Persistence**: Autosaves projects to browser IndexedDB via Dexie / Angular services.

---

## 📦 Starter Templates

Choose from pre-built, battle-tested Luanti templates in the **Template Picker**:

1. **Reinforced Storage Chest (v7)**:
   - 8×4 storage grid, item filter search field, sort/transfer action buttons, player inventory and hotbar with `listring[]` quick-transfer pairs.
2. **Responsive Machine / Furnace UI (Fluid v7)**:
   - Input/fuel/output slots, progress gauges, upgrade module rack, and adaptive mobile tab fallback.
3. **Server Admin & Moderation Panel**:
   - Tabheader navigation, online player list, moderation triggers (Kick, Ban, Freeze), and server announcement broadcast field.
4. **NPC Dialogue & Quest Trader**:
   - Rich `hypertext[]` monologue box with inline styling, branching choice buttons, and barter inventory slots.
5. **NodeCore Minimalist Dark Theme**:
   - Transparent backdrop (`bgcolor[;true]`), custom `style_type[button;...]` themes, and 9-slice panel frames.

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

### Production Build
```bash
npm run build
```

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE.txt](LICENSE.txt) for details.
