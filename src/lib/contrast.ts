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

export type WcagStandard = "AA" | "AAA";
export type TextLevel = "normal" | "large" | "ui";

/**
 * WCAG conformance level a contrast ratio satisfies.
 */
export type WcagLevel = "aaa" | "aa" | "fail";

/**
 * Get the minimum contrast ratio required for a given WCAG level and text size.
 * @param standard - WCAG conformance level
 * @param level - Text / UI component size
 * @returns Minimum required contrast ratio
 */
function getRequiredRatio(standard: WcagStandard, level: TextLevel): number {
  return WCAG_THRESHOLDS[standard][level];
}

/**
 * Parse a hex color string into R/G/B components (0-1 range).
 *
 * Supports 3-digit (#RGB), 6-digit (#RRGGBB), and 8-digit (#RRGGBBAA) formats.
 * Alpha channel from 8-digit values is intentionally discarded per WCAG spec.
 *
 * @param hex - Raw hex color input (with or without '#' prefix)
 * @returns Object with cleaned hex string and parsed r/g/b components
 * @throws {Error} If the input is not a valid hex color
 */
function parseHex(hex: string): {
  r: number;
  g: number;
  b: number;
  cleaned: string;
} {
  const normalized = normalizeHexColor(hex);
  const cleaned = normalized.replace(/^#/, "");
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
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
  const { r, g, b } = parseHex(hex);

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
 * Format contrast ratio for display, dropping unnecessary trailing zeros
 * (e.g. "4.5:1" instead of "4.50:1", but keeps "4.52:1").
 *
 * @param ratio - Contrast ratio
 * @param precision - Number of decimal places to preserve (default 2)
 * @returns Formatted ratio string (e.g., "4.5:1" or "4.52:1")
 */
const formatRatio = (ratio: number, precision: number = 2): string => {
  const rounded = ratio.toFixed(precision);
  const trimmed = precision > 0 ? parseFloat(rounded).toString() : rounded;
  return `${trimmed}:1`;
};

/**
 * Format a contrast ratio as a bullet summary string including pass/fail
 * for both AA and AAA normal text. Handy for quick reporting.
 *
 * @param fgColor - Foreground hex color
 * @param bgColor - Background hex color
 * @returns Short human-readable summary, e.g. "4.52:1 (AA ✓, AAA ✗)"
 */
function getRatioSummary(fgColor: string, bgColor: string): string {
  try {
    const ratio = getContrastRatio(fgColor, bgColor);
    const aa = ratio >= WCAG_THRESHOLDS.AA.normal;
    const aaa = ratio >= WCAG_THRESHOLDS.AAA.normal;
    return `${formatRatio(ratio)} (AA ${aa ? "\u2713" : "\u2717"}, AAA ${aaa ? "\u2713" : "\u2717"})`;
  } catch {
    return "Invalid colors";
  }
}

/**
 * Get color brightness category (light, medium, or dark).
 * Based on WCAG relative luminance thresholds.
 *
 * @param hex - Hex color value
 * @returns "light", "dark", or "medium" category
 */
function getBrightnessCategory(hex: string): "light" | "dark" | "medium" {
  return getLuminanceCategory(getRelativeLuminance(hex));
}

/**
 * Classify a luminance value into a brightness category.
 *
 * This is the luminance-based equivalent of {@link getBrightnessCategory}
 * but accepts a pre-computed luminance value instead of a hex string,
 * saving repeated calculations when the luminance is already available.
 *
 * @param luminance - Relative luminance value (0-1)
 * @returns "light", "dark", or "medium" category
 */
function getLuminanceCategory(luminance: number): "light" | "dark" | "medium" {
  if (luminance > 0.18) return "light";
  if (luminance < 0.06) return "dark";
  return "medium";
}

/**
 * Get a human-readable brightness label from a luminance value.
 * Capitalized form suitable for UI display (e.g. "Light", "Dark", or "Medium").
 *
 * @param luminance - Relative luminance value (0-1)
 * @returns "Light", "Dark", or "Medium"
 * @example
 * getLuminanceLabel(0.9)  // "Light"
 * getLuminanceLabel(0.01) // "Dark"
 * getLuminanceLabel(0.1)  // "Medium"
 */
function getLuminanceLabel(luminance: number): string {
  if (luminance > 0.18) return "Light";
  if (luminance < 0.06) return "Dark";
  return "Medium";
}

/**
 * Result of a suggested accessible color search.
 */
interface ColorSuggestion {
  /** The suggested hex color (e.g. "#ffffff" or "#000000") */
  color: string;
  /** The actual contrast ratio achieved with the background */
  ratio: number;
  /** Whether AA normal-text passes */
  passAA: boolean;
  /** Whether AAA normal-text passes */
  passAAA: boolean;
  /** Luminance category of the suggested color */
  brightness: "light" | "dark" | "medium";
}

/**
 * The set of candidate colors tried when suggesting an accessible counterpart.
 * Ordered by likelihood of providing sufficient contrast.
 * Includes neutral, semantic, and brand-friendly tones for diverse design needs.
 */
const SUGGESTION_PALETTE_LIGHT: readonly string[] = [
  "#ffffff",
  "#f8f9fa",
  "#e9ecef",
  "#dee2e6",
  "#ced4da",
  "#d4edda",
  "#d1ecf1",
  "#fcefb2",
  "#fff3cd",
  "#f8d7da",
  "#e8d5f5",
  "#d6eaf8",
  "#f5eef8",
  "#eaf2f8",
  "#fef9e7",
] as const;

const SUGGESTION_PALETTE_DARK: readonly string[] = [
  "#000000",
  "#212529",
  "#343a40",
  "#495057",
  "#6c757d",
  "#721c24",
  "#0c5460",
  "#856404",
  "#155724",
  "#1a1a2e",
  "#2d1b69",
  "#1b2838",
  "#3c1053",
  "#1e3a5f",
  "#4a235a",
] as const;

/**
 * Pre-computed relative luminance values for palette colors.
 * Computing these lazily on first access avoids repeated hex parsing
 * and gamma-correction on every call to suggestAccessibleColor/Pair.
 */
/**
 * Pre-computed relative luminance values for palette colors.
 * Computing these lazily on first access avoids repeated hex parsing
 * and gamma-correction across repeated calls to suggestAccessibleColor/Pair.
 *
 * A module-level singleton (null → Map on first use) is safe here because
 * palette arrays are `as const` and immutable at runtime.
 */
let paletteLuminancesCache: Map<string, number> | null = null;

function ensurePaletteCache(): Map<string, number> {
  if (paletteLuminancesCache) return paletteLuminancesCache;
  const cache = new Map<string, number>();
  for (const c of SUGGESTION_PALETTE_LIGHT) {
    cache.set(c, getRelativeLuminance(c));
  }
  for (const c of SUGGESTION_PALETTE_DARK) {
    cache.set(c, getRelativeLuminance(c));
  }
  paletteLuminancesCache = cache;
  return cache;
}

function getPaletteLuminance(color: string): number {
  const cache = ensurePaletteCache();
  const cached = cache.get(color);
  if (cached !== undefined) return cached;
  // Fall back for dynamically generated colors (e.g. adjustLightness results)
  return getRelativeLuminance(color);
}

/**
 * Fast contrast ratio using pre-cached palette luminance if available,
 * otherwise falls through to the full getContrastRatio computation.
 */
function cachedContrastRatio(colorA: string, colorB: string): number {
  const lumA = getPaletteLuminance(colorA);
  const lumB = getPaletteLuminance(colorB);
  const lighterLum = Math.max(lumA, lumB);
  const darkerLum = Math.min(lumA, lumB);
  return (lighterLum + 0.05) / (darkerLum + 0.05);
}

interface SuggestionResult {
  light: ColorSuggestion | null;
  dark: ColorSuggestion | null;
  best: ColorSuggestion | null;
}

/**
 * Given a background color, suggest accessible foreground color candidates.
 *
 * Returns the best light and dark foreground suggestions that pass WCAG AA
 * for normal text, plus whichever candidate has the best ratio overall.
 *
 * Handy for designers who need quick "can I use white/black text on this bg?"
 * answers.
 *
 * @param bgColor - Background hex color
 * @returns Object with `light`, `dark`, and `best` suggestion candidates.
 *          Each is null if no candidate in that direction meets AA normal-text.
 */
function suggestAccessibleColor(bgColor: string): SuggestionResult {
  // Pre-compute background luminance once for all palette comparisons
  let bgLum: number;
  try {
    bgLum = getRelativeLuminance(bgColor);
  } catch {
    return { light: null, dark: null, best: null };
  }

  const lightSuggestions: ColorSuggestion[] = [];
  const darkSuggestions: ColorSuggestion[] = [];

  const evaluateSuggestion = (
    fg: string,
    brightness: "light" | "dark",
  ): ColorSuggestion | null => {
    try {
      const fgLum = getPaletteLuminance(fg);
      const lighterLum = Math.max(fgLum, bgLum);
      const darkerLum = Math.min(fgLum, bgLum);
      const ratio = (lighterLum + 0.05) / (darkerLum + 0.05);
      return {
        color: fg,
        ratio: Math.round(ratio * 100) / 100,
        passAA: ratio >= WCAG_THRESHOLDS.AA.normal,
        passAAA: ratio >= WCAG_THRESHOLDS.AAA.normal,
        brightness,
      };
    } catch {
      return null;
    }
  };

  for (const fg of SUGGESTION_PALETTE_LIGHT) {
    const s = evaluateSuggestion(fg, "light");
    if (s) lightSuggestions.push(s);
  }

  for (const fg of SUGGESTION_PALETTE_DARK) {
    const s = evaluateSuggestion(fg, "dark");
    if (s) darkSuggestions.push(s);
  }

  // Pick best (highest ratio) passing candidate in each direction
  const bestLight =
    lightSuggestions
      .filter((s) => s.passAA)
      .sort((a, b) => b.ratio - a.ratio)[0] ?? null;

  const bestDark =
    darkSuggestions
      .filter((s) => s.passAA)
      .sort((a, b) => b.ratio - a.ratio)[0] ?? null;

  const all = [...lightSuggestions, ...darkSuggestions].filter((s) => s.passAA);
  const best = all.sort((a, b) => b.ratio - a.ratio)[0] ?? null;

  return { light: bestLight, dark: bestDark, best };
}

/**
 * A suggested accessible color pair (foreground + background).
 */
export interface AccessiblePair {
  /** Suggested foreground hex color */
  fg: string;
  /** Suggested background hex color */
  bg: string;
  /** Contrast ratio achieved by this pair */
  ratio: number;
  /** Whether the pair passes AA normal-text */
  passAA: boolean;
  /** Whether the pair passes AAA normal-text */
  passAAA: boolean;
  /** Description of what was adjusted */
  description: string;
}

/**
 * Suggest accessible color pairs when the current fg/bg combination
 * does not meet WCAG AA requirements.
 *
 * Tries several strategies in order of preference:
 * 1. Keep background, suggest a new foreground (from curated palette)
 * 2. Keep foreground, suggest a new background (from curated palette)
 * 3. Adjust foreground lightness toward higher contrast
 *
 * Returns up to 3 suggestions sorted by contrast ratio (highest first).
 * If the current pair already passes AA, returns an empty array.
 *
 * @param fgColor - Current foreground hex color
 * @param bgColor - Current background hex color
 * @returns Array of accessible pair suggestions (empty if already compliant)
 */
export function suggestAccessiblePair(
  fgColor: string,
  bgColor: string,
): AccessiblePair[] {
  // Pre-compute bg luminance once (used for both initial check and strategies)
  let bgLum: number;
  try {
    const currentRatio = getContrastRatio(fgColor, bgColor);
    if (currentRatio >= WCAG_THRESHOLDS.AA.normal) return [];
    bgLum = getRelativeLuminance(bgColor);
  } catch {
    return [];
  }

  const fgRgb = hexToRgb(fgColor);
  const suggestions: AccessiblePair[] = [];
  const seen = new Set<string>();

  const addSuggestion = (fg: string, bg: string, description: string) => {
    const key = `${fg}|${bg}`;
    if (seen.has(key)) return;
    try {
      const ratio = cachedContrastRatio(fg, bg);
      if (ratio < WCAG_THRESHOLDS.AA.normal) return;
      seen.add(key);
      suggestions.push({
        fg,
        bg,
        ratio: Math.round(ratio * 100) / 100,
        passAA: ratio >= WCAG_THRESHOLDS.AA.normal,
        passAAA: ratio >= WCAG_THRESHOLDS.AAA.normal,
        description,
      });
    } catch {
      // skip invalid
    }
  };

  // Strategy 1: Keep background, try curated foreground palette
  for (const fg of SUGGESTION_PALETTE_DARK) {
    addSuggestion(fg, bgColor, `Try ${fg} on current background`);
  }
  for (const fg of SUGGESTION_PALETTE_LIGHT) {
    addSuggestion(fg, bgColor, `Try ${fg} on current background`);
  }

  // Strategy 2: Keep foreground, try curated background palette
  for (const bg of SUGGESTION_PALETTE_LIGHT) {
    addSuggestion(fgColor, bg, `Try current foreground on ${bg}`);
  }
  for (const bg of SUGGESTION_PALETTE_DARK) {
    addSuggestion(fgColor, bg, `Try current foreground on ${bg}`);
  }

  // Strategy 3: Lighten/darken the foreground toward the extremes
  try {
    if (bgLum < 0.5) {
      // Dark background: try lighter foregrounds
      for (let l = 80; l <= 100; l += 5) {
        const adjusted = adjustLightness(fgRgb.r, fgRgb.g, fgRgb.b, l);
        addSuggestion(adjusted, bgColor, `Lighten foreground to ${l}%`);
      }
    } else {
      // Light background: try darker foregrounds
      for (let l = 0; l <= 20; l += 5) {
        const adjusted = adjustLightness(fgRgb.r, fgRgb.g, fgRgb.b, l);
        addSuggestion(adjusted, bgColor, `Darken foreground to ${l}%`);
      }
    }
  } catch {
    // skip adjustment strategy
  }

  // Sort by ratio descending, return top 3
  return suggestions.sort((a, b) => b.ratio - a.ratio).slice(0, 3);
}

/**
 * Internal float-precision RGB-to-HSL conversion.
 *
 * Unlike the exported {@link rgbToHsl} which rounds to integers for display,
 * this version preserves full floating-point precision for use in color
 * adjustment algorithms where rounding would cause hue/saturation drift.
 *
 * @returns Object with h (0-360), s (0-1), l (0-1) as floats
 */
function rgbToHslFloat(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) * 60;
    } else {
      h = ((rNorm - gNorm) / delta + 4) * 60;
    }
  }

  return { h, s, l };
}

