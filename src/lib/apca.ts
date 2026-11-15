/**
 * APCA (Accessible Perceptual Contrast Algorithm) contrast calculator.
 *
 * APCA is the contrast method proposed for WCAG 3 / Silver. Unlike the
 * WCAG 2.x contrast ratio (which is a simple luminance ratio from 1 to 21),
 * APCA returns a signed *Lightness contrast* value (Lc) that models
 * perceptual contrast for real-world polarity:
 *
 *   - **Negative Lc** → dark text on a light background (normal polarity)
 *   - **Positive Lc** → light text on a dark background (reverse polarity)
 *
 * Because perception is asymmetric, the same color pair yields different
 * magnitudes depending on polarity. The absolute value |Lc| determines which
 * font sizes the pairing is suitable for.
 *
 * This implements the reference algorithm APCA-W3 version 0.0.98G-4g.
 *
 * @see https://github.com/Myndex/SAPC-APCA
 * @see https://www.w3.org/WAI/GL/task-forces/silver/wiki/Visual_Contrast_of_Text_Subgroup
 */

// ── Constants (APCA-W3 0.0.98G-4g) ────────────────────────────────────────

/** sRGB gamma exponent used to linearize channels. */
const MAIN_TRC = 2.4;

/** Luminance coefficients (sRGB primaries, linear). */
const R_CO = 0.2126729;
const G_CO = 0.7151522;
const B_CO = 0.072175;

/** Exponents for normal polarity (light background, dark text). */
const NORM_BG = 0.56;
const NORM_TXT = 0.57;

/** Exponents for reverse polarity (dark background, light text). */
const REV_TXT = 0.62;
const REV_BG = 0.65;

/** Black soft-clamp: luminance noise threshold and clamp exponent. */
const BLK_THRS = 0.022;
const BLK_CLMP = 1.414;

/** Contrast scaling factors for both polarities. */
const SCALE_BOW = 1.14;
const SCALE_WOB = 1.14;

/** Low-contrast offsets for both polarities. */
const LO_BOW_OFFSET = 0.027;
const LO_WOB_OFFSET = 0.027;

/** Minimum perceptible luminance delta. */
const DELTA_Y_MIN = 0.0005;

/** Low-contrast clipping threshold. */
const LO_CLIP = 0.1;

// ── Types ────────────────────────────────────────────────────────────────

/** RGB channels in 0-255 range. */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * A concrete, accessible font-size / weight pairing recommendation.
 *
 * APCA defines usable minimums per font weight; each entry tells the user the
 * smallest size at which the pairing is expected to be readable.
 */
export interface ApcaFontThreshold {
  /** Human-readable label, e.g. "Body text". */
  label: string;
  /** Minimum |Lc| required for this category. */
  minLc: number;
  /** Smallest font size in CSS pixels for 400 weight. */
  px400: number;
  /** Smallest font size in CSS pixels for 700 weight. */
  px700: number;
}

/** Full APCA result for one color pairing. */
export interface ApcaResult {
  /** Signed lightness contrast, -108 to +108 (0 when below the clip threshold). */
  lc: number;
  /** Absolute |Lc|, the magnitude used for size recommendations. */
  absLc: number;
  /** "light-on-dark" or "dark-on-light". */
  polarity: ApcaPolarity;
  /** True when the pairing is too low contrast to be usable for any text. */
  fails: boolean;
  /** Font-size categories this pairing satisfies. */
  thresholds: ApcaFontThreshold[];
  /** The smallest acceptable category, or null if nothing is satisfied. */
  primary: ApcaFontThreshold | null;
  /** Human-readable one-line summary. */
  recommendation: string;
}

export type ApcaPolarity = "light-on-dark" | "dark-on-light";

// ── Font size thresholds ────────────────────────────────────────────────

/**
 * APCA lookup-table thresholds, ascending by required contrast.
 *
 * Sizes are the APCA reference minimums: weight 400 ("normal") and
 * weight 700 ("bold"). These correspond to the APCA readability
 * conformance table for "sighted users with normal vision".
 */
