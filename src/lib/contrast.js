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
 * @param {string} hex - Hex color value (e.g., '#ffffff')
 * @returns {number} Relative luminance (0-1)
 */
function getRelativeLuminance(hex) {
  // Remove '#' if present
  hex = hex.replace(/^#/, "");

  // Convert to RGB
  let r, g, b;
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16) / 255;
    g = parseInt(hex.slice(2, 4), 16) / 255;
    b = parseInt(hex.slice(4, 6), 16) / 255;
  } else if (hex.length === 8) {
    r = parseInt(hex.slice(0, 2), 16) / 255;
    g = parseInt(hex.slice(2, 4), 16) / 255;
    b = parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    throw new Error("Invalid hex color format");
  }

  // Apply gamma correction (c is already 0-1 range)
  const adjust = (c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} lighter - Lighter color (hex)
 * @param {string} darker - Darker color (hex)
 * @returns {number} Contrast ratio (1:1 to 21:1)
 */
function getContrastRatio(lighter, darker) {
  const lum1 = getRelativeLuminance(lighter);
  const lum2 = getRelativeLuminance(darker);

  const lighterLum = Math.max(lum1, lum2);
  const darkerLum = Math.min(lum1, lum2);

  return (lighterLum + 0.05) / (darkerLum + 0.05);
}

/**
 * Check WCAG compliance
 * @param {number} ratio - Contrast ratio
 * @param {'normal' | 'large' | 'ui'} level - Text size level
 * @param {'AA' | 'AAA'} standard - WCAG standard
 * @returns {{ compliant: boolean; requiredRatio: number; minRequiredRatio: number }}
 */
function checkCompliance(ratio, level, standard) {
  const requirements = {
    AA: {
      normal: { min: 4.5, large: 3, ui: 3 },
      AAA: { min: 7, large: 4.5, ui: 3 },
    },
    AAA: {
      normal: { min: 7, large: 4.5, ui: 3 },
      large: { min: 4.5, large: 3, ui: 3 },
      ui: { min: 3, large: 3, ui: 3 },
    },
  };

  const norm = requirements[standard]?.[level] || requirements.AA[level];
  const pass = ratio >= norm.min;

  return {
    compliant: pass,
    requiredRatio: norm.min,
    minRequiredRatio: norm.min,
  };
}

/**
 * Main contrast check function
 * @param {string} fgColor - Foreground color (hex)
 * @param {string} bgColor - Background color (hex)
 * @param {'normal' | 'large' | 'ui'} level - Text size level
 * @param {'AA' | 'AAA'} standard - WCAG standard (default: 'AA')
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
  // Generate colors from light to dark
  const colors = [];
  const step = 8;

  for (let i = 0; i <= 255; i += step) {
    for (let j = 0; j <= 255; j += step) {
      for (let k = 0; k <= 255; k += step) {
        const hex = `#${i.toString(16).padStart(2, "0")}${j.toString(16).padStart(2, "0")}${k.toString(16).padStart(2, "0")}`;
        const fg = hex;
        const fgLum = getRelativeLuminance(fg);
        const bgLum = getRelativeLuminance(bgColor);
        const ratio = Math.max(fgLum, bgLum) / (Math.min(fgLum, bgLum) + 0.05);

        if (ratio >= minContrast) {
          colors.push({
            color: fg,
            hex: fg,
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
 * @returns {string} Formatted string
 */
function formatRatio(ratio) {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Get color brightness category
 * @param {string} hex - Hex color
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
