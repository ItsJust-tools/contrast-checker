# Contrast Checker

A client-side WCAG contrast checker tool for testing color contrast ratios against accessibility guidelines.

[![Version](https://img.shields.io/badge/Version-1.1.0-blue)](https://github.com/ItsJust-tools/contrast-checker)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/ItsJust-tools/contrast-checker/blob/main/LICENSE)

## Features

- **WCAG AA/AAA Compliance Checking**: Test color combinations against WCAG 2.1 accessibility standards
- **Click-to-Select Colors**: Click any color swatch to open the native color picker
- **Live Contrast Preview**: See your contrast ratio in real-time as you adjust colors
- **Pass/Fail Indicators**: Clear visual indicators showing which WCAG standards are met
- **Brightness Information**: Display percentage brightness for accurate contrast calculations
- **Text Level Support**: Check compliance for normal text, large text (18pt+ or 14pt bold), and UI components
- **Share & Export**: Export results as JSON or share via `.itsjust.json` files

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

## WCAG Requirements

| Text Type                       | Minimum Ratio          | Purpose                |
| ------------------------------- | ---------------------- | ---------------------- |
| Normal text (18pt or less)      | 4.5:1 (AA) / 7:1 (AAA) | Body text readability  |
| Large text (18pt+ or 14pt bold) | 3:1 (AA) / 4.5:1 (AAA) | Headings, captions     |
| UI Components                   | 3:1 (AA)               | Buttons, form elements |

## Supported Formats

- **JSON**: Export contrast combinations as JSON
- **.itsjust.json**: Share file format for preserving state

## Keyboard Navigation

- `Tab` / `Shift+Tab`: Navigate between controls
- `Enter` / `Space`: Activate clickable elements (color swatches)
- `Esc`: Close color picker

## Accessibility

This tool is fully accessible:

- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Clear focus indicators

## Contributing

This is an open-source project. Contributions, issues, and feature requests are welcome.

## License

MIT
