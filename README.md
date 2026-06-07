# Contrast Checker

A client-side WCAG contrast checker tool for testing color contrast ratios against accessibility guidelines. Check any color combination against WCAG 2.1 AA and AAA standards.

[![Version](https://img.shields.io/badge/Version-1.6.0-blue)](https://github.com/ItsJust-tools/contrast-checker)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/ItsJust-tools/contrast-checker/blob/main/LICENSE)
[![CI](https://github.com/ItsJust-tools/contrast-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsJust-tools/contrast-checker/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ItsJust-tools/contrast-checker/blob/main/CONTRIBUTING.md)
[![WCAG 2.2](https://img.shields.io/badge/WCAG-2.2-blueviolet)](https://www.w3.org/TR/WCAG22/)
[![WCAG 2.1](https://img.shields.io/badge/WCAG-2.1-blueviolet)](https://www.w3.org/TR/WCAG21/)
[![a11y](https://img.shields.io/badge/a11y-passing-brightgreen)](https://www.w3.org/WAI/)

## Features

- **WCAG 2.1 & 2.2 Compliance Checking** — Test color combinations against latest accessibility standards
- **Click-to-Select Colors** — Click any color swatch to open the native color picker
- **Live Contrast Preview** — See your contrast ratio in real-time as you adjust colors
- **Pass/Fail Indicators** — Clear visual indicators showing which WCAG standards are met
- **Combine & Compare** — Save multiple color combinations and view them in the sidebar
- **Individual Deletion** — Remove specific saved combinations without clearing the entire list
- **Brightness Information** — Display relative luminance for accurate contrast calculations
- **Text Level Support** — Check compliance for normal text, large text (18pt+ or 14pt bold), and UI components
- **Share & Export** — Export results as JSON, PNG, WebP, or PDF; share via `.itsjust.json` files
- **Dark Mode** — Full dark mode support with system preference detection
- **Keyboard Accessible** — Full keyboard navigation with focus indicators
- **Screen Reader Friendly** — ARIA labels and live regions announce contrast results
- **Short Hex (3-digit) Support** — Supports shorthand hex like `#fff` in addition to `#ffffff`
- **8-digit Hex (RGBA) Support** — Accepts 8-digit hex values (alpha channel ignored per WCAG spec)
- **Export Accuracy** — All exports use the full-precision contrast ratio for accurate records

## Live Demo

[itsjust.tools/contrast-checker](https://contrast-checker.itsjust.tools)

## Quick Start

```bash
cd contrast-checker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the tool.

## How It Works

1. **Click a color swatch** to open the native color picker
2. **Adjust colors** using the color picker or by typing hex values
3. **View real-time results**:
   - Contrast ratio (e.g., 4.52:1)
   - WCAG AA compliance (requires 4.5:1 for normal text)
   - WCAG AAA compliance (requires 7:1 for normal text)
   - Large text and UI component requirements (3:1)
4. **Save combinations** for side-by-side comparison
5. **Remove individual combinations** with the × button or clear all with a single click

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** — React framework with Turbopack
- **[React 19](https://react.dev/)** — UI library
- **[TypeScript 6](https://www.typescriptlang.org/)** — Type safety
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first CSS
- **[Vitest](https://vitest.dev/)** — Unit testing
- **[Playwright](https://playwright.dev/)** — E2E testing

## WCAG Requirements

| Text Type                       | Minimum Ratio          | Purpose                |
| ------------------------------- | ---------------------- | ---------------------- |
| Normal text (18pt or less)      | 4.5:1 (AA) / 7:1 (AAA) | Body text readability  |
| Large text (18pt+ or 14pt bold) | 3:1 (AA) / 4.5:1 (AAA) | Headings, captions     |
| UI Components                   | 3:1 (AA)               | Buttons, form elements |

> These thresholds are identical under WCAG 2.1 and WCAG 2.2 guidelines.

## Supported Formats

- **JSON** — Export contrast combinations as JSON
- **PNG / WebP** — Export screenshot of the current view
- **PDF** — Export as PDF document
- **.itsjust.json** — Share file format for preserving state

## Keyboard Navigation

| Key                 | Action                      |
| ------------------- | --------------------------- |
| `Tab` / `Shift+Tab` | Navigate between controls   |
| `Enter` / `Space`   | Activate clickable elements |
| `Esc`               | Close color picker          |
| `Ctrl+Shift+E`      | Export as JSON              |
| `Ctrl+Shift+P`      | Export as PNG               |

## Accessibility

This tool is fully accessible:

- Keyboard navigation support
- Screen reader compatible with live region announcements
- High contrast mode support
- Clear focus indicators
- ARIA labels on all interactive elements

## Scripts

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `npm run dev`        | Start development server       |
| `npm run build`      | Build for production           |
| `npm test`           | Run unit tests (Vitest)        |
| `npm run test:e2e`   | Run E2E tests (Playwright)     |
| `npm run coverage`   | Run tests with coverage report |
| `npm run lint`       | Run ESLint                     |
| `npm run format`     | Format code with Prettier      |
| `npm run deps:check` | Check for unused dependencies  |

## Project Structure

```
contrast-checker/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── lib/           # Core contrast calculation logic
│   └── tool/
│       ├── components/  # React components (canvas, sidebar, toolbar)
│       ├── exporters/   # Export plugins (PNG, WebP, PDF)
│       └── tool-definition.ts  # Tool configuration
├── packages/
│   └── core/          # Shared @itsjust/core library
├── __tests__/         # Unit and E2E tests
└── public/            # Static assets
```

## Contributing

This is an open-source project. Contributions, issues, and feature requests are welcome.
See [CONTRIBUTING.md](https://github.com/ItsJust-tools/contrast-checker/blob/main/CONTRIBUTING.md) to get started.

## License

MIT
