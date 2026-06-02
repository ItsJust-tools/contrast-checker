/**
 * WCAG Contrast Ratio Calculator
 *
 * Implements the WCAG 2.1 & 2.2 contrast ratio algorithm for determining
 * accessibility compliance.
 *
 * All calculations are client-side and stateless — no server calls.
 *
 * @see https://www.w3.org/WAI/WCAG21/Techniques/calc#contrast
 * @see https://www.w3.org/TR/WCAG22/#contrast-enhanced
 */

/** WCAG 2.1 minimum contrast ratio thresholds */
const WCAG_THRESHOLDS = {
  AA: { normal: 4.5, large: 3, ui: 3 },
  AAA: { normal: 7, large: 4.5, ui: 3 },
} as const;

type WcagStandard = "AA" | "AAA";
type TextLevel = "normal" | "large" | "ui";

/**
 * Get the minimum contrast ratio required for a given WCAG level and text size.
 * @param standard - WCAG conformance level
 * @param level - Text / UI component size
 * @returns Minimum required contrast ratio
 */
function getRequiredRatio(standard: WcagStandard, level: TextLevel): number {
  const levels = WCAG_THRESHOLDS[standard] ?? WCAG_THRESHOLDS.AA;
  return levels[level] ?? WCAG_THRESHOLDS.AA.normal;
}

/**
 * Normalize a hex color string: strips '#' prefix, validates length,
 * and returns the cleaned hex digits along with parsed R/G/B values (0-1 range).
 *
 * Supports 3-digit (#RGB), 6-digit (#RRGGBB), and 8-digit (#RRGGBBAA) formats.
 * Alpha channel from 8-digit values is intentionally discarded per WCAG spec.
 *
 * @param hex - Raw hex color input (with or without '#' prefix)
 * @returns Object with cleaned hex string and parsed r/g/b components
 * @throws {Error} If the input is not a valid hex color
 */
function _normalizeHex(hex: string): { r: number; g: number; b: number; cleaned: string } {
  if (!hex || typeof hex !== "string") {
    throw new Error("Invalid hex color: must be a non-empty string");
  }

  // Remove '#' if present
  const cleaned = hex.replace(/^#/, "");

  let r: number, g: number, b: number;
  if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16) / 255;
    g = parseInt(cleaned.slice(2, 4), 16) / 255;
    b = parseInt(cleaned.slice(4, 6), 16) / 255;
  } else if (cleaned.length === 3) {
    // Shorthand hex like #fff → #ffffff
    r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
  } else if (cleaned.length === 8) {
    r = parseInt(cleaned.slice(0, 2), 16) / 255;
    g = parseInt(cleaned.slice(2, 4), 16) / 255;
    b = parseInt(cleaned.slice(4, 6), 16) / 255;
    // Alpha channel (cleaned.slice(6, 8)) is intentionally ignored
    // per WCAG spec: contrast is calculated on opaque colors only
  } else {
    throw new Error(
      `Invalid hex color format: expected 3, 6, or 8 hex digits, got ${cleaned.length} (${hex})`,
    );
  }

  // Validate parsed values are actual numbers
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Invalid hex color: non-hex characters in "${hex}"`);
  }

  return { r, g, b, cleaned };
}

/**
 * Calculate relative luminance of a color
 * Implements WCAG 2.1 relative luminance calculation
 * @param hex - Hex color value (e.g., '#ffffff' or 'ffffff')
 * @returns Relative luminance (0-1)
 * @throws {Error} If hex color format is invalid
 */
function getRelativeLuminance(hex: string): number {
  const { r, g, b } = _normalizeHex(hex);

  // Apply gamma correction using the sRGB transfer function
  const adjust = (c: number): number => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
}

/**
 * Calculate contrast ratio between two colors.
 * Uses the WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter luminance and L2 is the darker.
 *
 * @param colorA - First color (hex)
 * @param colorB - Second color (hex)
 * @returns Contrast ratio (1:1 to 21:1). Order-independent.
 * @throws {Error} If either color is invalid
 */
function getContrastRatio(colorA: string, colorB: string): number {
  const lum1 = getRelativeLuminance(colorA);
  const lum2 = getRelativeLuminance(colorB);

  const lighterLum = Math.max(lum1, lum2);
  const darkerLum = Math.min(lum1, lum2);

  return (lighterLum + 0.05) / (darkerLum + 0.05);
}

/**
 * Check WCAG compliance for a given contrast ratio.
 *
 * @param ratio - Contrast ratio (1-21)
 * @param level - Text size level
 * @param standard - WCAG standard level (defaults to AA)
 * @returns Object with `compliant` boolean and `requiredRatio`
 */
function checkCompliance(
  ratio: number,
  level: TextLevel,
  standard: WcagStandard = "AA",
): { compliant: boolean; requiredRatio: number } {
  const min = getRequiredRatio(standard, level);
  return {
    compliant: ratio >= min,
    requiredRatio: min,
  };
}

/**
 * Main contrast check function.
 * Calculates and returns pass/fail status for AA and AAA WCAG standards
 * for the given color pair.
 *
 * @param fgColor - Foreground color (hex, e.g. "#000000")
 * @param bgColor - Background color (hex, e.g. "#ffffff")
 * @param level - Text size level (defaults to 'normal')
 * @param standard - WCAG conformance level (defaults to 'AA')
 * @returns Object with contrast ratio, pass/fail for AA/AAA, and required ratio
 */
function checkContrast(
  fgColor: string,
  bgColor: string,
  level: TextLevel = "normal",
  standard: WcagStandard = "AA",
): {
  fg: string;
  bg: string;
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  level: string;
  requiredRatio: number;
} {
  const ratio = getContrastRatio(fgColor, bgColor);
  const requiredForLevel = getRequiredRatio(standard, level);
  const levelAA = getRequiredRatio("AA", level);
  const levelAAA = getRequiredRatio("AAA", level);

  return {
    fg: fgColor,
    bg: bgColor,
    ratio: Math.round(ratio * 100) / 100,
    passAA: ratio >= levelAA,
    passAAA: ratio >= levelAAA,
    level,
    requiredRatio: requiredForLevel,
  };
}

/**
 * Format contrast ratio for display.
 *
 * @param ratio - Contrast ratio
 * @returns Formatted ratio string (e.g., "4.50:1")
 */
const formatRatio = (ratio: number): string => `${ratio.toFixed(2)}:1`;

/**
 * Get color brightness category (light, medium, or dark).
 * Based on WCAG relative luminance thresholds.
 *
 * @param hex - Hex color value
 * @returns "light", "dark", or "medium" category
 */
function getBrightnessCategory(hex: string): "light" | "dark" | "medium" {
  const lum = getRelativeLuminance(hex);
  if (lum > 0.18) return "light";
  if (lum < 0.06) return "dark";
  return "medium";
}

export {
  checkContrast,
  getContrastRatio,
  getRelativeLuminance,
  checkCompliance,
  formatRatio,
  getBrightnessCategory,
  getRequiredRatio,
};