export const APCA_FONT_THRESHOLDS: readonly ApcaFontThreshold[] = [
  { label: "Non-text / decorative only", minLc: 30, px400: 80, px700: 64 },
  { label: "Headlines", minLc: 45, px400: 48, px700: 36 },
  { label: "Large text", minLc: 60, px400: 36, px700: 25 },
  { label: "Fluent text", minLc: 75, px400: 24, px700: 16 },
  { label: "Body text", minLc: 90, px400: 18, px700: 14 },
] as const;

// ── Core math ────────────────────────────────────────────────────────────

/** Clamp a value into the inclusive [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Parse a hex color into 0-255 RGB channels.
 *
 * Accepts `#RGB`, `#RRGGBB`, and `#RRGGBBAA` (alpha ignored). Invalid input
 * resolves to black so callers never receive NaN luminance; use
 * {@link isApcaColorValid} when validation matters.
 */
export function parseRgb(hex: string): RgbColor {
  if (typeof hex !== "string") return { r: 0, g: 0, b: 0 };
  const cleaned = hex.trim().replace(/^#/, "").toLowerCase();

  let full: string | null = null;
  if (/^[0-9a-f]{6}$/.test(cleaned)) {
    full = cleaned;
  } else if (/^[0-9a-f]{8}$/.test(cleaned)) {
    full = cleaned.slice(0, 6);
  } else if (/^[0-9a-f]{3}$/.test(cleaned)) {
    full = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (!full) return { r: 0, g: 0, b: 0 };

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Whether a string is a hex color APCA can evaluate.
 *
 * @param hex - Candidate color string
 * @returns True for `#RGB`, `#RRGGBB`, or `#RRGGBBAA` (with or without `#`)
 */
export function isApcaColorValid(hex: string): boolean {
  if (typeof hex !== "string") return false;
  const cleaned = hex.trim().replace(/^#/, "");
  return /^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cleaned);
}

/**
 * Convert one sRGB channel (0-255) to linear luminance contribution
 * using the APCA gamma exponent.
 */
function linearChannel(channel: number): number {
  return Math.pow(clamp(channel, 0, 255) / 255, MAIN_TRC);
}

/**
 * Compute APCA screen luminance Y for an RGB color.
 *
 * @param rgb - RGB channels in 0-255
 * @returns Luminance in the 0-1 range
 */
export function apcaLuminance(rgb: RgbColor): number {
  return (
    R_CO * linearChannel(rgb.r) +
    G_CO * linearChannel(rgb.g) +
    B_CO * linearChannel(rgb.b)
  );
}

/**
 * Apply the APCA black soft-clamp to a luminance value.
 *
 * Very dark colors produce unstable, perceptually false contrast values near
 * black; the clamp raises them by a power curve so that near-black text on
 * black background correctly reports near-zero contrast.
 */
function softClampY(y: number): number {
  return y > BLK_THRS ? y : y + Math.pow(BLK_THRS - y, BLK_CLMP);
}

/**
 * Compute raw APCA lightness contrast (Lc) from two luminance values.
 *
 * @param txtY - Foreground (text) luminance, 0-1
 * @param bgY - Background luminance, 0-1
 * @returns Signed Lc in roughly -108 to +108 (0 when under the clip threshold)
 */
export function apcaContrastFromLuminance(txtY: number, bgY: number): number {
  const text = softClampY(clamp(txtY, 0, 1.1));
  const background = softClampY(clamp(bgY, 0, 1.1));

  if (Math.abs(background - text) < DELTA_Y_MIN) return 0;

  let sapc: number;
  let output: number;

  if (background > text) {
    // Normal polarity: dark text on light background → negative Lc
    sapc =
      (Math.pow(background, NORM_BG) - Math.pow(text, NORM_TXT)) * SCALE_BOW;
    output = sapc < LO_CLIP ? 0 : sapc - LO_BOW_OFFSET;
  } else {
    // Reverse polarity: light text on dark background → positive Lc
    sapc = (Math.pow(background, REV_BG) - Math.pow(text, REV_TXT)) * SCALE_WOB;
    output = sapc > -LO_CLIP ? 0 : sapc + LO_WOB_OFFSET;
  }

  return output * 100;
}

/**
 * Compute the signed APCA lightness contrast between a text color and a
 * background color.
 *
 * Sign convention:
 *   - Negative → dark text on a light background
 *   - Positive → light text on a dark background
 *
 * @param textHex - Foreground / text color in hex
 * @param bgHex - Background color in hex
 * @returns Signed Lc, rounded to two decimals
 */
export function getApcaContrast(textHex: string, bgHex: string): number {
  const txtY = apcaLuminance(parseRgb(textHex));
  const bgY = apcaLuminance(parseRgb(bgHex));
  const lc = apcaContrastFromLuminance(txtY, bgY);
  return Math.round(lc * 100) / 100;
}

/**
 * Determine polarity from a signed Lc value.
 *
 * APCA-W3 sign convention:
 *   - Positive Lc → dark text on a light background (normal polarity)
 *   - Negative Lc → light text on a dark background (reverse polarity)
 *
 * @param lc - Signed lightness contrast
 * @returns "dark-on-light" when positive, otherwise "light-on-dark"
 */
export function getApcaPolarity(lc: number): ApcaPolarity {
  return lc > 0 ? "dark-on-light" : "light-on-dark";
}

/**
 * Select every font-size threshold a given |Lc| satisfies, ascending.
 *
 * @param lc - Signed lightness contrast
 * @returns Thresholds with `minLc <= |lc|`
 */
export function getApcaThresholds(lc: number): ApcaFontThreshold[] {
  const abs = Math.abs(lc);
  return APCA_FONT_THRESHOLDS.filter((t) => abs >= t.minLc);
}

/**
 * Format a signed Lc value for display, e.g. `-87.4` or `+62.1`.
 *
 * @param lc - Signed lightness contrast
 * @param digits - Decimal places (default 1)
 * @returns Signed, zero-padded-to-precision string
 */
export function formatApca(lc: number, digits = 1): string {
  const rounded = lc.toFixed(digits);
  if (Number(rounded) > 0) return `+${rounded}`;
  return rounded;
}

/**
 * Evaluate a color pairing and return the full APCA analysis.
 *
 * The "primary" threshold is the strongest category the pairing satisfies
 * (largest minLc), which is the most permissive font size the pairing allows.
 *
 * @param textHex - Foreground / text color in hex
 * @param bgHex - Background color in hex
 * @returns Complete APCA analysis object
 */
export function analyzeApca(textHex: string, bgHex: string): ApcaResult {
  const lc = getApcaContrast(textHex, bgHex);
  const absLc = Math.abs(lc);
  const polarity = getApcaPolarity(lc);
  const thresholds = getApcaThresholds(lc);
  const primary =
    thresholds.length > 0 ? thresholds[thresholds.length - 1]! : null;
  const fails = primary === null;

  let recommendation: string;
  if (!primary) {
    recommendation = "Below minimum contrast — not usable for text";
  } else if (primary.minLc >= 90) {
    recommendation = "Body text — any size from 18px (14px bold)";
  } else if (primary.minLc >= 75) {
    recommendation = "Fluent text — 24px minimum (16px bold)";
  } else if (primary.minLc >= 60) {
    recommendation = "Large text — 36px minimum (25px bold)";
  } else if (primary.minLc >= 45) {
    recommendation = "Headlines only — 48px minimum (36px bold)";
  } else {
    recommendation = "Non-text / decorative only — 80px minimum (64px bold)";
  }

  return {
    lc: Math.round(lc * 100) / 100,
    absLc: Math.round(absLc * 100) / 100,
    polarity,
    fails,
    thresholds,
    primary,
    recommendation,
  };
}

/**
 * Minimal font size (in CSS pixels) that satisfies APCA at a given weight.
 *
 * Uses the smallest passing threshold and interpolates nothing: APCA defines
 * discrete bands, so the returned size is the band's minimum.
 *
 * @param lc - Signed lightness contrast
 * @param weight - Font weight, 400 or 700 (defaults to 400)
 * @returns Minimum px size, or null when the pairing fails every threshold
 */
export function getApcaMinFontSize(
  lc: number,
  weight: 400 | 700 = 400,
): number | null {
  const thresholds = getApcaThresholds(lc);
  if (thresholds.length === 0) return null;
  const top = thresholds[thresholds.length - 1]!;
  return weight === 700 ? top.px700 : top.px400;
}
