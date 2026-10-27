# Luanti Formspec Studio — Code Style Guide & Best Practices

This guide establishes the architectural standards, coding conventions, quality gates, and best practices for developing and maintaining the Luanti Formspec Studio application. All future AI agents and human contributors must strictly follow these rules.

---

## 1. Quality Gates & Zero-Error Policy

### 1.1 Zero Build Errors (MANDATORY GATE)
- **MANDATORY Production Build Validation (`npm run build`)**:
  - **CRITICAL**: **Never rely solely on `npm test` or Vitest!** Vitest only compiles TypeScript spec files and completely bypasses Angular template compilation (`@angular/compiler-cli`).
  - Running `npm run build` is a **strict, non-negotiable requirement** before committing, submitting code, or marking any task as complete.
  - The build must finish with **exit code 0** and **0 compilation errors**:
    ```bash
    npm run build
    ```
  - This validates:
    - Angular HTML template type bindings (`[plugin angular-compiler]`).
    - Property existence on component classes and models.
    - Correct event handler method signatures.
    - Type safety across all template inputs and structural directives (`@if`, `@for`).
    - Valid module imports and exported members.

- **Clean Type Checking**: Run `npx tsc --noEmit` before completing any task. Type checking must pass with **0 errors**.

- **Strict Dependency & Engine Requirements**:
  - Node.js version must satisfy `>= 22.22.3` or `>= 24.15.0` as enforced by Angular CLI and `package.json`. In environments where the default Node binary is older, ensure the correct PATH is loaded (e.g. `export PATH="/Users/juraj/.nvm/versions/node/v24.16.0/bin:$PATH"`).
  - Maintain type safety across all interfaces and avoid `any` or loose type casting unless interfacing with raw untyped WebAssembly/worker callbacks.

### 1.2 Zero Runtime & Browser Console Errors
- **Clean Console**: The application must produce **zero unhandled exceptions**, zero console errors, and zero unresolved promise rejections during normal operation.
- **Defensive Error Handling**:
  - Wrap file system access (`showOpenFilePicker`, `showSaveFilePicker`), IndexedDB queries, and parser executions in safe guards with fallback states.
  - Guard against malformed formspec strings, unclosed brackets, missing semicolons, or invalid color hex values without throwing uncaught errors to the UI.
- **Deterministic Automated Tests**:
  - Run all Vitest suites using:
    ```bash
    npm test
    ```
  - All test suites (e.g. `formspec-parser.spec.ts`, `responsive-generator.spec.ts`, `editor-state.spec.ts`, `app.spec.ts`) must pass 100%.

---

## 2. DRY & Readable Architecture

### 2.1 Single Source of Truth
- **Never Duplicate Domain Models & Coordinate Math**:
  - Formspec AST interfaces, token specifications, and widget schema definitions live strictly in `src/app/core/models/formspec.models.ts`.
  - Coordinate scaling (slot units $\leftrightarrow$ screen pixels, snap calculations) must exclusively use centralized coordinate utility methods in `src/app/core/utils/coordinate.utils.ts`.
  - Formspec parsing, escaping, and serializing must exclusively use `FormspecParserService` in `src/app/core/services/formspec-parser.service.ts`.
- **Centralized Safe Storage**:
  - Never call `localStorage` directly in feature components. Always use safe storage helpers with fallbacks to handle SSR, private browsing, and quota limits gracefully.

### 2.2 Clear Separation of Concerns
1. **State Store (`src/app/core/state/`)**: Manage reactive application state via Angular Signals (`signal`, `computed`, `effect`). Expose readonly signals and explicit mutation methods (e.g. `EditorStore`).
2. **Services (`src/app/core/services/`)**: Encapsulate parser logic, code generation, template registry, and storage persistence.
3. **Components (`src/app/features/`)**: Focused purely on presentation, user input events, accessibility attributes, and UI templates.

---

## 3. Progressive Web App (PWA) & Offline-First Advantage

### 3.1 Service Worker & Offline Operation
- **Configured via `ngsw-config.json`**:
  - Prefetch application core bundles (`index.html`, `manifest.webmanifest`, CSS, JS chunks).
  - Lazy cache static assets (`/public/assets/**`, Luanti textures, icons, fonts).
- **Multi-Device Installation & App Manifest**:
  - Maintain `public/manifest.webmanifest` with standalone display mode, orientation support, high-resolution vector icon, and app shortcuts.
  - Support installation on desktop (Chrome, Edge, Safari), Android, and iOS home screens.

---

## 4. Mobile-First & Responsive UI Design

- **Tailwind CSS v4 Standards**:
  - Use responsive utility classes (`sm:`, `md:`, `lg:`, `xl:`) with a **mobile-first mindset**.
  - Default styles must target small screens (smartphones); enhance progressively for larger viewports.
- **Adaptive Layout**:
  - Mobile: Fullscreen interactive canvas with bottom navigation tabs (`Canvas`, `Widgets`, `Properties`, `Lua Code`), pinch-to-zoom HUD, and quick-add FAB.
  - Tablet/Desktop: Multi-pane docked workspace with persistent property inspector, hierarchy tree, and code editor.
- **Touch Targets & Safe Areas**:
  - Interactive touch targets must be at least **44×44px** on touch devices.
  - Respect mobile notches and home bars using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.

---

## 5. Consistent Iconography

- **Single Icon System**: Use `@lucide/angular` exclusively across the entire application:
  ```typescript
  import { LucideLayout, LucideCode, LucideDownload } from '@lucide/angular';
  ```
- **STRICTLY PROHIBITED**:
  - **No inline raw `<svg>` markup** copied from random websites.
  - **No random Unicode or emoji symbols** (e.g. ⚙️, 🔍, 📁) used as action buttons in UI controls.
- **Standardized Icon Sizing**:
  - `w-3.5 h-3.5` for compact badges, inline indicators, and metadata pills.
  - `w-4 h-4` for standard buttons, list items, and form inputs.
  - `w-5 h-5` for panel header titles, bottom nav tabs, and primary action bars.

---

## 6. Mandatory Pre-Completion Verification Checklist

Before reporting completion on ANY task, the following four gates MUST be executed and verified:

1. **Production Build Passes (MANDATORY GATE)**:
   ```bash
   npm run build
   ```
   Must complete with **exit code 0** and **zero compilation or template type errors** (`[plugin angular-compiler]`).
2. **Automated Unit Tests Pass**:
   ```bash
   npm test
   ```
   All Vitest suites must pass with 100% success rate.
3. **No Broken or Undeclared Imports**:
   Verify all imported symbols exist and are exported from their respective source files.
4. **Clean Runtime Operation**:
   Zero unhandled console exceptions or runtime crashes.
