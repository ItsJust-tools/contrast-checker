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

## [Unreleased]

- Initial release of Contrast Checker v1.2.0
- WCAG AA/AAA compliance checking for color contrast ratios
- Click-to-select color feature with native color picker
- Pass/fail indicators for accessibility standards
- Support for normal text, large text, and UI component requirements
- Export results as JSON, PNG, JPEG, WebP, PDF (image export support added)
- Share via `.itsjust.json` files
- Color pickers for foreground and background colors

## [1.1.0] - 2026-05-24

### Added

- Initial implementation of contrast checker
- Basic contrast ratio calculation
- WCAG AA/AAA compliance checking