/**
 * Adjust the lightness of an RGB color to a target percentage.
 * Converts to HSL using float precision, sets the lightness, and converts back.
 *
 * Uses {@link rgbToHslFloat} internally to avoid the integer rounding in
 * the display-oriented {@link rgbToHsl}, ensuring the adjusted color
 * preserves the original hue and saturation as closely as possible.
 */
function adjustLightness(
  r: number,
  g: number,
  b: number,
  targetLightness: number,
): string {
  const hsl = rgbToHslFloat(r, g, b);
  // Convert targetLightness from percentage (0-100) to float (0-1)
  const adjusted = hslToRgb(hsl.h, hsl.s * 100, targetLightness);
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${toHex(adjusted.r)}${toHex(adjusted.g)}${toHex(adjusted.b)}`;
}

/**
 * Convert HSL values to an RGB object.
 * Returns r, g, b in 0-255 range.
 */
function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }
  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

/**
 * Normalize a hex color value to a canonical 6-character hex string.
 *
 * - Strips the `#` prefix
 * - Expands 3-char shorthand (`#abc` → `#aabbcc`)
 * - Strips alpha from 8-char values (`#aabbccdd` → `#aabbcc`)
 * - Lowercases the result
 * - Returns with `#` prefix
 *
 * @param hex - Raw hex color input (with or without '#' prefix)
 * @returns Normalized 6-char hex string with '#' prefix
 * @throws {Error} If the input is not a valid hex color
 */
export function normalizeHexColor(hex: string): string {
  if (!hex || typeof hex !== "string") {
    throw new Error("Invalid hex color: must be a non-empty string");
  }
  const cleaned = hex.replace(/^#/, "").toLowerCase();

  // Use early returns for each length case — avoids a mutable variable.
  if (cleaned.length === 6) {
    if (!/^[0-9a-f]{6}$/.test(cleaned)) {
      throw new Error(`Invalid hex color: non-hex characters in "${hex}"`);
    }
    return `#${cleaned}`;
  }

  if (cleaned.length === 3) {
    // Expand 3-char shorthand to 6-char
    const expanded =
      cleaned[0] + cleaned[0] +
      cleaned[1] + cleaned[1] +
      cleaned[2] + cleaned[2];
    if (!/^[0-9a-f]{6}$/.test(expanded)) {
      throw new Error(`Invalid hex color: non-hex characters in "${hex}"`);
    }
    return `#${expanded}`;
  }

  if (cleaned.length === 8) {
    // Strip alpha channel
    const stripped = cleaned.slice(0, 6);
    if (!/^[0-9a-f]{6}$/.test(stripped)) {
      throw new Error(`Invalid hex color: non-hex characters in "${hex}"`);
    }
    return `#${stripped}`;
  }

  throw new Error(
    `Invalid hex color format: expected 3, 6, or 8 hex digits, got ${cleaned.length} (${hex})`,
  );
}

/**
 * Safely attempt to normalize a hex color without throwing.
 *
 * Useful in UI code where you want to attempt normalization
 * without wrapping every call in try/catch.
 *
 * @param hex - Raw hex color input (with or without '#' prefix)
 * @returns Normalized 6-char hex string with '#' prefix, or `null` if invalid
 */
export function tryNormalizeHexColor(hex: string): string | null {
  try {
    return normalizeHexColor(hex);
  } catch {
    return null;
  }
}

/**
 * Classify a contrast ratio into a WCAG conformance level for a given text size.
 *
 * Returns "aaa" if the ratio meets AAA requirements,
 * "aa" if it meets AA (but not AAA),
 * and "fail" if it doesn't meet AA.
 *
 * For the "ui" level, WCAG only defines a single 3:1 threshold (AA and AAA
 * are identical), so the function returns "aa" at most — AAA is not a
 * meaningful distinction for UI components.
 *
 * @param ratio - Contrast ratio (1-21)
 * @param level - Text / UI component size (defaults to 'normal')
 * @returns The highest WCAG level the ratio satisfies
 */
export function getWCAGLevel(ratio: number, level: TextLevel = "normal"): WcagLevel {
  const aaThreshold = getRequiredRatio("AA", level);
  const aaaThreshold = getRequiredRatio("AAA", level);
  // When AA and AAA thresholds are identical (e.g., UI level where both are 3:1),
  // treat AAA as unreachable and return "aa" at most
  if (aaThreshold === aaaThreshold) {
    if (ratio >= aaThreshold) return "aa";
    return "fail";
  }
  if (ratio >= aaaThreshold) return "aaa";
  if (ratio >= aaThreshold) return "aa";
  return "fail";
}

export {
  checkContrast,
  getContrastRatio,
  getRelativeLuminance,
  checkCompliance,
  formatRatio,
  getRatioSummary,
  getBrightnessCategory,
  getLuminanceCategory,
  getLuminanceLabel,
  getRequiredRatio,
  suggestAccessibleColor,
};

export type { ColorSuggestion, SuggestionResult };

// ── Color format conversion utilities ──

/**
 * Convert a hex color string to an RGB tuple.
 * Supports 3-, 6-, and 8-digit hex formats (8-digit discards alpha).
 * Returns 0,0,0 as a safe fallback for invalid input.
 *
 * @param hex - Hex color string (e.g. "#ff0000", "#f00", or "ff000080")
 * @returns Object with r, g, b values (0-255 range)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  try {
    const { r, g, b } = parseHex(hex);
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  } catch {
    return { r: 0, g: 0, b: 0 };
  }
}

/**
 * Convert an RGB tuple to an HSL tuple.
 * Returns values as integer degrees (H), percentage (S), percentage (L).
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Object with h (0-360), s (0-100), l (0-100)
 */
/**
 * Convert an RGB tuple to an HSL tuple.
 * Returns values as integer degrees (H), percentage (S), percentage (L).
 *
 * Delegates to the float-precision {@link rgbToHslFloat} internally,
 * then rounds the result for display-friendly integer output.
 * This eliminates the previously duplicated HSL conversion logic.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Object with h (0-360), s (0-100), l (0-100)
 */
export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const { h, s, l } = rgbToHslFloat(r, g, b);
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Format an RGB value as a CSS rgb() string.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns CSS rgb() string, e.g. "rgb(255, 0, 0)"
 */
export function formatRgb(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Format an HSL value as a CSS hsl() string.
 *
 * @param h - Hue (0-360)
 * @param s - Saturation percentage (0-100)
 * @param l - Lightness percentage (0-100)
 * @returns CSS hsl() string, e.g. "hsl(0, 100%, 50%)"
 */
export function formatHsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// ── Color-blindness simulation ──

/**
 * Types of color vision deficiency (CVD) supported for simulation.
 */
export type CvdType = "none" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

/**
 * CVD simulation label for display.
 */
export const CVD_LABELS: Record<CvdType, string> = {
  none: "Normal Vision",
  protanopia: "Protanopia (Red-blind)",
  deuteranopia: "Deuteranopia (Green-blind)",
  tritanopia: "Tritanopia (Blue-blind)",
  achromatopsia: "Achromatopsia (Monochrome)",
};

/**
 * Short CVD simulation label for display in compact UI contexts.
 * Used in buttons, badges, and other space-constrained elements
 * where the full CVD_LABELS description would be too verbose.
 */
export const CVD_SHORT_LABELS: Record<CvdType, string> = {
  none: "Normal",
  protanopia: "Protanopia",
  deuteranopia: "Deuteranopia",
  tritanopia: "Tritanopia",
  achromatopsia: "Monochrome",
};

/**
 * Brettel 1997 color-blindness simulation matrices (linear RGB space).
 *
 * These transform a color from LMS (long/medium/short cone response) space
 * to simulate what a person with a given CVD type would perceive.
 *
 * References:
 * - Brettel, Viénot, & Mollon (1997). "Computerized simulation of color appearance
 *   for dichromats." JOSA A, 14(10), 2647-2655.
 * - https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html
 */
const CVD_MATRICES: Record<Exclude<CvdType, "none">, number[]> = {
  protanopia: [
    0.112, 0.885, 0.003,
    0.112, 0.885, 0.003,
    0.000, 0.000, 1.000,
  ],
  deuteranopia: [
    0.292, 0.705, 0.003,
    0.292, 0.705, 0.003,
    0.000, 0.000, 1.000,
  ],
  tritanopia: [
    1.000, 0.000, 0.000,
    0.000, 1.000, 0.000,
    -0.142, 0.142, 0.000,
  ],
  achromatopsia: [
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
  ],
};

/**
 * Convert an sRGB hex color to a linear RGB array [r, g, b] (0-1 range).
 * Applies the sRGB gamma expansion (inverse companding).
 *
 * @param hex - Hex color string (e.g. "#ff0000")
 * @returns Tuple of linear RGB values in 0-1 range
 */
function srgbToLinear(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return [toLinear(r), toLinear(g), toLinear(b)];
}

/**
 * Convert linear RGB values [0-1] back to an sRGB hex color string.
 * Applies the sRGB gamma compression and clamps values to [0, 1].
 *
 * @param r - Linear red component (0-1)
 * @param g - Linear green component (0-1)
 * @param b - Linear blue component (0-1)
 * @returns sRGB hex string, e.g. "#ff0000"
 */
function linearToSrgb(r: number, g: number, b: number): string {
  const toSrgb = (c: number): number => {
    const clamped = Math.max(0, Math.min(1, c));
    const s = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(s * 255);
  };
  const rr = toSrgb(r);
  const gg = toSrgb(g);
  const bb = toSrgb(b);
  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
}

/**
 * Simulate how a hex color appears under a given type of color vision deficiency.
 *
 * Uses the Brettel 1997 method: converts sRGB → linear RGB → LMS →
 * dichromatic LMS → linear RGB → sRGB.
 *
 * @param hex - Original hex color
 * @param cvdType - Type of color vision deficiency to simulate
 * @returns Simulated hex color as seen by someone with the given CVD
 */
export function simulateCvd(hex: string, cvdType: CvdType): string {
  if (cvdType === "none") return hex;

  const matrix = CVD_MATRICES[cvdType];
  const [r, g, b] = srgbToLinear(hex);

  // Apply the 3x3 simulation matrix
  const sr = matrix[0] * r + matrix[1] * g + matrix[2] * b;
  const sg = matrix[3] * r + matrix[4] * g + matrix[5] * b;
  const sb = matrix[6] * r + matrix[7] * g + matrix[8] * b;

  return linearToSrgb(sr, sg, sb);
}

/**
 * Get the contrast ratio as it would appear under a given CVD type.
 * Useful for checking whether a color combination remains accessible
 * for users with color vision deficiencies.
 *
 * @param fg - Foreground hex color
 * @param bg - Background hex color
 * @param cvdType - CVD type to simulate
 * @returns Simulated contrast ratio (1:1 to 21:1). Returns the normal
 *          contrast ratio when cvdType is "none".
 */
export function getCvdContrastRatio(fg: string, bg: string, cvdType: CvdType): number {
  if (cvdType === "none") return getContrastRatio(fg, bg);
  const simFg = simulateCvd(fg, cvdType);
  const simBg = simulateCvd(bg, cvdType);
  return getContrastRatio(simFg, simBg);
}
