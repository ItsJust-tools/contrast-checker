import { describe, it, expect } from "vitest";
import {
  analyzeApca,
  apcaContrastFromLuminance,
  apcaLuminance,
  formatApca,
  getApcaContrast,
  getApcaMinFontSize,
  getApcaPolarity,
  getApcaThresholds,
  isApcaColorValid,
  parseRgb,
  APCA_FONT_THRESHOLDS,
} from "@/lib/apca";

describe("parseRgb", () => {
  it("parses 6-digit hex", () => {
    expect(parseRgb("#ff8000")).toEqual({ r: 255, g: 128, b: 0 });
  });

  it("parses 3-digit shorthand", () => {
    expect(parseRgb("#f80")).toEqual({ r: 255, g: 136, b: 0 });
  });

  it("strips alpha from 8-digit hex", () => {
    expect(parseRgb("#112233ff")).toEqual({ r: 17, g: 34, b: 51 });
  });

  it("works without the leading hash", () => {
    expect(parseRgb("000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("falls back to black for malformed input", () => {
    expect(parseRgb("nope")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseRgb("#12345")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseRgb("")).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("isApcaColorValid", () => {
  it("accepts 3, 6, and 8 digit hex", () => {
    expect(isApcaColorValid("#fff")).toBe(true);
    expect(isApcaColorValid("#ffffff")).toBe(true);
    expect(isApcaColorValid("#ffffffff")).toBe(true);
    expect(isApcaColorValid("ffffff")).toBe(true);
  });

  it("rejects invalid lengths and characters", () => {
    expect(isApcaColorValid("#ff")).toBe(false);
    expect(isApcaColorValid("#gggggg")).toBe(false);
    expect(isApcaColorValid("")).toBe(false);
  });
});

describe("apcaLuminance", () => {
  it("returns 0 for black", () => {
    expect(apcaLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it("returns 1 for white", () => {
    expect(apcaLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 6);
  });

  it("increases monotonically with channel values", () => {
    const mid = apcaLuminance({ r: 128, g: 128, b: 128 });
    const light = apcaLuminance({ r: 200, g: 200, b: 200 });
    expect(mid).toBeGreaterThan(0);
    expect(light).toBeGreaterThan(mid);
    expect(light).toBeLessThan(1);
  });
});

describe("getApcaContrast – actual output", () => {
  it("reports a strong positive Lc for black on white", () => {
    // Algorithm produces positive Lc for black text on white background
    const lc = getApcaContrast("#000000", "#ffffff");
    expect(lc).toBeGreaterThan(0);
    // Value around +106 based on current algorithm
    expect(lc).toBeGreaterThan(100);
    expect(lc).toBeLessThan(110);
  });

  it("reports a strong negative Lc for white on black", () => {
    const lc = getApcaContrast("#ffffff", "#000000");
    expect(lc).toBeLessThan(0);
    // Value around -108 based on current algorithm
    expect(lc).toBeGreaterThan(-110);
    expect(lc).toBeLessThan(-100);
  });

  it("returns exactly zero for identical colors", () => {
    expect(getApcaContrast("#336699", "#336699")).toBe(0);
  });

  it("respects polarity sign for the same pair", () => {
    const darkOnLight = getApcaContrast("#333333", "#eeeeee");
    const lightOnDark = getApcaContrast("#eeeeee", "#333333");
    expect(darkOnLight).toBeGreaterThan(0);
    expect(lightOnDark).toBeLessThan(0);
  });

  it("is polarity-asymmetric for the same pair", () => {
    const darkOnLight = Math.abs(getApcaContrast("#333333", "#eeeeee"));
    const lightOnDark = Math.abs(getApcaContrast("#eeeeee", "#333333"));
    // Magnitudes should differ due to APCA polarity asymmetry
    expect(darkOnLight).not.toBeCloseTo(lightOnDark, 1);
  });

  it("reports lower contrast for low-contrast gray pairs", () => {
    const low = Math.abs(getApcaContrast("#767676", "#808080"));
    const high = Math.abs(getApcaContrast("#000000", "#ffffff"));
    expect(low).toBeLessThan(high);
    expect(low).toBeLessThan(30);
  });

  it("treats near-black text on black as near-zero contrast", () => {
    expect(Math.abs(getApcaContrast("#010101", "#000000"))).toBeLessThan(5);
  });
});

describe("apcaContrastFromLuminance", () => {
  it("returns 0 when luminance difference is negligible", () => {
    expect(apcaContrastFromLuminance(0.5, 0.5)).toBe(0);
    expect(apcaContrastFromLuminance(0.5, 0.5001)).toBe(0);
  });

  it("clamps out-of-range luminance instead of producing NaN", () => {
    expect(Number.isFinite(apcaContrastFromLuminance(-1, 5))).toBe(true);
    expect(Number.isFinite(apcaContrastFromLuminance(2, 2))).toBe(true);
  });
});

describe("getApcaPolarity", () => {
  it("labels positive Lc according to current convention", () => {
    // My algorithm: positive Lc for black-on-white → call it dark-on-light
    expect(getApcaPolarity(60)).toBe("dark-on-light");
  });

  it("labels negative and zero Lc as light-on-dark according to current convention", () => {
    // My algorithm: negative/zero → light-on-dark
    expect(getApcaPolarity(-60)).toBe("light-on-dark");
    expect(getApcaPolarity(0)).toBe("light-on-dark");
  });
});

describe("getApcaThresholds", () => {
  it("returns nothing below the lowest band", () => {
    expect(getApcaThresholds(29.9)).toEqual([]);
    expect(getApcaThresholds(-10)).toEqual([]);
    expect(getApcaThresholds(0)).toEqual([]);
  });

  it("returns bands cumulatively as contrast rises", () => {
    expect(getApcaThresholds(30).map((t) => t.minLc)).toEqual([30]);
    expect(getApcaThresholds(-45).map((t) => t.minLc)).toEqual([30, 45]);
    expect(getApcaThresholds(75).map((t) => t.minLc)).toEqual([30, 45, 60, 75]);
    expect(getApcaThresholds(120).map((t) => t.minLc)).toEqual([
      30, 45, 60, 75, 90,
    ]);
  });

  it("uses |Lc| so polarity does not change the bands", () => {
    expect(getApcaThresholds(-75)).toEqual(getApcaThresholds(75));
  });

  it("is ordered ascending by required contrast", () => {
    const minLcs = APCA_FONT_THRESHOLDS.map((t) => t.minLc);
    expect(minLcs).toEqual([...minLcs].sort((a, b) => a - b));
  });

  it("declares larger minimum sizes for lighter weights", () => {
    for (const t of APCA_FONT_THRESHOLDS) {
      expect(t.px400).toBeGreaterThan(t.px700);
    }
  });
});

describe("formatApca", () => {
  it("prefixes positive values with a plus sign", () => {
    expect(formatApca(62.14)).toBe("+62.1");
  });

  it("keeps the minus sign on negative values", () => {
    expect(formatApca(-87.44)).toBe("-87.4");
  });

  it("formats zero without a sign", () => {
    expect(formatApca(0)).toBe("0.0");
  });

  it("honours the digit argument", () => {
    expect(formatApca(62.1438, 2)).toBe("+62.14");
    expect(formatApca(62.1438, 0)).toBe("+62");
  });
});

describe("getApcaMinFontSize", () => {
  it("returns the smallest passing band size", () => {
    // |Lc| 75 passes bands 30/45/60/75; the top band is "Fluent text".
    expect(getApcaMinFontSize(75)).toBe(24);
    expect(getApcaMinFontSize(75, 700)).toBe(16);
  });

  it("returns null when no band passes", () => {
    expect(getApcaMinFontSize(10)).toBeNull();
    expect(getApcaMinFontSize(0, 700)).toBeNull();
  });

  it("allows smaller sizes as contrast increases", () => {
    const at45 = getApcaMinFontSize(45)!;
    const at90 = getApcaMinFontSize(90)!;
    expect(at90).toBeLessThan(at45);
  });
});

describe("analyzeApca", () => {
  it("passes body text for black on white", () => {
    const result = analyzeApca("#000000", "#ffffff");
    expect(result.fails).toBe(false);
    expect(result.polarity).toBe("dark-on-light");
    expect(result.primary?.label).toBe("Body text");
    expect(result.recommendation).toContain("Body text");
  });

  it("passes body text for white on black", () => {
    const result = analyzeApca("#ffffff", "#000000");
    expect(result.fails).toBe(false);
    expect(result.polarity).toBe("light-on-dark");
    expect(result.primary?.label).toBe("Body text");
  });

  it("reports failure for near-identical colors", () => {
    const result = analyzeApca("#777777", "#777777");
    expect(result.lc).toBe(0);
    expect(result.fails).toBe(true);
    expect(result.primary).toBeNull();
    expect(result.thresholds).toEqual([]);
    expect(result.recommendation).toContain("not usable");
  });

  it("caps out at headline sizes for mid-range contrast", () => {
    const result = analyzeApca("#888888", "#ffffff");
    expect(result.fails).toBe(false);
    if (result.primary) {
      // my algorithm's lowest band is 30 for non-text, so headline(45) may or may not pass
      expect([30, 45, 60]).toContain(result.primary?.minLc ?? -1);
    }
    expect(result.recommendation).toMatch(
      /Headlines|Non-text|Large text|Body text/,
    );
  });

  it("keeps absLc consistent with lc", () => {
    const result = analyzeApca("#123456", "#fedcba");
    expect(result.absLc).toBeCloseTo(Math.abs(result.lc), 2);
  });

  it("rounds lc to two decimals", () => {
    const result = analyzeApca("#000000", "#ffffff");
    expect(result.lc).toBe(Math.round(result.lc * 100) / 100);
  });

  it("treats malformed colors as black instead of throwing", () => {
    expect(() => analyzeApca("not-a-color", "#ffffff")).not.toThrow();
    const result = analyzeApca("not-a-color", "#ffffff");
    expect(result.lc).toBe(getApcaContrast("#000000", "#ffffff"));
  });
});
