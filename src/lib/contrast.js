/**
 * WCAG Contrast Ratio Calculator
 *
 * Implements the WCAG 2.1 contrast ratio algorithm for determining
 * accessibility compliance.
 *
 * @see https://www.w3.org/WAI/WCAG21/Techniques/calc#contrast
 */

/**
 * Calculate relative luminance of a color
 * Implements WCAG 2.1 relative luminance calculation
 * @param {string} hex - Hex color value (e.g., '#ffffff' or 'ffffff')
 * @returns {number} Relative luminance (0-1)
 * @throws {Error} If hex color format is invalid
 */
function getRelativeLuminance(hex) {
  if (!hex || typeof hex !== "string") {
    throw new Error("Invalid hex color: must be a non-empty string");
  }

  // Remove '#' if present
  const cleaned = hex.replace(/^#/, "");

  // Convert to RGB
  let r, g, b;
  if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16) / 255;
    g = parseInt(cleaned.slice(2, 4), 16) / 255;
    b = parseInt(cleaned.slice(4, 6), 16) / 255;
  } else if (cleaned.length === 3) {
    // Handle shorthand hex like #fff
    r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
  } else if (cleaned.length === 8) {
    r = parseInt(cleaned.slice(0, 2), 16) / 255;
    g = parseInt(cleaned.slice(2, 4), 16) / 255;
    b = parseInt(cleaned.slice(6, 8), 16) / 255;
    // Alpha channel (cleaned.slice(4, 6)) is intentionally ignored
    // as WCAG contrast ratio is calculated on opaque colors
  } else {
    throw new Error(
      `Invalid hex color format: expected 3, 6, or 8 hex digits, got ${cleaned.length} (${hex})`,
    );
  }

  // Validate parsed values
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Invalid hex color: non-hex characters in "${hex}"`);
  }

  // Apply gamma correction (c is already 0-1 range)
  const adjust = (c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
}

/**
 * Calculate contrast ratio between two colors
 * Uses the WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05)
 * @param {string} colorA - First color (hex)
 * @param {string} colorB - Second color (hex)
 * @returns {number} Contrast ratio (1:1 to 21:1)
 * @throws {Error} If either color is invalid
 */
function getContrastRatio(colorA, colorB) {
  const lum1 = getRelativeLuminance(colorA);
  const lum2 = getRelativeLuminance(colorB);

  const lighterLum = Math.max(lum1, lum2);
  const darkerLum = Math.min(lum1, lum2);

  return (lighterLum + 0.05) / (darkerLum + 0.05);
}

/**
 * Check WCAG compliance for a given contrast ratio
 * @param {number} ratio - Contrast ratio (1-21)
 * @param {'normal' | 'large' | 'ui'} level - Text size level
 * @param {'AA' | 'AAA'} [standard='AA'] - WCAG standard level
 * @returns {{ compliant: boolean; requiredRatio: number; minRequiredRatio: number }}
 */
function checkCompliance(ratio, level, standard = "AA") {
  const requirements = {
    AA: {
      normal: 4.5,
      large: 3,
      ui: 3,
    },
    AAA: {
      normal: 7,
      large: 4.5,
      ui: 3,
    },
  };

  const min = requirements[standard]?.[level] ?? requirements.AA.normal;
  const pass = ratio >= min;

  return {
    compliant: pass,
    requiredRatio: min,
    minRequiredRatio: min,
  };
}

/**
 * Main contrast check function
 * Calculates and returns pass/fail status for AA and AAA WCAG standards
 * @param {string} fgColor - Foreground color (hex)
 * @param {string} bgColor - Background color (hex)
 * @param {'normal' | 'large' | 'ui'} [level='normal'] - Text size level
 * @returns {{
 *   fg: string,
 *   bg: string,
 *   ratio: number,
 *   passAA: boolean,
 *   passAAA: boolean,
 *   level: string,
 *   requiredRatio: number,
 *   actualRatio: number
 * }}
 */
function checkContrast(fgColor, bgColor, level = "normal") {
  const lighter = Math.max(
    getRelativeLuminance(fgColor),
    getRelativeLuminance(bgColor),
  );
  const darker = Math.min(
    getRelativeLuminance(fgColor),
    getRelativeLuminance(bgColor),
  );

  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    fg: fgColor,
    bg: bgColor,
    ratio: Math.round(ratio * 100) / 100,
    passAA: ratio >= 4.5,
    passAAA: ratio >= 7,
    level,
    requiredRatio: 4.5,
    actualRatio: ratio,
  };
}

/**
 * Generate a list of all passing combinations
 * @param {string} bgColor - Background color
 * @param {number} minContrast - Minimum contrast ratio (default 4.5)
 * @returns {{ color: string; hex: string; luminance: number }[]}
 */
function generatePassingColors(bgColor, minContrast = 4.5) {
  const bgLum = getRelativeLuminance(bgColor);
  const colors = [];
  const step = 8;
  // Pre-allocate to reduce array resizing
  const estimatedSize = Math.ceil((256 / step) ** 3);

  for (let i = 0; i <= 255; i += step) {
    for (let j = 0; j <= 255; j += step) {
      for (let k = 0; k <= 255; k += step) {
        const hex = `#${i.toString(16).padStart(2, "0")}${j.toString(16).padStart(2, "0")}${k.toString(16).padStart(2, "0")}`;
        const fgLum = getRelativeLuminance(hex);
        const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

        if (ratio >= minContrast) {
          colors.push({
            color: hex,
            hex: hex,
            luminance: fgLum,
          });
        }
      }
    }
  }

  return colors;
}

/**
 * Format contrast ratio for display
 * @param {number} ratio - Contrast ratio
 * @returns {string} Formatted ratio string (e.g., "4.50:1")
 */
function formatRatio(ratio) {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Get color brightness category (light, medium, or dark)
 * Based on WCAG relative luminance thresholds
 * @param {string} hex - Hex color value
 * @returns {'light' | 'dark' | 'medium'}
 */
function getBrightnessCategory(hex) {
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
  generatePassingColors,
};
