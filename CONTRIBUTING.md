# Contributing to Luanti Formspec Studio

Thank you for your interest in contributing to **Luanti Formspec Studio**! We welcome bug reports, feature suggestions, documentation enhancements, and pull requests.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: `>= 24.0.0` (matching `.nvmrc`)
- **npm**: `>= 11.0.0`
- **Git**: `>= 2.40.0`

### Initializing the Project
```bash
# Clone the repository
git clone https://github.com/sakel-hub/luanti-formspec-studio.git
cd luanti-formspec-studio

# Ensure correct Node version
nvm use

# Install dependencies
npm install

# Launch development server
npm start
```
The app will be accessible at `http://localhost:4200/`.

---

## 🧪 Testing & Validation Quality Gates

Before submitting any Pull Request, you must verify that all four mandatory quality gates pass:

1. **Production Build Validation (Zero Compiler Errors)**:
   ```bash
   npm run build
   ```
2. **Automated Unit Tests**:
   ```bash
   npm test
   ```
3. **PWA Offline Build**:
   ```bash
   npm run serve:pwa
   ```
4. **Code Style & Formatting**:
   Follow `.agents/rules/code-style-guide.md` and verify zero broken imports or TypeScript type errors.

---

## 📜 Architectural Guidelines

- **Angular Signals Only**: State mutations must flow through Angular Signals (`signal`, `computed`, `effect`).
- **DRY Formspec AST**: All parsing, AST models, and serializations must use `FormspecParserService`.
- **Iconography**: Use `@lucide/angular` exclusively. Never introduce raw SVG markup or emoji buttons.
- **Mobile-First**: Maintain responsive breakpoints and 44x44px minimum touch targets on mobile viewports.
