# Changelog

All notable changes to the Contrast Checker will be documented in this file.

## [1.7.0] - 2026-11-15

### Added

- **Undo/Redo buttons** in the toolbar with keyboard shortcuts (Ctrl+Z / Ctrl+Y or Ctrl+Shift+Z on Mac).
  The state `useToolState` hook already supported undo/redo history, but there was no UI to access it.
  - New `UndoIcon` and `RedoIcon` SVG components in the shared icons module
  - Toolbar now renders undo/redo action buttons that disable when history is at limit
  - Keyboard shortcuts routed through the existing shortcut mapper
  - Added `undoRedo: true` to tool config features
- New keyboard shortcuts documented in tool config: Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo)
- **Graceful Clipboard API fallback** for insecure origins and permission rejections (issue #60) — copy actions now fall back to a legacy selection-based method when `navigator.clipboard` is unavailable or throws
- **Skip to Main Content bypass link** for WCAG 2.2 AAA compliance (issue #63)
- **PWA maskable icon** definition in the manifest (issue #54)
- **Print stylesheet** (`@media print`) with clean document layout rules (issue #56)
- **Playwright E2E test coverage** for core user workflows (issue #55)

### Changed

- **Version desynchronization fixed**: root `package.json` now shows version `1.7.0` matching the published release (issue #43)
- `ComplianceBadge` now accepts a `count` prop and shows a dash/"No data" when no combinations are saved, instead of misleading "0% Pass"
- **TypeScript `noUncheckedIndexedAccess`** enabled for safer array/record indexing (issue #57)
- **CSS performance**: generic `transition-all` refactored to specific composite properties (issue #64)
- **Export filenames** sanitized against invalid OS characters (issue #62)
- **Hex input UX** improved: decoupled typing from controlled prop, HSL copy buttons added, hex normalized on blur
- **ColorPreview** localInput resets when color prop changes externally

### Security

- **Dockerfile**: container now runs as dedicated non-root user (issue #50)
- **Dockerfile**: added `HEALTHCHECK` instruction (issue #51)
- **Next.js config**: added Content-Security-Policy and security response headers (issue #52)
- **Next.js config**: added `poweredByHeader: false` (issue #53)
- **CI workflow**: added concurrency group to cancel redundant runs (issue #48)

### Fixed

- **Architectural contract violation**: `deserialize` now returns `DeserializeResult<TState>` (issue #45)
- **Web Share API**: catch and suppress user abort `AbortError` (issue #61)
- **Hex input UX**: decoupled typing from controlled prop, HSL copy buttons added, hex normalized on blur
- Removed inline height from contrast-preview-bar for proper mobile responsiveness
- Removed duplicate assertion in `tool.spec.ts` (png checked twice instead of webp)

### Dependencies

- Upgraded `next` to 16.2.9, `react` to 19.2.7, `react-dom` to 19.2.7
- Upgraded `eslint` to ^10, `typescript` to ^6, `lucide-react` to ^1.17
- Various dev dependency bumps (Playwright, lint-staged, @types/node, @tailwindcss/postcss, prettier)

## [1.6.0] - 2026-06-05

### Added

- Color swap button in toolbar — swap foreground and background colors with one click
- Copy-to-clipboard buttons for hex, RGB, and HSL color values in the sidebar color reference section
- `SwapIcon` SVG component for the new swap action
- Copy Ratio button in the contrast preview section for quick ratio sharing
- Neutral "No data" state for sidebar compliance badges when no combinations exist

### Changed

- Updated version to 1.6.0
- `ComplianceBadge` now accepts a `count` prop and shows a dash/"No data" when no combinations are saved, instead of misleading "0% Pass"

## [Unreleased]

### Added

- **Undo/Redo buttons** in the toolbar with keyboard shortcuts (Ctrl+Z / Ctrl+Y or Ctrl+Shift+Z on Mac).
  The state `useToolState` hook already supported undo/redo history, but there was no UI to access it.
  - New `UndoIcon` and `RedoIcon` SVG components in the shared icons module
  - Toolbar now renders undo/redo action buttons that disable when history is at limit
  - Keyboard shortcuts routed through the existing shortcut mapper
  - Added `undoRedo: true` to tool config features
- New keyboard shortcuts documented in tool config: Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo)

## [1.6.0] - 2026-06-03

### Added

- Individual combination deletion in sidebar — remove specific saved color pairs with the × button
- How It Works section updated in README with combination management steps

### Changed

- Updated version to 1.5.0
- Improved hex validation error message to include example format (#RRGGBB)
- Removed inline onFocus/onBlur style manipulation on color swatches in favor of CSS :focus-visible approach

## [1.4.0] - 2026-06-02

### Added

- Clear Combinations button in sidebar to remove all saved color pairs
- Shared SVG icon components (`icons.tsx`) reducing code duplication across canvas and sidebar

### Fixed

- Sidebar compliance badges now correctly show pass/fail based on majority pass rate (>= 50%) instead of showing a checkmark when only a single combination passes
- Removed inline-duplicated CheckIcon, XIcon, and PlusIcon SVG definitions in favor of shared components

### Changed

- Updated version to 1.4.0

## [1.3.0] - 2026-05-31

### Added

- Support for shorthand hex colors (e.g., `#fff`)
- Input validation error highlighting for invalid hex values in canvas color picker
- Focus-visible ring on color swatches for better keyboard accessibility
- Better error messages for invalid color formats

### Fixed

- Fixed `checkCompliance` function where duplicate `AAA` key in requirements object caused undefined behavior
- Fixed `getRelativeLuminance` null/empty input handling with clear error messages

### Changed

- Optimized `generatePassingColors` by computing background luminance once instead of per iteration
- Improved JSDoc documentation across all utility functions
- Updated dependencies: eslint to ^10, typescript to ^6, lucide-react to ^1.17
- Removed misleading `cursor: pointer` from non-interactive Color Reference display elements

## [1.1.0] - 2026-05-24

### Added

- Initial implementation of contrast checker
- Basic contrast ratio calculation
- WCAG AA/AAA compliance checking
