import { describe, it, expect } from "vitest";
import {
  checkContrast,
  getContrastRatio,
  getRelativeLuminance,
  checkCompliance,
  getBrightnessCategory,
  suggestAccessibleColor,
  suggestAccessiblePair,
  normalizeHexColor,
  tryNormalizeHexColor,
  hexToRgb,
  rgbToHsl,
  formatRgb,
  formatHsl,
  formatRatio,
  getRatioSummary,
  getWCAGLevel,
} from "@/lib/contrast.js";

describe("contrast.js - WCAG Contrast Calculator", () => {
  describe("getRelativeLuminance", () => {
    it("should return correct luminance for white", () => {
      expect(getRelativeLuminance("#ffffff")).toBeCloseTo(1, 4);
    });

    it("should return correct luminance for black", () => {
      expect(getRelativeLuminance("#000000")).toBeCloseTo(0, 4);
    });

    it("should return correct luminance for gray (#808080)", () => {
      expect(getRelativeLuminance("#808080")).toBeCloseTo(0.21586, 4);
    });

    it("should handle colors without # prefix", () => {
      expect(getRelativeLuminance("ffffff")).toBeCloseTo(1, 4);
    });

    it("should calculate luminance for a mid-tone color", () => {
      const lum = getRelativeLuminance("#333333");
      expect(lum).toBeGreaterThanOrEqual(0);
      expect(lum).toBeLessThan(1);
    });
  });

  describe("getContrastRatio", () => {
    it("should return 21:1 for black on white", () => {
      const ratio = getContrastRatio("#ffffff", "#000000");
      expect(ratio).toBeCloseTo(21, 4);
    });

    it("should return 1:1 for same colors", () => {
      const ratio = getContrastRatio("#ffffff", "#ffffff");
      expect(ratio).toBeCloseTo(1, 4);
    });

    it("should return correct ratio for gray on white", () => {
      const ratio = getContrastRatio("#ffffff", "#808080");
      expect(ratio).toBeCloseTo(3.95, 2);
    });

    it("should handle order-independent calculation", () => {
      const ratio1 = getContrastRatio("#ffffff", "#000000");
      const ratio2 = getContrastRatio("#000000", "#ffffff");
      expect(ratio1).toBeCloseTo(ratio2);
    });
  });

  describe("checkContrast", () => {
    it("should return WCAG AA passing result for black on white", () => {
      const result = checkContrast("#000000", "#ffffff", "normal", "AA");
      expect(result.ratio).toBeCloseTo(21, 4);
      expect(result.passAA).toBe(true);
      expect(result.passAAA).toBe(true);
    });

    it("should return WCAG AA passing result for red (#cc0000) on white", () => {
      const result = checkContrast("#cc0000", "#ffffff", "normal", "AA");
      expect(result.passAA).toBe(true);
      expect(result.passAAA).toBe(false);
    });

    it("should return WCAG AAA passing result for white text on dark gray", () => {
      const result = checkContrast("#ffffff", "#333333", "normal", "AAA");
      expect(result.passAAA).toBe(true);
    });

    it("should handle large text requirements (3:1)", () => {
      const result = checkContrast("#cc0000", "#ffffff", "large", "AA");
      expect(result.passAA).toBe(true);
    });

    it("should handle UI component requirements (3:1)", () => {
      const result = checkContrast("#cc0000", "#ffffff", "ui", "AA");
      expect(result.passAA).toBe(true);
    });

    it("should use AA standard by default", () => {
      const result = checkContrast("#ffffff", "#333333");
      expect(result.level).toBe("normal");
      expect(result.passAA).toBe(true);
    });

    it("should format ratio correctly", () => {
      const ratio = getContrastRatio("#ffffff", "#333333");
      expect(ratio.toFixed(2)).toBe("12.63");
    });
  });

  describe("checkCompliance", () => {
    it("should correctly identify AA compliance for 4.5:1 ratio", () => {
      const result = checkCompliance(4.5, "normal", "AA");
      expect(result.compliant).toBe(true);
      expect(result.requiredRatio).toBe(4.5);
    });

    it("should correctly identify AA non-compliance for 4:1 ratio", () => {
      const result = checkCompliance(4, "normal", "AA");
      expect(result.compliant).toBe(false);
    });

    it("should correctly identify AAA compliance for 7:1 ratio", () => {
      const result = checkCompliance(7, "normal", "AAA");
      expect(result.compliant).toBe(true);
      expect(result.requiredRatio).toBe(7);
    });

    it("should correctly identify AAA non-compliance for 6:1 ratio", () => {
      const result = checkCompliance(6, "normal", "AAA");
      expect(result.compliant).toBe(false);
    });
  });

  describe("getBrightnessCategory", () => {
    it("should classify white as light", () => {
      expect(getBrightnessCategory("#ffffff")).toBe("light");
    });

    it("should classify black as dark", () => {
      expect(getBrightnessCategory("#000000")).toBe("dark");
    });

    it("should classify gray (#808080) as light (luminance > 0.18)", () => {
      expect(getBrightnessCategory("#808080")).toBe("light");
    });

    it("should classify #595959 (luminance ~0.1) as medium", () => {
      expect(getBrightnessCategory("#595959")).toBe("medium");
    });

    it("should classify #404040 (luminance ~0.05) as dark", () => {
      expect(getBrightnessCategory("#404040")).toBe("dark");
    });
  });

  describe("WCAG AA Examples", () => {
    it("black on white should pass AA and AAA", () => {
      const result = checkContrast("#000000", "#ffffff", "normal", "AA");
      expect(result.passAA).toBe(true);
      expect(result.passAAA).toBe(true);
    });

    it("white on black should pass AA and AAA", () => {
      const result = checkContrast("#ffffff", "#000000", "normal", "AA");
      expect(result.passAA).toBe(true);
      expect(result.passAAA).toBe(true);
    });

    it("gray (#333) on white should pass AA and AAA", () => {
      const result = checkContrast("#ffffff", "#333333", "normal", "AA");
      expect(result.passAA).toBe(true);
      expect(result.passAAA).toBe(true);
    });

    it("dark blue (#003366) on white should pass AA", () => {
      const result = checkContrast("#ffffff", "#003366", "normal", "AA");
      expect(result.passAA).toBe(true);
    });

    it("red (#cc0000) on white should pass AA but fail AAA", () => {
      const result = checkContrast("#ffffff", "#cc0000", "normal", "AA");
      expect(result.passAA).toBe(true);
      expect(result.passAAA).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle colors with 8-digit alpha", () => {
      const result = checkContrast("#ff000080", "#ffffff", "normal", "AA");
      expect(result).toHaveProperty("ratio");
    });

    it("should handle uppercase hex values", () => {
      const result = checkContrast("#FFFFFF", "#000000", "normal", "AA");
      expect(result.passAA).toBe(true);
    });

    it("should handle lowercase hex values", () => {
      const result = checkContrast("#ffffff", "#000000", "normal", "AA");
      expect(result.passAA).toBe(true);
    });

    it("should handle mixed case hex values", () => {
      const result = checkContrast("#FfFfFf", "#000000", "normal", "AA");
      expect(result.passAA).toBe(true);
    });

    it("should handle shorthand 3-digit hex (#RGB)", () => {
      const result = checkContrast("#fff", "#000", "normal", "AA");
      expect(result.passAA).toBe(true);
      expect(result.ratio).toBeCloseTo(21, 3);
    });

    it("should throw for empty string color", () => {
      expect(() => getRelativeLuminance("")).toThrow(
        "Invalid hex color: must be a non-empty string",
      );
    });

    it("should throw for invalid hex with non-hex characters", () => {
      expect(() => getRelativeLuminance("#gggggg")).toThrow(
        "Invalid hex color: non-hex characters",
      );
    });

    it("should throw for invalid hex length (1 digit)", () => {
      expect(() => getRelativeLuminance("#f")).toThrow(
        /expected 3, 6, or 8 hex digits/i,
      );
    });

    it("should throw for invalid hex length (2 digits)", () => {
      expect(() => getRelativeLuminance("#ff")).toThrow(
        /expected 3, 6, or 8 hex digits/i,
      );
    });

    it("should throw for invalid hex length (5 digits)", () => {
      expect(() => getRelativeLuminance("#12345")).toThrow(
        /expected 3, 6, or 8 hex digits/i,
      );
    });

    it("should throw for null input", () => {
      expect(() => getRelativeLuminance(null as unknown as string)).toThrow(
        "Invalid hex color: must be a non-empty string",
      );
    });
  });

  describe("Common Color Combinations", () => {
    const testCases: {
      fg: string;
      bg: string;
      expectedAA: boolean;
      expectedAAA: boolean;
      description: string;
    }[] = [
      {
        fg: "#000000",
        bg: "#ffffff",
        expectedAA: true,
        expectedAAA: true,
        description: "Black on white",
      },
      {
        fg: "#ffffff",
        bg: "#000000",
        expectedAA: true,
        expectedAAA: true,
        description: "White on black",
      },
      {
        fg: "#333333",
        bg: "#ffffff",
        expectedAA: true,
        expectedAAA: true,
        description: "Dark gray on white",
      },
      {
        fg: "#ffffff",
        bg: "#333333",
        expectedAA: true,
        expectedAAA: true,
        description: "White on dark gray",
      },
      {
        fg: "#808080",
        bg: "#ffffff",
        expectedAA: false,
        expectedAAA: false,
        description: "Gray on white (3.95:1)",
      },
      {
        fg: "#000080",
        bg: "#ffffff",
        expectedAA: true,
        expectedAAA: true,
        description: "Dark blue on white",
      },
      {
        fg: "#800000",
        bg: "#ffffff",
        expectedAA: true,
        expectedAAA: true,
        description: "Dark red on white",
      },
      {
        fg: "#000000",
        bg: "#c0c0c0",
        expectedAA: true,
        expectedAAA: true,
        description: "Black on silver",
      },
    ];

    testCases.forEach((testCase) => {
      it(`should ${testCase.description}`, () => {
        const result = checkContrast(testCase.fg, testCase.bg, "normal", "AA");
        expect(result.passAA).toBe(testCase.expectedAA);
        expect(result.passAAA).toBe(testCase.expectedAAA);
      });
    });
  });

describe("normalizeHexColor", () => {
    it("should preserve valid 6-char hex with #", () => {
      expect(normalizeHexColor("#ff0000")).toBe("#ff0000");
    });

    it("should preserve valid 6-char hex without #", () => {
      expect(normalizeHexColor("ff0000")).toBe("#ff0000");
    });

    it("should expand 3-char shorthand to 6-char", () => {
      expect(normalizeHexColor("#fff")).toBe("#ffffff");
      expect(normalizeHexColor("#f00")).toBe("#ff0000");
      expect(normalizeHexColor("abc")).toBe("#aabbcc");
    });

    it("should strip alpha from 8-char hex", () => {
      expect(normalizeHexColor("#ff000080")).toBe("#ff0000");
      expect(normalizeHexColor("#aabbccdd")).toBe("#aabbcc");
    });

    it("should lowercase uppercase hex", () => {
      expect(normalizeHexColor("#FF0000")).toBe("#ff0000");
      expect(normalizeHexColor("#ABC")).toBe("#aabbcc");
    });

    it("should throw for empty string", () => {
      expect(() => normalizeHexColor("")).toThrow(
        "Invalid hex color: must be a non-empty string",
      );
    });

    it("should throw for invalid length (1 digit)", () => {
      expect(() => normalizeHexColor("#f")).toThrow(
        /expected 3, 6, or 8 hex digits/i,
      );
    });

    it("should throw for invalid length (5 digits)", () => {
      expect(() => normalizeHexColor("#12345")).toThrow(
        /expected 3, 6, or 8 hex digits/i,
      );
    });

    it("should throw for null input", () => {
      expect(() => normalizeHexColor(null as unknown as string)).toThrow(
        "Invalid hex color: must be a non-empty string",
      );
    });
  });

  describe("tryNormalizeHexColor", () => {
    it("should return normalized color for valid 6-digit hex", () => {
      expect(tryNormalizeHexColor("#ff0000")).toBe("#ff0000");
      expect(tryNormalizeHexColor("#ffffff")).toBe("#ffffff");
      expect(tryNormalizeHexColor("#000000")).toBe("#000000");
    });

    it("should return normalized color for 3-digit shorthand", () => {
      expect(tryNormalizeHexColor("#fff")).toBe("#ffffff");
      expect(tryNormalizeHexColor("#f00")).toBe("#ff0000");
      expect(tryNormalizeHexColor("abc")).toBe("#aabbcc");
    });

    it("should strip alpha from 8-digit hex", () => {
      expect(tryNormalizeHexColor("#ff000080")).toBe("#ff0000");
    });

    it("should lowercase uppercase hex", () => {
      expect(tryNormalizeHexColor("#FF0000")).toBe("#ff0000");
    });

    it("should return null for empty string", () => {
      expect(tryNormalizeHexColor("")).toBeNull();
    });

    it("should return null for invalid hex characters", () => {
      expect(tryNormalizeHexColor("#ffgg00")).toBeNull();
      expect(tryNormalizeHexColor("zzz")).toBeNull();
    });

    it("should return null for invalid length", () => {
      expect(tryNormalizeHexColor("#f")).toBeNull();
      expect(tryNormalizeHexColor("#12345")).toBeNull();
    });

    it("should return null for null input", () => {
      expect(tryNormalizeHexColor(null as unknown as string)).toBeNull();
    });
  });

  describe("suggestAccessibleColor", () => {
    it("should suggest white for a dark background", () => {
      const result = suggestAccessibleColor("#000000");
      expect(result.best).not.toBeNull();
      expect(result.best!.passAA).toBe(true);
      expect(result.best!.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("should suggest black for a light background", () => {
      const result = suggestAccessibleColor("#ffffff");
      expect(result.best).not.toBeNull();
      expect(result.best!.passAA).toBe(true);
      expect(result.best!.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("should return a light candidate for a dark background", () => {
      const result = suggestAccessibleColor("#333333");
      expect(result.light).not.toBeNull();
    });

    it("should return white as best suggestion for very dark bg", () => {
      const result = suggestAccessibleColor("#0a0a0a");
      expect(result.best?.color).toBe("#ffffff");
      expect(result.best!.passAAA).toBe(true);
    });

    it("should return black as best suggestion for very light bg", () => {
      const result = suggestAccessibleColor("#ffffff");
      expect(result.best?.color).toBe("#000000");
      expect(result.best!.passAAA).toBe(true);
    });

    it("should handle mid-tone backgrounds", () => {
      const result = suggestAccessibleColor("#808080");
      expect(result.best).not.toBeNull();
      expect(result.best!.passAA).toBe(true);
    });

    it("should return light candidate with correct brightness label", () => {
      const result = suggestAccessibleColor("#1a1a2e");
      expect(result.light).not.toBeNull();
      expect(result.light!.brightness).toBe("light");
    });

    it("should not crash on an invalid background hex", () => {
      const result = suggestAccessibleColor("invalid");
      expect(result.light).toBeNull();
      expect(result.dark).toBeNull();
      expect(result.best).toBeNull();
    });

    it("should suggest a light foreground that passes AA", () => {
      const result = suggestAccessibleColor("#0d1117");
      expect(result.light).not.toBeNull();
      expect(result.light!.passAA).toBe(true);
    });

    it("should suggest a dark foreground that passes AA when bg is light", () => {
      const result = suggestAccessibleColor("#f0f0f0");
      expect(result.dark).not.toBeNull();
      expect(result.dark!.passAA).toBe(true);
    });
  });

  describe("hexToRgb", () => {
    it("should convert #ff0000 to { r: 255, g: 0, b: 0 }", () => {
      expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("should convert #000000 to { r: 0, g: 0, b: 0 }", () => {
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("should convert #ffffff to { r: 255, g: 255, b: 255 }", () => {
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("should handle 3-digit shorthand (#f00 → #ff0000)", () => {
      expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("should handle 8-digit hex by discarding alpha", () => {
      expect(hexToRgb("#ff000080")).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("should handle hex without # prefix", () => {
      expect(hexToRgb("00ff00")).toEqual({ r: 0, g: 255, b: 0 });
    });

    it("should return { r: 0, g: 0, b: 0 } for invalid hex", () => {
      expect(hexToRgb("invalid")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("should return { r: 0, g: 0, b: 0 } for empty string", () => {
      expect(hexToRgb("")).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe("rgbToHsl", () => {
    it("should convert black (0,0,0) to { h: 0, s: 0, l: 0 }", () => {
      expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
    });

    it("should convert white (255,255,255) to { h: 0, s: 0, l: 100 }", () => {
      expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
    });

    it("should convert red (255,0,0) to { h: 0, s: 100, l: 50 }", () => {
      expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    });

    it("should convert green (0,255,0) to { h: 120, s: 100, l: 50 }", () => {
      expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
    });

    it("should convert blue (0,0,255) to { h: 240, s: 100, l: 50 }", () => {
      expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
    });

    it("should convert gray (128,128,128) to { h: 0, s: 0, l: 50 }", () => {
      expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
    });

    it("should handle mid-tone purple (128,0,128)", () => {
      const result = rgbToHsl(128, 0, 128);
      expect(result.h).toBe(300);
      expect(result.s).toBe(100);
      expect(result.l).toBe(25);
    });

    it("should handle orange (255,165,0)", () => {
      const result = rgbToHsl(255, 165, 0);
      expect(result.h).toBe(39);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });
  });

  describe("formatRgb", () => {
    it("should format rgb(255, 0, 0) correctly", () => {
      expect(formatRgb(255, 0, 0)).toBe("rgb(255, 0, 0)");
    });

    it("should format rgb(0, 0, 0) correctly", () => {
      expect(formatRgb(0, 0, 0)).toBe("rgb(0, 0, 0)");
    });

    it("should format rgb(128, 128, 128) correctly", () => {
      expect(formatRgb(128, 128, 128)).toBe("rgb(128, 128, 128)");
    });
  });

  describe("formatHsl", () => {
    it("should format hsl(0, 100%, 50%) correctly", () => {
      expect(formatHsl(0, 100, 50)).toBe("hsl(0, 100%, 50%)");
    });

    it("should format hsl(120, 100%, 50%) correctly", () => {
      expect(formatHsl(120, 100, 50)).toBe("hsl(120, 100%, 50%)");
    });

    it("should format hsl(0, 0%, 0%) correctly", () => {
      expect(formatHsl(0, 0, 0)).toBe("hsl(0, 0%, 0%)");
    });
  });

  describe("formatRatio", () => {
    it("should format 21.0 as '21:1' (drops unnecessary trailing zeros)", () => {
      expect(formatRatio(21)).toBe("21:1");
    });

    it("should format 4.5 as '4.5:1'", () => {
      expect(formatRatio(4.5)).toBe("4.5:1");
    });

    it("should format 4.52 as '4.52:1'", () => {
      expect(formatRatio(4.52)).toBe("4.52:1");
    });

    it("should format 1.0 as '1:1'", () => {
      expect(formatRatio(1)).toBe("1:1");
    });

    it("should format 3.0 as '3:1'", () => {
      expect(formatRatio(3)).toBe("3:1");
    });

    it("should format 7.0 as '7:1'", () => {
      expect(formatRatio(7)).toBe("7:1");
    });

    it("should format with custom precision", () => {
      expect(formatRatio(4.567, 3)).toBe("4.567:1");
    });

    it("should format 0 precision", () => {
      expect(formatRatio(4.5, 0)).toBe("5:1");
    });
  });

  describe("getRatioSummary", () => {
    it("should return passing summary for black on white", () => {
      const summary = getRatioSummary("#000000", "#ffffff");
      expect(summary).toBe("21:1 (AA \u2713, AAA \u2713)");
    });

    it("should return failing AAA for red on white", () => {
      const summary = getRatioSummary("#cc0000", "#ffffff");
      expect(summary).toContain("AA \u2713");
      expect(summary).toContain("AAA \u2717");
    });

    it("should return 'Invalid colors' for invalid input", () => {
      expect(getRatioSummary("invalid", "#ffffff")).toBe("Invalid colors");
    });
  });

  describe("getWCAGLevel", () => {
    it("should return 'aaa' for ratio >= 7", () => {
      expect(getWCAGLevel(21)).toBe("aaa");
      expect(getWCAGLevel(7)).toBe("aaa");
      expect(getWCAGLevel(8)).toBe("aaa");
    });

    it("should return 'aa' for ratio >= 4.5 and < 7", () => {
      expect(getWCAGLevel(4.5)).toBe("aa");
      expect(getWCAGLevel(5)).toBe("aa");
      expect(getWCAGLevel(6.9)).toBe("aa");
    });

    it("should return 'fail' for ratio < 4.5", () => {
      expect(getWCAGLevel(3)).toBe("fail");
      expect(getWCAGLevel(4.49)).toBe("fail");
      expect(getWCAGLevel(1)).toBe("fail");
    });

    it("should use large text thresholds when level is 'large'", () => {
      expect(getWCAGLevel(3, "large")).toBe("aa");
      expect(getWCAGLevel(4.5, "large")).toBe("aaa");
      expect(getWCAGLevel(2.9, "large")).toBe("fail");
    });

    it("should use UI thresholds when level is 'ui'", () => {
      expect(getWCAGLevel(3, "ui")).toBe("aa");
      expect(getWCAGLevel(2.9, "ui")).toBe("fail");
      // AA and AAA thresholds are identical for UI (3:1), so 3:1 returns "aa"
      expect(getWCAGLevel(4.5, "ui")).toBe("aa");
      expect(getWCAGLevel(21, "ui")).toBe("aa");
    });

    it("should default to normal text level", () => {
      expect(getWCAGLevel(7)).toBe("aaa");
      expect(getWCAGLevel(4.5)).toBe("aa");
      expect(getWCAGLevel(3)).toBe("fail");
    });
  });

  describe("suggestAccessiblePair", () => {
    it("should return empty array when pair already passes AA normal", () => {
      const suggestions = suggestAccessiblePair("#000000", "#ffffff");
      expect(suggestions).toHaveLength(0);
    });

    it("should return empty array when pair already passes AAA normal", () => {
      const suggestions = suggestAccessiblePair("#000000", "#ffffff");
      expect(suggestions).toHaveLength(0);
    });

    it("should suggest accessible alternatives when pair fails AA", () => {
      // Gray on white: ~3.95:1 — fails AA normal
      const suggestions = suggestAccessiblePair("#808080", "#ffffff");
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions.length).toBeLessThanOrEqual(3);
      // All suggestions should pass AA normal
      suggestions.forEach((s) => {
        expect(s.passAA).toBe(true);
        expect(s.ratio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it("should return at most 3 suggestions", () => {
      const suggestions = suggestAccessiblePair("#808080", "#ffffff");
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it("should return suggestions sorted by ratio descending", () => {
      const suggestions = suggestAccessiblePair("#808080", "#ffffff");
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i].ratio).toBeLessThanOrEqual(suggestions[i - 1].ratio);
      }
    });

    it("should suggest dark foregrounds on light backgrounds", () => {
      // Light gray on white: poor contrast
      const suggestions = suggestAccessiblePair("#cccccc", "#ffffff");
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      // The best suggestion should be a darker color
      expect(suggestions[0].passAA).toBe(true);
    });

    it("should suggest light foregrounds on dark backgrounds", () => {
      // Dark gray on black: poor contrast
      const suggestions = suggestAccessiblePair("#333333", "#000000");
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions[0].passAA).toBe(true);
    });

    it("should not duplicate the same suggestion", () => {
      const suggestions = suggestAccessiblePair("#808080", "#ffffff");
      const colorPairs = suggestions.map((s) => `${s.fg}|${s.bg}`);
      const unique = new Set(colorPairs);
      expect(unique.size).toBe(suggestions.length);
    });

    it("should return empty array for invalid foreground", () => {
      const suggestions = suggestAccessiblePair("invalid", "#ffffff");
      expect(suggestions).toHaveLength(0);
    });

    it("should return empty array for invalid background", () => {
      const suggestions = suggestAccessiblePair("#000000", "invalid");
      expect(suggestions).toHaveLength(0);
    });

    it("should give each suggestion a description", () => {
      const suggestions = suggestAccessiblePair("#808080", "#ffffff");
      suggestions.forEach((s) => {
        expect(s.description.length).toBeGreaterThan(0);
      });
    });

    it("should produce passing suggestions for various failing pairs", () => {
      const failingPairs: [string, string][] = [
        ["#808080", "#ffffff"],   // gray on white
        ["#cccccc", "#ffffff"],   // light gray on white
        ["#999999", "#f0f0f0"],  // mid gray on light bg
        ["#444444", "#555555"],  // similar dark tones
        ["#a0a0a0", "#c0c0c0"], // similar mid tones
      ];
      for (const [fg, bg] of failingPairs) {
        const suggestions = suggestAccessiblePair(fg, bg);
        expect(suggestions.length).toBeGreaterThanOrEqual(1);
        suggestions.forEach((s) => {
          expect(s.passAA).toBe(true);
        });
      }
    });
  });
});
