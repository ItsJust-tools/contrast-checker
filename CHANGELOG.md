# Changelog

All notable changes to the Contrast Checker will be documented in this file.

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

## [1.4.0] - 2026-06-02

### Added

- Clear Combinations button in sidebar to remove all saved color pairs
- Shared SVG icon components (`icons.tsx`) reducing code duplication across canvas and sidebar

### Fixed

- Sidebar compliance badges now correctly show pass/fail based on majority pass rate (>= 50%) instead of showing a checkmark when only a single combination passes
- Removed inline-duplicated CheckIcon, XIcon, and PlusIcon SVG definitions in favor of shared components

### Changed

- Updated version to 1.4.0

## [Unreleased]

### Added

- WCAG 2.2 compliance badge and references in README
- CONTRIBUTING.md with development and PR guidelines
- Missing `description` field in package.json

### Fixed

- Reordered `useState` hooks before `useCallback` that referenced their setters in `tool-canvas.tsx` to follow React hooks rules
- Removed redundant `actualRatio` field from `checkContrast` return type (`ratio` provides the display value; full precision is available via `getContrastRatio()`)

### Changed

- Updated README with expanded feature list (short hex, 8-digit hex, export accuracy)
- Added WCAG 2.2 badge alongside existing WCAG 2.1 badge

## [1.3.0] - 2026-05-31

## [1.1.0] - 2026-05-24

### Added

- Initial implementation of contrast checker
- Basic contrast ratio calculation
- WCAG AA/AAA compliance checking
