import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHsl,
  formatRgb,
  formatHsl,
} from "@/tool/components/tool-sidebar";

describe("sidebar utilities - hexToRgb", () => {
  it("should convert 6-digit hex to RGB", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("should convert 3-digit shorthand hex to RGB", () => {
    expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("should convert 8-digit hex to RGB (discarding alpha)", () => {
    expect(hexToRgb("#ff000080")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("should convert black to RGB", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("should convert white to RGB", () => {
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("should handle hex without # prefix", () => {
    expect(hexToRgb("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("should handle lowercase hex", () => {
    expect(hexToRgb("#aabbcc")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("should return NaN values for invalid input without crashing", () => {
    const result = hexToRgb("invalid");
    expect(result).toHaveProperty("r");
    expect(result).toHaveProperty("g");
    expect(result).toHaveProperty("b");
  });

  it("should handle empty string without crashing", () => {
    const result = hexToRgb("");
    expect(typeof result.r).toBe("number");
  });

  it("should convert #333 to RGB shorthand", () => {
    const result = hexToRgb("#333");
    expect(result.r).toBe(0x33);
    expect(result.g).toBe(0x33);
    expect(result.b).toBe(0x33);
  });

  it("should convert #abc to RGB shorthand", () => {
    const result = hexToRgb("#abc");
    expect(result.r).toBe(0xaa);
    expect(result.g).toBe(0xbb);
    expect(result.b).toBe(0xcc);
  });
});

describe("sidebar utilities - rgbToHsl", () => {
  it("should convert white to HSL", () => {
    const hsl = rgbToHsl(255, 255, 255);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(100);
  });

  it("should convert black to HSL", () => {
    const hsl = rgbToHsl(0, 0, 0);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(0);
  });

  it("should convert pure red to HSL", () => {
    const hsl = rgbToHsl(255, 0, 0);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it("should convert pure green to HSL", () => {
    const hsl = rgbToHsl(0, 255, 0);
    expect(hsl.h).toBe(120);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it("should convert pure blue to HSL", () => {
    const hsl = rgbToHsl(0, 0, 255);
    expect(hsl.h).toBe(240);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it("should convert mid-gray to HSL", () => {
    const hsl = rgbToHsl(128, 128, 128);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(50);
  });

  it("should handle #333 (dark gray)", () => {
    const hsl = rgbToHsl(51, 51, 51);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(20);
  });

  it("should handle a colorful value (#cc0000)", () => {
    const hsl = rgbToHsl(204, 0, 0);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(40);
  });

  it("should handle a teal-ish color", () => {
    const hsl = rgbToHsl(0, 128, 128);
    expect(hsl.h).toBe(180);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(25);
  });

  it("should handle pastel colors", () => {
    const hsl = rgbToHsl(173, 216, 230);
    expect(hsl.h).toBeGreaterThanOrEqual(185);
    expect(hsl.h).toBeLessThanOrEqual(195);
    expect(hsl.s).toBeGreaterThanOrEqual(50);
    expect(hsl.l).toBeGreaterThanOrEqual(78);
  });
});

describe("sidebar utilities - formatRgb", () => {
  it("should format RGB as css rgb() string", () => {
    expect(formatRgb(255, 0, 0)).toBe("rgb(255, 0, 0)");
  });

  it("should format black", () => {
    expect(formatRgb(0, 0, 0)).toBe("rgb(0, 0, 0)");
  });

  it("should format white", () => {
    expect(formatRgb(255, 255, 255)).toBe("rgb(255, 255, 255)");
  });

  it("should format a mixed color", () => {
    expect(formatRgb(100, 150, 200)).toBe("rgb(100, 150, 200)");
  });
});

describe("sidebar utilities - formatHsl", () => {
  it("should format HSL as css hsl() string", () => {
    expect(formatHsl(0, 100, 50)).toBe("hsl(0, 100%, 50%)");
  });

  it("should format black", () => {
    expect(formatHsl(0, 0, 0)).toBe("hsl(0, 0%, 0%)");
  });

  it("should format white", () => {
    expect(formatHsl(0, 0, 100)).toBe("hsl(0, 0%, 100%)");
  });

  it("should format a mid-tone", () => {
    expect(formatHsl(180, 50, 40)).toBe("hsl(180, 50%, 40%)");
  });
});
