# Changelog

All notable changes to the Contrast Checker will be documented in this file.

## [Unreleased]

### Added

- CVD simulation unit tests for `simulateCvd` and `getCvdContrastRatio` functions
  covering all four CVD types (protanopia, deuteranopia, tritanopia, achromatopsia)
- `displayName` to all exported React components (ToolCanvas, ToolSidebar,
  ToolToolbar, EyeDropperIcon, CheckIcon, XIcon, PlusIcon, ChevronDownIcon,
  DownloadIcon, TrashIcon) for better React DevTools debugging

## [1.5.0] - 2026-06-03

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
