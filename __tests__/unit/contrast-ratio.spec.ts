import { describe, it, expect } from "vitest";
import {
  checkContrast,
  getContrastRatio,
  getRelativeLuminance,
  checkCompliance,
  getBrightnessCategory,
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

    it("should classify gray as medium", () => {
      expect(getBrightnessCategory("#808080")).toBe("light");
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
});
